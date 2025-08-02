import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

i18n
  // Load translations using http backend
  .use(Backend)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Language settings
    lng: 'es', // Default language
    fallbackLng: ['en', 'es'], // Fallback languages
    supportedLngs: ['es', 'en', 'nl'], // Supported languages
    
    // Backend configuration
    backend: {
      // Load from our API endpoints
      loadPath: `${API_BASE_URL}/i18n/translations/{{lng}}/{{ns}}`,
      
      // Request options
      requestOptions: {
        cache: 'default',
        credentials: 'include',
        mode: 'cors',
      },
      
      // Custom request function to handle our API format
      request: async (_options: any, url: string, _payload: any, callback: any) => {
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const data = await response.json();
          
          // Our API returns { language, namespace, translations }
          // i18next expects just the translations object
          callback(null, {
            status: response.status,
            data: data.translations || {}
          });
        } catch (error) {
          console.warn(`Failed to load translations from ${url}:`, error);
          callback(error, {
            status: 500,
            data: {}
          });
        }
      }
    },

    // Language detection settings
    detection: {
      // Detection order
      order: [
        'querystring',     // ?lng=en
        'localStorage',    // localStorage
        'navigator',       // browser language
        'htmlTag',         // html lang attribute
        'path',           // /en/page
        'subdomain'       // en.example.com
      ],
      
      // Keys to look for
      lookupQuerystring: 'lng',
      lookupLocalStorage: 'i18nextLng',
      
      // Cache user language
      caches: ['localStorage'],
      
      // Don't cache on these domains
      excludeCacheFor: ['cimode'],
      
      // Check if language is supported
      // checkWhitelist: true
    },

    // Namespace settings
    ns: ['common', 'auth', 'dashboard', 'landing'], // Default namespaces
    defaultNS: 'common', // Default namespace
    
    // Interpolation settings
    interpolation: {
      escapeValue: false, // React already escapes values
      format: (value, format) => {
        if (format === 'uppercase') return value.toUpperCase();
        if (format === 'lowercase') return value.toLowerCase();
        if (format === 'capitalize') return value.charAt(0).toUpperCase() + value.slice(1);
        return value;
      }
    },

    // React settings
    react: {
      useSuspense: false, // We'll handle loading states manually
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
      transEmptyNodeValue: '', // Return empty string for empty nodes
      transSupportBasicHtmlNodes: true, // Support basic HTML in translations
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em'], // Allowed HTML tags
    },

    // Development settings
    debug: import.meta.env.DEV, // Enable debug in development
    
    // Performance settings
    load: 'languageOnly', // Load only language (not region)
    preload: ['es', 'en'], // Preload these languages
    
    // Error handling
    saveMissing: import.meta.env.DEV, // Save missing keys in development
    missingKeyHandler: (lng, ns, key) => {
      if (import.meta.env.DEV) {
        console.warn(`Missing translation: ${lng}.${ns}.${key}`);
      }
    },

    // Pluralization
    pluralSeparator: '_',
    contextSeparator: '_',
    
    // Return objects for complex translations
    returnObjects: false,
    returnEmptyString: true,
    returnNull: false,
  });

// Hot reload in development
if (import.meta.env.DEV && import.meta.hot) {
  import.meta.hot.accept(() => {
    // Reload translations when files change
    i18n.reloadResources();
  });
}

export default i18n;