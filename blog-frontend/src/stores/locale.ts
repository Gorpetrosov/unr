import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { AppLocale } from '@/i18n';

export const useLocaleStore = defineStore('locale', () => {
  const locale = ref<AppLocale>(
    (localStorage.getItem('locale') as AppLocale) ||
      (import.meta.env.VITE_DEFAULT_LOCALE as AppLocale) ||
      'en'
  );

  function setLocale(next: AppLocale) {
    locale.value = next;
    localStorage.setItem('locale', next);
    document.documentElement.lang = next;
  }

  return { locale, setLocale };
});

export function syncI18nLocale() {
  const store = useLocaleStore();
  const { locale } = useI18n();
  watch(
    () => store.locale,
    (v) => {
      locale.value = v;
      document.documentElement.lang = v;
    },
    { immediate: true }
  );
}
