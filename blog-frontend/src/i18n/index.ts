import { createI18n } from 'vue-i18n';

const messages = {
  en: {
    brand: 'Horizon Notes',
    tagline: 'Essays, notes, and dispatches in two languages.',
    nav: {
      home: 'Home',
      search: 'Search',
      about: 'About',
    },
    home: {
      latest: 'Latest articles',
      readMore: 'Read article',
      empty: 'No published articles yet.',
    },
    article: {
      views: '{n} views',
      shares: '{n} shares',
      share: 'Share',
      related: 'Keep reading',
      copied: 'Link copied',
    },
    search: {
      title: 'Search',
      placeholder: 'Search articles…',
      results: '{n} results',
      empty: 'No articles matched your query.',
      hint: 'Search titles and content in English and Russian.',
    },
    widgets: {
      weather: 'Weather',
      rates: 'Exchange rates',
      loading: 'Loading…',
      error: 'Unavailable',
    },
    footer: {
      rights: 'All rights reserved.',
    },
    about: {
      title: 'About',
      body: 'A bilingual personal blog with weather, currency rates, social sharing, and thoughtful SEO.',
    },
  },
  ru: {
    brand: 'Horizon Notes',
    tagline: 'Эссе, заметки и репортажи на двух языках.',
    nav: {
      home: 'Главная',
      search: 'Поиск',
      about: 'О блоге',
    },
    home: {
      latest: 'Последние статьи',
      readMore: 'Читать',
      empty: 'Пока нет опубликованных статей.',
    },
    article: {
      views: '{n} просмотров',
      shares: '{n} репостов',
      share: 'Поделиться',
      related: 'Читайте также',
      copied: 'Ссылка скопирована',
    },
    search: {
      title: 'Поиск',
      placeholder: 'Поиск статей…',
      results: '{n} результатов',
      empty: 'Ничего не найдено.',
      hint: 'Поиск по заголовкам и тексту на английском и русском.',
    },
    widgets: {
      weather: 'Погода',
      rates: 'Курсы валют',
      loading: 'Загрузка…',
      error: 'Недоступно',
    },
    footer: {
      rights: 'Все права защищены.',
    },
    about: {
      title: 'О блоге',
      body: 'Двуязычный личный блог с погодой, курсами валют, шарингом в соцсети и SEO.',
    },
  },
};

const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('locale') : null;
const defaultLocale = saved || import.meta.env.VITE_DEFAULT_LOCALE || 'en';

export const i18n = createI18n({
  legacy: false,
  locale: defaultLocale,
  fallbackLocale: 'en',
  messages,
});

export type AppLocale = 'en' | 'ru';
