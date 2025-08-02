import React, { Suspense, useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from './config';
import Loading from '../components/Loading';

interface I18nProviderProps {
  children: React.ReactNode;
}

/**
 * I18n Provider component that wraps the app with i18next
 */
export function I18nProvider({ children }: I18nProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for i18n to be initialized
    const checkReady = () => {
      if (i18n.isInitialized) {
        setIsReady(true);
      } else {
        // Check again after a short delay
        setTimeout(checkReady, 100);
      }
    };

    checkReady();

    // Listen for language changes
    const handleLanguageChanged = () => {
      // Force re-render when language changes
      setIsReady(false);
      setTimeout(() => setIsReady(true), 100);
    };

    i18n.on('languageChanged', handleLanguageChanged);
    i18n.on('loaded', handleLanguageChanged);

    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
      i18n.off('loaded', handleLanguageChanged);
    };
  }, []);

  if (!isReady) {
    return <Loading />;
  }

  return (
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={<Loading />}>
        {children}
      </Suspense>
    </I18nextProvider>
  );
}