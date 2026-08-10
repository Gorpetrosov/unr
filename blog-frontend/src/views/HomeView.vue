<template>
  <div>
    <section class="hero">
      <div class="hero-bg" aria-hidden="true" />
      <div class="container hero-inner">
        <p class="brand-mark">{{ t('brand') }}</p>
        <h1>{{ t('tagline') }}</h1>
        <p class="lede muted">
          {{
            localeStore.locale === 'ru'
              ? 'Истории, аналитика и личные заметки — с поиском, шарингом и живыми виджетами.'
              : 'Stories, analysis, and personal notes — with search, sharing, and live widgets.'
          }}
        </p>
        <div class="cta">
          <RouterLink class="btn" to="/search">{{ t('nav.search') }}</RouterLink>
          <a class="btn ghost" href="#latest">{{ t('home.latest') }}</a>
        </div>
      </div>
    </section>

    <div class="container layout">
      <section id="latest" class="feed">
        <header class="section-head">
          <h2>{{ t('home.latest') }}</h2>
        </header>

        <p v-if="loading" class="muted">{{ t('widgets.loading') }}</p>
        <p v-else-if="error" class="muted">{{ error }}</p>
        <p v-else-if="!articles.length" class="muted">{{ t('home.empty') }}</p>

        <div v-else class="grid">
          <ArticleCard
            v-for="(article, i) in articles"
            :key="article.id"
            :article="article"
            :style="{ animationDelay: `${i * 0.06}s` }"
          />
        </div>

        <div v-if="pages > 1" class="pager">
          <button class="btn ghost" :disabled="page <= 1" @click="load(page - 1)">←</button>
          <span>{{ page }} / {{ pages }}</span>
          <button class="btn ghost" :disabled="page >= pages" @click="load(page + 1)">→</button>
        </div>
      </section>

      <aside class="sidebar">
        <WeatherWidget />
        <CurrencyWidget />
        <AdBanner position="sidebar" />
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ArticleCard from '@/components/ArticleCard.vue';
import WeatherWidget from '@/components/WeatherWidget.vue';
import CurrencyWidget from '@/components/CurrencyWidget.vue';
import AdBanner from '@/components/AdBanner.vue';
import { listArticles, type Article } from '@/services/api';
import { setSeo, siteName } from '@/utils/seo';
import { useLocaleStore } from '@/stores/locale';

const { t } = useI18n();
const localeStore = useLocaleStore();

const articles = ref<Article[]>([]);
const page = ref(1);
const pages = ref(1);
const loading = ref(true);
const error = ref('');

async function load(p = 1) {
  loading.value = true;
  error.value = '';
  try {
    const data = await listArticles(p, 9);
    articles.value = data.items;
    page.value = data.pagination.page;
    pages.value = data.pagination.pages || 1;
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load';
  } finally {
    loading.value = false;
  }
}

function applySeo() {
  setSeo({
    title: siteName(),
    description: t('tagline'),
    locale: localeStore.locale,
  });
}

onMounted(() => {
  applySeo();
  load();
});

watch(() => localeStore.locale, applySeo);
</script>

<style scoped>
.hero {
  position: relative;
  min-height: min(78vh, 720px);
  display: flex;
  align-items: end;
  overflow: hidden;
  color: #f4efe6;
  margin-bottom: 2.5rem;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(12, 26, 36, 0.25) 0%, rgba(12, 26, 36, 0.78) 70%, #0c1a24 100%),
    url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80')
      center / cover no-repeat;
  transform: scale(1.02);
  animation: ken 18s ease-in-out infinite alternate;
}

@keyframes ken {
  from {
    transform: scale(1.02) translateY(0);
  }
  to {
    transform: scale(1.08) translateY(-1.5%);
  }
}

.hero-inner {
  position: relative;
  z-index: 1;
  padding: 4.5rem 0 3.5rem;
  max-width: 40rem;
  animation: hero-in 0.8s ease both;
}

@keyframes hero-in {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.brand-mark {
  margin: 0 0 0.75rem;
  font-family: var(--font-display);
  font-size: clamp(2.4rem, 6vw, 4rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1;
  color: var(--moss-light);
}

h1 {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 500;
  font-size: clamp(1.35rem, 2.8vw, 1.85rem);
  line-height: 1.3;
  max-width: 18ch;
}

.lede {
  margin: 1rem 0 1.5rem;
  color: rgba(244, 239, 230, 0.78);
  max-width: 36ch;
}

.cta {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.cta .btn.ghost {
  color: #f4efe6;
  border-color: rgba(244, 239, 230, 0.35);
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 2rem;
  align-items: start;
}

.section-head h2 {
  margin: 0 0 1.25rem;
  font-family: var(--font-display);
  font-size: 1.75rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.15rem;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pager {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .sidebar {
    order: -1;
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 600px) {
  .sidebar {
    grid-template-columns: 1fr;
  }
}
</style>
