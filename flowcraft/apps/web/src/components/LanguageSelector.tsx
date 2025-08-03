import { useState, useRef, useEffect } from 'react';
import { useLanguageDetector } from '../hooks/i18n';

interface LanguageSelectorProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'dropdown' | 'flags' | 'compact';
}

/**
 * Language selector component with flag support
 */
export default function LanguageSelector({
  className = '',
  showLabel = false,
  variant = 'dropdown',
}: LanguageSelectorProps) {
  const {
    currentLanguage,
    availableLanguages,
    isLoading,
    error,
    changeLanguage,
  } = useLanguageDetector();

  const [isOpen, setIsOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode === currentLanguage || isChanging) return;

    try {
      setIsChanging(true);
      await changeLanguage(languageCode);
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to change language:', err);
    } finally {
      setIsChanging(false);
    }
  };

  const currentLang = availableLanguages.find(
    lang => lang.code === currentLanguage
  );

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="w-8 h-8 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    console.error('Language selector error:', error);
    return null;
  }

  // Compact variant - just flags
  if (variant === 'compact') {
    return (
      <div className={`flex space-x-1 ${className}`}>
        {availableLanguages.map(lang => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            disabled={isChanging}
            className={`
              w-8 h-8 rounded-full flex items-center justify-center text-lg
              transition-all duration-200 hover:scale-110
              ${
                lang.code === currentLanguage
                  ? 'ring-2 ring-blue-500 bg-blue-50'
                  : 'hover:bg-gray-100'
              }
              ${isChanging ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            title={`${lang.name} (${lang.nativeName})`}
          >
            {lang.flagEmoji || '🌐'}
          </button>
        ))}
      </div>
    );
  }

  // Flags variant - horizontal flags with labels
  if (variant === 'flags') {
    return (
      <div className={`flex space-x-2 ${className}`}>
        {availableLanguages.map(lang => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            disabled={isChanging}
            className={`
              flex items-center space-x-2 px-3 py-2 rounded-lg
              transition-all duration-200 hover:bg-gray-100
              ${
                lang.code === currentLanguage
                  ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                  : 'text-gray-700 hover:text-gray-900'
              }
              ${isChanging ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span className="text-lg">{lang.flagEmoji || '🌐'}</span>
            {showLabel && (
              <span className="text-sm font-medium">{lang.nativeName}</span>
            )}
          </button>
        ))}
      </div>
    );
  }

  // Dropdown variant (default)
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isChanging}
        className={`
          flex items-center space-x-2 px-3 py-2 rounded-lg
          border border-gray-200 bg-white hover:bg-gray-50
          transition-colors duration-200
          ${isChanging ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="text-lg">{currentLang?.flagEmoji || '🌐'}</span>
        {showLabel && (
          <span className="text-sm font-medium text-gray-700">
            {currentLang?.nativeName || 'Language'}
          </span>
        )}
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="py-1">
            {availableLanguages.map(lang => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                disabled={isChanging}
                className={`
                  w-full flex items-center space-x-3 px-4 py-2 text-left
                  transition-colors duration-200
                  ${
                    lang.code === currentLanguage
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }
                  ${isChanging ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <span className="text-lg">{lang.flagEmoji || '🌐'}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{lang.nativeName}</div>
                  <div className="text-xs text-gray-500">{lang.name}</div>
                </div>
                {lang.code === currentLanguage && (
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {isChanging && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}
