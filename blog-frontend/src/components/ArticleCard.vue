<template>
  <article class="card">
    <RouterLink :to="`/article/${slug}`" class="media" v-if="article.featuredImage">
      <img :src="article.featuredImage" :alt="title" loading="lazy" />
    </RouterLink>
    <div class="body">
      <p class="meta muted" v-if="article.publishedAt">
        {{ formatDate(article.publishedAt) }}
        <span v-if="categoryName"> · {{ categoryName }}</span>
      </p>
      <h2>
        <RouterLink :to="`/article/${slug}`">{{ title }}</RouterLink>
      </h2>
      <p class="excerpt">{{ excerpt }}</p>
      <RouterLink class="more" :to="`/article/${slug}`">{{ t('home.readMore') }} →</RouterLink>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Article } from '@/services/api';
import { tLocal } from '@/utils/seo';
import { useLocaleStore } from '@/stores/locale';

const props = defineProps<{ article: Article }>();
const { t } = useI18n();
const localeStore = useLocaleStore();

const title = computed(() => tLocal(props.article.title, localeStore.locale));
const excerpt = computed(() => tLocal(props.article.excerpt || undefined, localeStore.locale));
const slug = computed(() => tLocal(props.article.slug, localeStore.locale));
const categoryName = computed(() => {
  const first = props.article.categories?.[0]?.category;
  return first ? tLocal(first.name, localeStore.locale) : '';
});

function formatDate(d: string) {
  return new Date(d).toLocaleDateString(localeStore.locale === 'ru' ? 'ru-RU' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
</script>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--card);
  border: 1px solid var(--line);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  animation: rise 0.55s ease both;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow);
}

.media {
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: var(--paper-deep);
}

.media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.card:hover .media img {
  transform: scale(1.04);
}

.body {
  padding: 1.15rem 1.2rem 1.35rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  flex: 1;
}

.meta {
  margin: 0;
  font-size: 0.85rem;
}

h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.35rem;
  line-height: 1.25;
  font-weight: 600;
}

.excerpt {
  margin: 0;
  color: var(--ink-soft);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.more {
  color: var(--moss);
  font-weight: 600;
  margin-top: 0.35rem;
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
</style>
