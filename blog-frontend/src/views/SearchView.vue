<template>
  <div class="container search-page">
    <header class="head">
      <h1>{{ t('search.title') }}</h1>
      <p class="muted">{{ t('search.hint') }}</p>
    </header>

    <form class="search-form" @submit.prevent="runSearch">
      <input
        v-model="query"
        class="input"
        type="search"
        :placeholder="t('search.placeholder')"
        autofocus
      />
      <button class="btn" type="submit">{{ t('nav.search') }}</button>
    </form>

    <p v-if="searched && !loading" class="muted">
      {{ t('search.results', { n: total }) }}
    </p>

    <p v-if="loading" class="muted">{{ t('widgets.loading') }}</p>
    <p v-else-if="searched && !items.length" class="muted">{{ t('search.empty') }}</p>

    <div v-else class="grid">
      <ArticleCard v-for="article in items" :key="article.id" :article="article" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import ArticleCard from '@/components/ArticleCard.vue';
import { searchArticles, type Article } from '@/services/api';
import { setSeo } from '@/utils/seo';
import { useLocaleStore } from '@/stores/locale';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const localeStore = useLocaleStore();

const query = ref(String(route.query.q || ''));
const items = ref<Article[]>([]);
const total = ref(0);
const loading = ref(false);
const searched = ref(false);

async function runSearch() {
  const q = query.value.trim();
  router.replace({ query: q ? { q } : {} });
  if (!q) {
    items.value = [];
    total.value = 0;
    searched.value = false;
    return;
  }

  loading.value = true;
  searched.value = true;
  try {
    const data = await searchArticles(q);
    items.value = data.items;
    total.value = data.pagination.total;
  } catch {
    items.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  setSeo({
    title: t('search.title'),
    description: t('search.hint'),
    locale: localeStore.locale,
  });
  if (query.value) runSearch();
});

watch(
  () => localeStore.locale,
  () => {
    setSeo({
      title: t('search.title'),
      description: t('search.hint'),
      locale: localeStore.locale,
    });
  }
);
</script>

<style scoped>
.search-page {
  padding-top: 2.5rem;
  padding-bottom: 3rem;
}

.head h1 {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(2rem, 4vw, 2.8rem);
}

.head p {
  margin: 0.5rem 0 1.5rem;
}

.search-form {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.input {
  flex: 1;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.55);
  border-radius: 999px;
  padding: 0.85rem 1.2rem;
  outline: none;
}

.input:focus {
  border-color: var(--moss);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.15rem;
  margin-top: 1rem;
}

@media (max-width: 560px) {
  .search-form {
    flex-direction: column;
  }
}
</style>
