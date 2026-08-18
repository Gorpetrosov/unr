import { createI18n } from 'vue-i18n';

const messages = {
  en: {
    brand: 'Horizon Notes',
    tagline: 'Essays, notes, and dispatches in two languages.',
    nav: {
      home: 'Home',
      search: 'Search',
      about: 'About',
      bookmarks: 'Bookmarks',
    },
    home: {
      latest: 'Latest articles',
      featured: 'Featured',
      readMore: 'Read article',
      empty: 'No published articles yet.',
      all: 'All',
      filters: 'Filter by category',
    },
    article: {
      views: '{n} views',
      shares: '{n} shares',
      share: 'Share',
      related: 'Keep reading',
      copied: 'Link copied',
      bookmark: 'Bookmark',
      bookmarked: 'Saved',
      by: 'By',
    },
    comments: {
      title: 'Comments',
      empty: 'Be the first to comment.',
      name: 'Name',
      body: 'Comment',
      submit: 'Post comment',
      posted: 'Comment posted.',
    },
    reactions: {
      like: 'Like',
      love: 'Love',
      insightful: 'Insightful',
    },
    bookmarks: {
      title: 'Bookmarks',
      empty: 'No saved articles yet.',
      hint: 'Save articles from any story page to read them later on this device.',
    },
    author: {
      articles: 'Articles',
      empty: 'No published articles yet.',
    },
    search: {
      title: 'Search',
      placeholder: 'Search articles…',
      results: '{n} results',
      empty: 'No articles matched your query.',
      hint: 'Search titles and content in English and Russian.',
      category: 'Category',
      allCategories: 'All categories',
    },
    theme: {
      light: 'Light mode',
      dark: 'Dark mode',
    },
    widgets: {
      weather: 'Weather',
      rates: 'Exchange rates',
      loading: 'Loading…',
      error: 'Unavailable',
      yourLocation: 'Your location',
    },
    footer: {
      rights: 'All rights reserved.',
    },
    about: {
      title: 'About',
      body: 'A bilingual personal blog with search, sharing, comments, and thoughtful SEO.',
    },
  },
  ru: {
    brand: 'Horizon Notes',
    tagline: 'Эссе, заметки и репортажи на двух языках.',
    nav: {
      home: 'Главная',
      search: 'Поиск',
      about: 'О блоге',
      bookmarks: 'Закладки',
    },
    home: {
      latest: 'Последние статьи',
      featured: 'Избранное',
      readMore: 'Читать',
      empty: 'Пока нет опубликованных статей.',
      all: 'Все',
      filters: 'Фильтр по категории',
    },
    article: {
      views: '{n} просмотров',
      shares: '{n} репостов',
      share: 'Поделиться',
      related: 'Читайте также',
      copied: 'Ссылка скопирована',
      bookmark: 'В закладки',
      bookmarked: 'Сохранено',
      by: 'Автор',
    },
    comments: {
      title: 'Комментарии',
      empty: 'Оставьте первый комментарий.',
      name: 'Имя',
      body: 'Комментарий',
      submit: 'Отправить',
      posted: 'Комментарий опубликован.',
    },
    reactions: {
      like: 'Нравится',
      love: 'Любовь',
      insightful: 'Полезно',
    },
    bookmarks: {
      title: 'Закладки',
      empty: 'Пока нет сохранённых статей.',
      hint: 'Сохраняйте статьи со страницы материала, чтобы читать их позже на этом устройстве.',
    },
    author: {
      articles: 'Статьи',
      empty: 'Пока нет опубликованных статей.',
    },
    search: {
      title: 'Поиск',
      placeholder: 'Поиск статей…',
      results: '{n} результатов',
      empty: 'Ничего не найдено.',
      hint: 'Поиск по заголовкам и тексту на английском и русском.',
      category: 'Категория',
      allCategories: 'Все категории',
    },
    theme: {
      light: 'Светлая тема',
      dark: 'Тёмная тема',
    },
    widgets: {
      weather: 'Погода',
      rates: 'Курсы валют',
      loading: 'Загрузка…',
      error: 'Недоступно',
      yourLocation: 'Ваше местоположение',
    },
    footer: {
      rights: 'Все права защищены.',
    },
    about: {
      title: 'О блоге',
      body: 'Двуязычный личный блог с поиском, шарингом, комментариями и SEO.',
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
