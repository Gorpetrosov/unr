<template>
  <div>
    <header class="page-head">
      <div>
        <h1>{{ isNew ? 'New article' : 'Edit article' }}</h1>
        <p>English and Russian content stored as JSONB.</p>
      </div>
      <RouterLink class="btn secondary" to="/articles">Back</RouterLink>
    </header>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="saved" class="ok">Saved successfully.</p>

    <form class="card form" @submit.prevent="save">
      <div class="row">
        <div class="field">
          <label class="label">Title (EN)</label>
          <input v-model="form.title.en" class="input" required />
        </div>
        <div class="field">
          <label class="label">Title (RU)</label>
          <input v-model="form.title.ru" class="input" required />
        </div>
      </div>

      <div class="row">
        <div class="field">
          <label class="label">Excerpt (EN)</label>
          <textarea v-model="form.excerpt.en" class="textarea" />
        </div>
        <div class="field">
          <label class="label">Excerpt (RU)</label>
          <textarea v-model="form.excerpt.ru" class="textarea" />
        </div>
      </div>

      <div class="row">
        <div class="field">
          <label class="label">Content HTML (EN)</label>
          <textarea v-model="form.content.en" class="textarea tall" required />
        </div>
        <div class="field">
          <label class="label">Content HTML (RU)</label>
          <textarea v-model="form.content.ru" class="textarea tall" required />
        </div>
      </div>

      <div class="row">
        <div class="field">
          <label class="label">Featured image URL</label>
          <input v-model="form.featuredImage" class="input" type="url" placeholder="https://" />
        </div>
        <div class="field">
          <label class="label">Status</label>
          <select v-model="form.status" class="select">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      <div class="field">
        <label class="label">Categories</label>
        <div class="checks">
          <label v-for="c in categories" :key="c.id" class="check">
            <input v-model="form.categoryIds" type="checkbox" :value="c.id" />
            {{ c.name?.en }}
          </label>
        </div>
      </div>

      <button class="btn" type="submit" :disabled="loading">
        {{ loading ? 'Saving…' : 'Save article' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../api/client';

const route = useRoute();
const router = useRouter();
const isNew = computed(() => route.name === 'article-new');
const error = ref('');
const saved = ref(false);
const loading = ref(false);

const form = reactive({
  title: { en: '', ru: '' },
  excerpt: { en: '', ru: '' },
  content: { en: '', ru: '' },
  featuredImage: '',
  status: 'draft' as 'draft' | 'published',
  categoryIds: [] as string[],
});

const categories = ref<Array<{ id: string; name: { en: string; ru: string } }>>([]);

onMounted(async () => {
  try {
    const cats = await api<{ categories: typeof categories.value }>('/api/admin/categories');
    categories.value = cats.categories;

    if (!isNew.value) {
      const data = await api<{
        article: {
          title: { en: string; ru: string };
          excerpt?: { en: string; ru: string } | null;
          content: { en: string; ru: string };
          featuredImage?: string | null;
          status: 'draft' | 'published';
          categories: Array<{ categoryId: string }>;
        };
      }>(`/api/admin/articles/${route.params.id}`);

      form.title = data.article.title;
      form.excerpt = data.article.excerpt || { en: '', ru: '' };
      form.content = data.article.content;
      form.featuredImage = data.article.featuredImage || '';
      form.status = data.article.status;
      form.categoryIds = data.article.categories.map((c) => c.categoryId);
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load';
  }
});

async function save() {
  error.value = '';
  saved.value = false;
  loading.value = true;
  try {
    const payload = {
      title: form.title,
      excerpt: form.excerpt,
      content: form.content,
      featuredImage: form.featuredImage || null,
      status: form.status,
      categoryIds: form.categoryIds,
    };

    if (isNew.value) {
      const data = await api<{ article: { id: string } }>('/api/admin/articles', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      router.replace(`/articles/${data.article.id}`);
    } else {
      await api(`/api/admin/articles/${route.params.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    }
    saved.value = true;
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Save failed';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}
.page-head h1 {
  margin: 0;
}
.page-head p {
  margin: 0.35rem 0 0;
  color: var(--text-muted);
}
.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.tall {
  min-height: 220px;
}
.checks {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.check {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--text-muted);
}
.ok {
  color: var(--success);
}
@media (max-width: 800px) {
  .row {
    grid-template-columns: 1fr;
  }
}
</style>
