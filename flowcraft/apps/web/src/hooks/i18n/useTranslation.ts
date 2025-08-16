import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useCallback } from 'react';

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

export interface TranslationParams {
  [key: string]: string | number | boolean | Date;
}

export interface UseTranslationReturn {
  t: (key: string, params?: TranslationParams) => string;
  i18n: any;
  ready: boolean;
  language: string;
  changeLanguage: (lng: string) => Promise<void>;
  hasTranslation: (key: string) => boolean;
}

/**
 * Enhanced useTranslation hook with additional features
 */
export function useTranslation(
  namespace?: string | string[],
  options?: any // UseTranslationOptions<any> // This type is not imported, so using 'any' for now
): UseTranslationReturn {
  const {
    t: originalT,
    i18n,
    ready,
  } = useI18nTranslation(namespace, {
    useSuspense: false,
    ...options,
  });

  // Enhanced translation function with better type safety
  const t = useCallback(
    (key: string, params?: TranslationParams): string => {
      try {
        // If not ready, return key as fallback
        if (!ready) {
          return key;
        }

        // Handle interpolation parameters
        const translationOptions: any = {};

        if (params) {
          // Convert Date objects to localized strings
          const processedParams: any = {};
          Object.entries(params).forEach(([paramKey, value]) => {
            if (value instanceof Date) {
              processedParams[paramKey] = value.toLocaleDateString(
                i18n.language
              );
            } else {
              processedParams[paramKey] = value;
            }
          });
          translationOptions.replace = processedParams;
        }

        const result = originalT(key, translationOptions);

        // Check if we got a valid translation
        if (typeof result === 'string' && result !== key) {
          return result;
        }

        // Return the key if translation is missing and we're in development
        if (result === key && import.meta.env.DEV) {
          console.warn(
            `Missing translation for key: ${key} in language: ${i18n.language}`
          );
        }

        return String(result);
      } catch (error) {
        console.error(`Translation error for key "${key}":`, error);
        return key; // Fallback to key
      }
    },
    [originalT, i18n, ready]
  );

  // Enhanced language change function with error handling
  const changeLanguage = useCallback(
    async (lng: string): Promise<void> => {
      try {
        await i18n.changeLanguage(lng);

        // Store preference in localStorage
        localStorage.setItem('i18nextLng', lng);

        // Emit custom event for other components to listen
        window.dispatchEvent(
          new CustomEvent('languageChanged', {
            detail: { language: lng },
          })
        );
      } catch (error) {
        console.error(`Failed to change language to ${lng}:`, error);
        throw error;
      }
    },
    [i18n]
  );

  // Check if a translation exists
  const hasTranslation = useCallback(
    (key: string): boolean => {
      return i18n.exists(key);
    },
    [i18n]
  );

  return {
    t,
    i18n,
    ready,
    language: i18n.language,
    changeLanguage,
    hasTranslation,
  };
}
