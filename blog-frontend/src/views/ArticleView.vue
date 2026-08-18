<template>
  <div class="container article-page" v-if="article">
    <article>
      <p class="meta muted" v-if="article.publishedAt">{{ formatDate(article.publishedAt) }}</p>
      <h1>{{ title }}</h1>
      <p class="byline" v-if="article.author">
        {{ t('article.by') }}
        <RouterLink :to="`/author/${article.author.slug}`">{{ article.author.displayName }}</RouterLink>
      </p>
      <p class="stats muted">
        {{ t('article.views', { n: article.views }) }} ·
        {{ t('article.shares', { n: article.shares }) }}
      </p>

      <div class="tax" v-if="categoryLinks.length || tagLinks.length">
        <RouterLink v-for="item in categoryLinks" :key="item.label" class="chip" :to="item.to">
          {{ item.label }}
        </RouterLink>
        <RouterLink v-for="item in tagLinks" :key="'tag-' + item.label" class="chip tag" :to="item.to">
          #{{ item.label }}
        </RouterLink>
      </div>

      <img
        v-if="article.featuredImage"
        class="cover"
        :src="article.featuredImage"
        :alt="title"
      />

      <div class="actions">
        <ShareButtons :article-id="article.id" :title="title" :url="pageUrl" />
        <button type="button" class="btn ghost bookmark" @click="bookmarks.toggle(article.id)">
          {{ bookmarks.has(article.id) ? t('article.bookmarked') : t('article.bookmark') }}
        </button>
      </div>

      <ReactionBar
        v-if="reactions"
        :article-id="article.id"
        :reactions="reactions"
        @update="reactions = $event"
      />

      <div class="content" v-html="content" />

      <AdBanner position="in_article" class="in-ad" />

      <CommentsBox
        :article-id="article.id"
        :comments="comments"
        @added="comments = [...comments, $event]"
      />
    </article>

    <aside class="aside">
      <WeatherWidget />
      <AdBanner position="sidebar" />
      <section v-if="related.length" class="related">
        <h2>{{ t('article.related') }}</h2>
        <ArticleCard v-for="item in related" :key="item.id" :article="item" />
      </section>
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
import ArticleCard from '@/components/ArticleCard.vue';
import CommentsBox from '@/components/CommentsBox.vue';
import ReactionBar from '@/components/ReactionBar.vue';
import {
  getArticle,
  trackView,
  type Article,
  type Comment,
  type Reactions,
} from '@/services/api';
import { visitorId } from '@/services/visitor';
import { setJsonLd, setSeo, siteName, siteUrl, tLocal } from '@/utils/seo';
import { useLocaleStore } from '@/stores/locale';
import { useBookmarksStore } from '@/stores/bookmarks';

const route = useRoute();
const { t } = useI18n();
const localeStore = useLocaleStore();
const bookmarks = useBookmarksStore();

const article = ref<Article | null>(null);
const related = ref<Article[]>([]);
const comments = ref<Comment[]>([]);
const reactions = ref<Reactions | null>(null);
const loading = ref(true);
const error = ref('');

const title = computed(() => tLocal(article.value?.title, localeStore.locale));
const content = computed(() => tLocal(article.value?.content, localeStore.locale));
const excerpt = computed(() => tLocal(article.value?.excerpt || undefined, localeStore.locale));
const pageUrl = computed(() => `${siteUrl()}/article/${route.params.slug}`);

const categoryLinks = computed(() =>
  (article.value?.categories || []).map((item) => ({
    to: { path: '/', query: { category: tLocal(item.category.slug, localeStore.locale) } },
    label: tLocal(item.category.name, localeStore.locale),
  }))
);

const tagLinks = computed(() =>
  (article.value?.tags || []).map((item) => ({
    to: { path: '/', query: { tag: tLocal(item.tag.slug, localeStore.locale) } },
    label: tLocal(item.tag.name, localeStore.locale),
  }))
);

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
  setJsonLd({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title.value,
    description: excerpt.value,
    image: article.value.featuredImage || undefined,
    datePublished: article.value.publishedAt,
    author: article.value.author
      ? {
          '@type': 'Person',
          name: article.value.author.displayName,
          url: `${siteUrl()}/author/${article.value.author.slug}`,
        }
      : { '@type': 'Organization', name: siteName() },
    mainEntityOfPage: pageUrl.value,
  });
}

async function load() {
  loading.value = true;
  error.value = '';
  article.value = null;
  related.value = [];
  comments.value = [];
  reactions.value = null;
  setJsonLd(null);
  try {
    const data = await getArticle(String(route.params.slug), visitorId());
    article.value = data.article;
    related.value = data.related || [];
    comments.value = data.comments || [];
    reactions.value = data.reactions || { counts: { like: 0, love: 0, insightful: 0 }, mine: [] };
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
.stats,
.byline {
  margin: 0;
}

.byline a {
  color: var(--moss);
  font-weight: 600;
}

.tax {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0.85rem 0 0;
}

.chip {
  border: 1px solid var(--line);
  background: var(--card);
  border-radius: 999px;
  padding: 0.25rem 0.7rem;
  font-size: 0.85rem;
  font-weight: 600;
}

.chip.tag {
  color: var(--moss);
}

.cover {
  width: 100%;
  max-height: 420px;
  object-fit: cover;
  border-radius: var(--radius);
  margin: 1.25rem 0;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.bookmark {
  padding: 0.45rem 0.9rem;
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

.related h2 {
  margin: 0 0 0.75rem;
  font-family: var(--font-display);
  font-size: 1.2rem;
}

@media (max-width: 900px) {
  .article-page {
    grid-template-columns: 1fr;
  }
}
</style>
