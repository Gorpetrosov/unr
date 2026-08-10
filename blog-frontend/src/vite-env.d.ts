/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, unknown>;
  export default component;
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_SITE_NAME: string;
  readonly VITE_SITE_URL: string;
  readonly VITE_DEFAULT_LOCALE: string;
  readonly VITE_WEATHER_LAT: string;
  readonly VITE_WEATHER_LON: string;
  readonly VITE_WEATHER_LABEL: string;
  readonly VITE_CURRENCY_BASE: string;
  readonly VITE_CURRENCY_SYMBOLS: string;
  readonly VITE_ADSENSE_CLIENT: string;
  readonly VITE_ADSENSE_SLOT: string;
  readonly VITE_EXCHANGERATE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
