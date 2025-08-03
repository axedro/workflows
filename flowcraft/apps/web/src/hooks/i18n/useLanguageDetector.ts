import { useState, useEffect } from 'react';
import { useTranslation } from './useTranslation';

export interface LanguageInfo {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  flagEmoji?: string;
  isActive: boolean;
  isDefault: boolean;
}

export interface UseLanguageDetectorReturn {
  currentLanguage: string;
  availableLanguages: LanguageInfo[];
  isLoading: boolean;
  error: string | null;
  changeLanguage: (code: string) => Promise<void>;
  detectBrowserLanguage: () => string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Hook for language detection and management
 */
export function useLanguageDetector(): UseLanguageDetectorReturn {
  const { language, changeLanguage: i18nChangeLanguage } = useTranslation();
  const [availableLanguages, setAvailableLanguages] = useState<LanguageInfo[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch available languages from API
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/i18n/languages`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setAvailableLanguages(data.languages || []);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch languages';
        setError(errorMessage);
        console.error('Failed to fetch available languages:', err);

        // Fallback to default languages
        setAvailableLanguages([
          {
            id: 'es-default',
            code: 'es',
            name: 'Spanish',
            nativeName: 'Español',
            flagEmoji: '🇪🇸',
            isActive: true,
            isDefault: true,
          },
          {
            id: 'en-default',
            code: 'en',
            name: 'English',
            nativeName: 'English',
            flagEmoji: '🇺🇸',
            isActive: true,
            isDefault: false,
          },
          {
            id: 'nl-default',
            code: 'nl',
            name: 'Dutch',
            nativeName: 'Nederlands',
            flagEmoji: '🇳🇱',
            isActive: true,
            isDefault: false,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLanguages();
  }, []);

  // Detect browser language
  const detectBrowserLanguage = (): string => {
    // Check navigator languages
    const browserLanguages = navigator.languages || [navigator.language];
    const supportedCodes = availableLanguages.map(lang => lang.code);

    for (const browserLang of browserLanguages) {
      // Extract main language code (e.g., 'en-US' -> 'en')
      const langCode = browserLang.toLowerCase().split('-')[0];

      if (supportedCodes.includes(langCode)) {
        return langCode;
      }
    }

    // Fallback to default language
    const defaultLang = availableLanguages.find(lang => lang.isDefault);
    return defaultLang?.code || 'es';
  };

  // Enhanced language change with API integration
  const changeLanguage = async (code: string): Promise<void> => {
    try {
      // Validate language is supported
      const isSupported = availableLanguages.some(lang => lang.code === code);
      if (!isSupported) {
        throw new Error(`Language ${code} is not supported`);
      }

      // Change language in i18next
      await i18nChangeLanguage(code);

      // TODO: Update user preference in backend if authenticated
      // const user = useAuthStore.getState().user;
      // if (user) {
      //   await updateUserLanguagePreference(code);
      // }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to change language';
      setError(errorMessage);
      throw err;
    }
  };

  return {
    currentLanguage: language,
    availableLanguages,
    isLoading,
    error,
    changeLanguage,
    detectBrowserLanguage,
  };
}
