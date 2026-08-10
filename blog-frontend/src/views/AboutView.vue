<template>
  <div class="container about">
    <h1>{{ t('about.title') }}</h1>
    <p>{{ t('about.body') }}</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { setSeo } from '@/utils/seo';
import { useLocaleStore } from '@/stores/locale';

const { t } = useI18n();
const localeStore = useLocaleStore();

function applySeo() {
  setSeo({
    title: t('about.title'),
    description: t('about.body'),
    locale: localeStore.locale,
  });
}

onMounted(applySeo);
watch(() => localeStore.locale, applySeo);
</script>

<style scoped>
.about {
  padding: 3rem 0 4rem;
  max-width: 40rem;
}

h1 {
  margin: 0 0 1rem;
  font-family: var(--font-display);
  font-size: clamp(2rem, 4vw, 2.8rem);
}

p {
  margin: 0;
  font-size: 1.15rem;
  color: var(--ink-soft);
  line-height: 1.7;
}
</style>
