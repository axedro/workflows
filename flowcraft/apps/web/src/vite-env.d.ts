/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly DEV: boolean;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
  readonly hot?: {
    accept: (fn: () => void) => void;
  };
}
