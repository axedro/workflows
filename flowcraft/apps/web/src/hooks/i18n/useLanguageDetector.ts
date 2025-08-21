import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

// Type declarations for Vite
declare global {
  interface ImportMetaEnv {
    readonly VITE_API_URL: string
    readonly DEV: boolean
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}

export interface LanguageInfo {
  code: string;
  name: string;
  flag: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'es', name: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱', nativeName: 'Nederlands' },
];

export function useLanguageDetector() {
  const { i18n } = useTranslation();
  const initialLang =
    (typeof window !== 'undefined' && (localStorage.getItem('i18nextLng') || '')) ||
    i18n.language ||
    'es';
  const [currentLanguage, setCurrentLanguage] = useState<string>(initialLang);

  // Detect browser language
  const detectBrowserLanguage = (): string => {
    // Check navigator languages
    const browserLanguages = navigator.languages || [navigator.language];
    const supportedCodes = SUPPORTED_LANGUAGES.map(lang => lang.code);

    for (const browserLang of browserLanguages) {
      // Try exact match first
      if (supportedCodes.includes(browserLang)) {
        return browserLang;
      }

      // Try language code match (e.g., 'en-US' -> 'en')
      const langCode = browserLang.split('-')[0];
      if (supportedCodes.includes(langCode)) {
        return langCode;
      }
    }

    // Fallback to default language
    return 'es';
  };

  // Change language
  const changeLanguage = async (code: string): Promise<void> => {
    try {
      // Validate language is supported
      const isSupported = SUPPORTED_LANGUAGES.some(lang => lang.code === code);
      if (!isSupported) {
        throw new Error(`Language ${code} is not supported`);
      }

      // Change language in i18next
      await i18n.changeLanguage(code);
      // Persist selection
      if (typeof window !== 'undefined') {
        localStorage.setItem('i18nextLng', code);
        document.documentElement.lang = code;
      }
      setCurrentLanguage(code);

      // TODO: Update user preference in backend if authenticated
      // This would typically involve calling an API endpoint
    } catch (err) {
      console.error('Failed to change language:', err);
      throw err;
    }
  };

  // Sync state with i18n changes
  useEffect(() => {
    const handler = (lng?: string) => {
      const code = lng || i18n.language || 'es';
      setCurrentLanguage(code);
      if (typeof window !== 'undefined') {
        localStorage.setItem('i18nextLng', code);
        document.documentElement.lang = code;
      }
    };
    handler(i18n.language);
    i18n.on('languageChanged', handler);
    return () => {
      i18n.off('languageChanged', handler);
    };
  }, [i18n]);

  return {
    currentLanguage,
    availableLanguages: SUPPORTED_LANGUAGES,
    isLoading: false,
    error: null,
    changeLanguage,
    detectBrowserLanguage,
  };
}
