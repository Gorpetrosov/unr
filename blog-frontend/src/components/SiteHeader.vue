<template>
  <header class="header">
    <div class="container bar">
      <RouterLink class="brand" to="/" @mouseenter="pulse = true" @animationend="pulse = false">
        <span class="mark" :class="{ pulse }">HN</span>
        <span class="name">{{ t('brand') }}</span>
      </RouterLink>

      <nav class="nav">
        <RouterLink to="/">{{ t('nav.home') }}</RouterLink>
        <RouterLink to="/search">{{ t('nav.search') }}</RouterLink>
        <RouterLink to="/bookmarks">{{ t('nav.bookmarks') }}</RouterLink>
        <RouterLink to="/about">{{ t('nav.about') }}</RouterLink>
      </nav>

      <div class="tools">
        <button
          type="button"
          class="icon-btn"
          :title="themeStore.theme === 'dark' ? t('theme.light') : t('theme.dark')"
          @click="themeStore.toggle()"
        >
          {{ themeStore.theme === 'dark' ? '☀' : '☾' }}
        </button>
        <div class="lang">
          <button
            type="button"
            :class="{ active: localeStore.locale === 'en' }"
            @click="switchLocale('en')"
          >
            EN
          </button>
          <button
            type="button"
            :class="{ active: localeStore.locale === 'ru' }"
            @click="switchLocale('ru')"
          >
            RU
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useLocaleStore } from '@/stores/locale';
import { useThemeStore } from '@/stores/theme';
import type { AppLocale } from '@/i18n';

const { t, locale } = useI18n();
const localeStore = useLocaleStore();
const themeStore = useThemeStore();
const pulse = ref(false);

function switchLocale(next: AppLocale) {
  localeStore.setLocale(next);
  locale.value = next;
}
</script>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 20;
  backdrop-filter: blur(14px);
  background: var(--header);
  border-bottom: 1px solid var(--line);
}

.bar {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  min-height: 4rem;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  margin-right: auto;
}

.mark {
  width: 2.1rem;
  height: 2.1rem;
  display: grid;
  place-items: center;
  border-radius: 0.55rem;
  background: var(--sea);
  color: var(--moss-light);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.85rem;
}

html[data-theme='dark'] .mark {
  color: #0c1a24;
}

.mark.pulse {
  animation: brand-pulse 0.55s ease;
}

@keyframes brand-pulse {
  0% {
    transform: scale(1);
  }
  40% {
    transform: scale(1.08) rotate(-3deg);
  }
  100% {
    transform: scale(1);
  }
}

.name {
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.nav {
  display: flex;
  gap: 1rem;
}

.nav a {
  color: var(--ink-soft);
  font-weight: 500;
  position: relative;
}

.nav a.router-link-active {
  color: var(--ink);
}

.nav a::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -0.35rem;
  height: 2px;
  background: var(--moss);
  transform: scaleX(0);
  transition: transform 0.25s ease;
  transform-origin: left;
}

.nav a.router-link-active::after,
.nav a:hover::after {
  transform: scaleX(1);
}

.tools {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.icon-btn {
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--ink);
  cursor: pointer;
}

.lang {
  display: inline-flex;
  border: 1px solid var(--line);
  border-radius: 999px;
  overflow: hidden;
}

.lang button {
  border: none;
  background: transparent;
  padding: 0.35rem 0.7rem;
  cursor: pointer;
  color: var(--ink-soft);
  font-weight: 600;
  font-size: 0.8rem;
}

.lang button.active {
  background: var(--sea);
  color: var(--paper);
}

html[data-theme='dark'] .lang button.active {
  color: #0c1a24;
}

@media (max-width: 720px) {
  .bar {
    flex-wrap: wrap;
    padding-block: 0.75rem;
  }
  .brand {
    margin-right: 0;
  }
  .nav {
    order: 3;
    width: 100%;
    justify-content: space-between;
  }
  .tools {
    margin-left: auto;
  }
}
</style>
