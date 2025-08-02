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
  const [loadedNamespaces, setLoadedNamespaces] = useState<Set<string>>(new Set());

  useEffect(() => {
    const requiredNamespaces = ['common', 'auth', 'landing', 'dashboard'];
    
    // Check if all required namespaces are loaded
    const checkAllNamespacesLoaded = () => {
      const currentLanguage = i18n.language || 'es';
      const allLoaded = requiredNamespaces.every(ns => 
        i18n.hasResourceBundle(currentLanguage, ns)
      );
      
      if (allLoaded && i18n.isInitialized) {
        setIsReady(true);
      }
    };

    // Initial check
    checkAllNamespacesLoaded();

    // Listen for resource loading events
    const handleResourcesLoaded = (lng: string, ns: string) => {
      setLoadedNamespaces(prev => new Set([...prev, `${lng}:${ns}`]));
      checkAllNamespacesLoaded();
    };

    const handleLanguageChanged = (lng: string) => {
      setIsReady(false);
      setLoadedNamespaces(new Set());
      // Give some time for resources to load
      setTimeout(checkAllNamespacesLoaded, 500);
    };

    const handleInitialized = () => {
      checkAllNamespacesLoaded();
    };

    // Add event listeners
    i18n.on('loaded', handleResourcesLoaded);
    i18n.on('languageChanged', handleLanguageChanged);
    i18n.on('initialized', handleInitialized);

    return () => {
      i18n.off('loaded', handleResourcesLoaded);
      i18n.off('languageChanged', handleLanguageChanged);
      i18n.off('initialized', handleInitialized);
    };
  }, []);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loading />
          <p className="mt-4 text-sm text-gray-600">
            Cargando traducciones... ({loadedNamespaces.size} namespaces cargados)
          </p>
        </div>
      </div>
    );
  }

  return (
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={<Loading />}>
        {children}
      </Suspense>
    </I18nextProvider>
  );
}