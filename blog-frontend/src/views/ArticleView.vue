<template>
  <div class="container article-page" v-if="article">
    <article>
      <p class="meta muted" v-if="article.publishedAt">{{ formatDate(article.publishedAt) }}</p>
      <h1>{{ title }}</h1>
      <p class="stats muted">
        {{ t('article.views', { n: article.views }) }} ·
        {{ t('article.shares', { n: article.shares }) }}
      </p>

      <img
        v-if="article.featuredImage"
        class="cover"
        :src="article.featuredImage"
        :alt="title"
      />

      <ShareButtons :article-id="article.id" :title="title" :url="pageUrl" />

      <div class="content" v-html="content" />

      <AdBanner position="in_article" class="in-ad" />

      <ShareButtons :article-id="article.id" :title="title" :url="pageUrl" />
    </article>

    <aside class="aside">
      <WeatherWidget />
      <AdBanner position="sidebar" />
    </aside>
  </div>
  <div v-else-if="loading" class="container muted">{{ t('widgets.loading') }}</div>
  <div v-else class="container muted">{{ error || 'Not found' }}</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import ShareButtons from '@/components/ShareButtons.vue';
import WeatherWidget from '@/components/WeatherWidget.vue';
import AdBanner from '@/components/AdBanner.vue';
import { getArticle, trackView, type Article } from '@/services/api';
import { setSeo, siteUrl, tLocal } from '@/utils/seo';
import { useLocaleStore } from '@/stores/locale';

const route = useRoute();
const { t } = useI18n();
const localeStore = useLocaleStore();

const article = ref<Article | null>(null);
const loading = ref(true);
const error = ref('');

const title = computed(() => tLocal(article.value?.title, localeStore.locale));
const content = computed(() => tLocal(article.value?.content, localeStore.locale));
const excerpt = computed(() => tLocal(article.value?.excerpt || undefined, localeStore.locale));
const pageUrl = computed(() => `${siteUrl()}/article/${route.params.slug}`);

function formatDate(d: string) {
  return new Date(d).toLocaleDateString(localeStore.locale === 'ru' ? 'ru-RU' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function applySeo() {
  if (!article.value) return;
  setSeo({
    title: title.value,
    description: excerpt.value,
    image: article.value.featuredImage || undefined,
    url: pageUrl.value,
    locale: localeStore.locale,
  });
}

async function load() {
  loading.value = true;
  error.value = '';
  article.value = null;
  try {
    const data = await getArticle(String(route.params.slug));
    article.value = data.article;
    applySeo();
    await trackView(data.article.id, pageUrl.value);
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load';
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(() => route.params.slug, load);
watch(() => localeStore.locale, applySeo);
</script>

<style scoped>
.article-page {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: 2rem;
  padding-top: 2rem;
  align-items: start;
}

h1 {
  margin: 0.35rem 0 0.5rem;
  font-family: var(--font-display);
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.meta,
.stats {
  margin: 0;
}

.cover {
  width: 100%;
  max-height: 420px;
  object-fit: cover;
  border-radius: var(--radius);
  margin: 1.25rem 0;
}

.content {
  font-size: 1.08rem;
  line-height: 1.75;
}

.content :deep(p) {
  margin: 0 0 1.1rem;
}

.content :deep(h2),
.content :deep(h3) {
  font-family: var(--font-display);
  margin: 1.75rem 0 0.75rem;
}

.content :deep(img) {
  border-radius: 10px;
}

.in-ad {
  margin: 2rem 0;
}

.aside {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (max-width: 900px) {
  .article-page {
    grid-template-columns: 1fr;
  }
}
</style>
