<template>
  <div class="container page">
    <header class="head">
      <h1>{{ t('bookmarks.title') }}</h1>
      <p class="muted">{{ t('bookmarks.hint') }}</p>
    </header>

    <p v-if="loading" class="muted">{{ t('widgets.loading') }}</p>
    <p v-else-if="!items.length" class="muted">{{ t('bookmarks.empty') }}</p>
    <div v-else class="grid">
      <ArticleCard v-for="article in items" :key="article.id" :article="article" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ArticleCard from '@/components/ArticleCard.vue';
import { listArticles, type Article } from '@/services/api';
import { setSeo } from '@/utils/seo';
import { useBookmarksStore } from '@/stores/bookmarks';
import { useLocaleStore } from '@/stores/locale';

const { t } = useI18n();
const bookmarks = useBookmarksStore();
const localeStore = useLocaleStore();
const items = ref<Article[]>([]);
const loading = ref(true);

async function load() {
  loading.value = true;
  try {
    if (!bookmarks.ids.length) {
      items.value = [];
      return;
    }
    const data = await listArticles(1, 50, { ids: bookmarks.ids });
    items.value = data.items;
  } catch {
    items.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  setSeo({
    title: t('bookmarks.title'),
    description: t('bookmarks.hint'),
    locale: localeStore.locale,
  });
  load();
});

watch(() => bookmarks.ids.slice().join(','), load);
watch(() => localeStore.locale, () => {
  setSeo({
    title: t('bookmarks.title'),
    description: t('bookmarks.hint'),
    locale: localeStore.locale,
  });
});
</script>

<style scoped>
.page {
  padding: 2.5rem 0 3rem;
}

.head h1 {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(2rem, 4vw, 2.8rem);
}

.head p {
  margin: 0.5rem 0 1.5rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.15rem;
}
</style>
