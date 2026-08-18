<template>
  <div class="container page">
    <header class="head" v-if="author">
      <img v-if="author.avatarUrl" class="avatar" :src="author.avatarUrl" :alt="author.displayName" />
      <div>
        <h1>{{ author.displayName }}</h1>
        <p class="muted" v-if="bio">{{ bio }}</p>
      </div>
    </header>

    <p v-if="loading" class="muted">{{ t('widgets.loading') }}</p>
    <p v-else-if="error" class="muted">{{ error }}</p>
    <template v-else>
      <h2>{{ t('author.articles') }}</h2>
      <p v-if="!items.length" class="muted">{{ t('author.empty') }}</p>
      <div v-else class="grid">
        <ArticleCard v-for="article in items" :key="article.id" :article="article" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import ArticleCard from '@/components/ArticleCard.vue';
import { getAuthor, type Article, type Author } from '@/services/api';
import { setSeo, tLocal } from '@/utils/seo';
import { useLocaleStore } from '@/stores/locale';

const route = useRoute();
const { t } = useI18n();
const localeStore = useLocaleStore();

const author = ref<Author | null>(null);
const items = ref<Article[]>([]);
const loading = ref(true);
const error = ref('');
const bio = computed(() => tLocal(author.value?.bio || undefined, localeStore.locale));

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const data = await getAuthor(String(route.params.slug));
    author.value = data.author;
    items.value = data.items;
    setSeo({
      title: data.author.displayName,
      description: tLocal(data.author.bio || undefined, localeStore.locale),
      locale: localeStore.locale,
    });
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Not found';
    author.value = null;
    items.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(() => route.params.slug, load);
watch(() => localeStore.locale, load);
</script>

<style scoped>
.page {
  padding: 2.5rem 0 3rem;
}

.head {
  display: flex;
  gap: 1.1rem;
  align-items: center;
  margin-bottom: 2rem;
}

.avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
}

h1 {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(2rem, 4vw, 2.6rem);
}

h2 {
  font-family: var(--font-display);
  margin: 0 0 1rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.15rem;
}
</style>
