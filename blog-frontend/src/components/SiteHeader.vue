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
        <RouterLink to="/about">{{ t('nav.about') }}</RouterLink>
      </nav>

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
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useLocaleStore } from '@/stores/locale';
import type { AppLocale } from '@/i18n';

const { t, locale } = useI18n();
const localeStore = useLocaleStore();
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
  background: rgba(243, 239, 230, 0.82);
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
  color: #f5f1e8;
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
}
</style>
