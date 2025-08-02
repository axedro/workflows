import { prisma } from '../../../../packages/database/dist/index.js';
import Redis from 'redis';

// Redis client for caching
const redis = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redis.on('error', (err) => console.error('Redis Client Error', err));
redis.connect();

export interface TranslationData {
  [key: string]: string;
}

export interface LanguageInfo {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  flagEmoji?: string;
  isActive: boolean;
  isDefault: boolean;
}

export class I18nService {
  private static readonly CACHE_TTL = 3600; // 1 hour
  private static readonly CACHE_PREFIX = 'i18n:';

  /**
   * Get all active languages
   */
  async getLanguages(): Promise<LanguageInfo[]> {
    const cacheKey = `${I18nService.CACHE_PREFIX}languages`;
    
    try {
      // Try to get from cache
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.warn('Redis cache error:', error);
    }

    // Get from database
    const languages = await prisma.language.findMany({
      where: { isActive: true },
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' }
      ]
    });

    const result: LanguageInfo[] = languages.map(lang => ({
      id: lang.id,
      code: lang.code,
      name: lang.name,
      nativeName: lang.nativeName,
      flagEmoji: lang.flagEmoji || undefined,
      isActive: lang.isActive,
      isDefault: lang.isDefault
    }));

    // Cache the result
    try {
      await redis.setEx(cacheKey, I18nService.CACHE_TTL, JSON.stringify(result));
    } catch (error) {
      console.warn('Redis cache set error:', error);
    }

    return result;
  }

  /**
   * Get translations for a specific language and namespace
   */
  async getTranslations(languageCode: string, namespace?: string): Promise<TranslationData> {
    const cacheKey = `${I18nService.CACHE_PREFIX}translations:${languageCode}:${namespace || 'all'}`;
    
    try {
      // Try to get from cache
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.warn('Redis cache error:', error);
    }

    // Get from database
    const whereClause: any = {
      language: { code: languageCode },
      key: { isActive: true },
      isApproved: true
    };

    if (namespace) {
      whereClause.key.namespace = namespace;
    }

    const translations = await prisma.translation.findMany({
      where: whereClause,
      include: {
        key: true
      }
    });

    // Transform to key-value format
    const result: TranslationData = {};
    translations.forEach(translation => {
      result[translation.key.key] = translation.value;
    });

    // Cache the result
    try {
      await redis.setEx(cacheKey, I18nService.CACHE_TTL, JSON.stringify(result));
    } catch (error) {
      console.warn('Redis cache set error:', error);
    }

    return result;
  }

  /**
   * Get translation with fallback support
   */
  async getTranslation(key: string, languageCode: string): Promise<string> {
    // Try requested language
    let translations = await this.getTranslations(languageCode);
    if (translations[key]) {
      return translations[key];
    }

    // Fallback to English
    if (languageCode !== 'en') {
      translations = await this.getTranslations('en');
      if (translations[key]) {
        return translations[key];
      }
    }

    // Fallback to Spanish (default)
    if (languageCode !== 'es') {
      translations = await this.getTranslations('es');
      if (translations[key]) {
        return translations[key];
      }
    }

    // Return key if no translation found
    console.warn(`Translation not found for key: ${key} in language: ${languageCode}`);
    return key;
  }

  /**
   * Get default language
   */
  async getDefaultLanguage(): Promise<LanguageInfo | null> {
    const languages = await this.getLanguages();
    return languages.find(lang => lang.isDefault) || null;
  }

  /**
   * Detect language from Accept-Language header
   */
  detectLanguageFromHeader(acceptLanguageHeader?: string): string {
    if (!acceptLanguageHeader) {
      return 'es'; // Default fallback
    }

    // Parse Accept-Language header
    const languages = acceptLanguageHeader
      .split(',')
      .map(lang => {
        const [code, q = '1'] = lang.trim().split(';q=');
        return {
          code: code.toLowerCase().split('-')[0], // Get main language code
          quality: parseFloat(q)
        };
      })
      .sort((a, b) => b.quality - a.quality);

    // Check if we support any of the preferred languages
    const supportedLanguages = ['es', 'en', 'nl'];
    for (const lang of languages) {
      if (supportedLanguages.includes(lang.code)) {
        return lang.code;
      }
    }

    return 'es'; // Default fallback
  }

  /**
   * Invalidate cache for translations
   */
  async invalidateCache(languageCode?: string, namespace?: string): Promise<void> {
    try {
      if (languageCode && namespace) {
        // Invalidate specific cache
        const cacheKey = `${I18nService.CACHE_PREFIX}translations:${languageCode}:${namespace}`;
        await redis.del(cacheKey);
      } else if (languageCode) {
        // Invalidate all namespaces for a language
        const pattern = `${I18nService.CACHE_PREFIX}translations:${languageCode}:*`;
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(keys);
        }
      } else {
        // Invalidate all translation caches
        const pattern = `${I18nService.CACHE_PREFIX}*`;
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(keys);
        }
      }
    } catch (error) {
      console.warn('Redis cache invalidation error:', error);
    }
  }

  /**
   * Create or update a translation
   */
  async upsertTranslation(
    languageCode: string,
    key: string,
    value: string,
    approvedBy?: string
  ): Promise<void> {
    // Find or create translation key
    let translationKey = await prisma.translationKey.findUnique({
      where: { key }
    });

    if (!translationKey) {
      // Extract namespace from key (e.g., 'auth.login.title' -> 'auth')
      const namespace = key.split('.')[0];
      translationKey = await prisma.translationKey.create({
        data: {
          key,
          namespace,
          category: 'auto-generated',
          description: `Auto-generated key for ${key}`
        }
      });
    }

    // Find language
    const language = await prisma.language.findUnique({
      where: { code: languageCode }
    });

    if (!language) {
      throw new Error(`Language ${languageCode} not found`);
    }

    // Upsert translation
    await prisma.translation.upsert({
      where: {
        languageId_keyId: {
          languageId: language.id,
          keyId: translationKey.id
        }
      },
      update: {
        value,
        isApproved: !!approvedBy,
        approvedBy,
        approvedAt: approvedBy ? new Date() : null
      },
      create: {
        languageId: language.id,
        keyId: translationKey.id,
        value,
        isApproved: !!approvedBy,
        approvedBy,
        approvedAt: approvedBy ? new Date() : null
      }
    });

    // Invalidate cache
    await this.invalidateCache(languageCode);
  }
}

// Export singleton instance
export const i18nService = new I18nService();