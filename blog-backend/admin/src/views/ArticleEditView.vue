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
            <option value="scheduled">Scheduled</option>
          </select>
        </div>
      </div>

      <div class="row">
        <div class="field" v-if="form.status === 'scheduled'">
          <label class="label">Publish at</label>
          <input v-model="form.scheduledAt" class="input" type="datetime-local" required />
        </div>
        <div class="field">
          <label class="check featured-check">
            <input v-model="form.featured" type="checkbox" />
            Featured on homepage
          </label>
        </div>
      </div>

      <div class="field">
        <label class="label">Categories</label>
        <div class="checks">
          <label v-for="c in categories" :key="c.id" class="check">
            <input v-model="form.categoryIds" type="checkbox" :value="c.id" />
            {{ c.name?.en }}
          </label>
          <span v-if="!categories.length" class="hint">No categories yet.</span>
        </div>
      </div>

      <div class="field">
        <label class="label">Tags</label>
        <div class="checks">
          <label v-for="tag in tags" :key="tag.id" class="check">
            <input v-model="form.tagIds" type="checkbox" :value="tag.id" />
            {{ tag.name?.en }}
          </label>
          <span v-if="!tags.length" class="hint">No tags yet.</span>
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
  featured: false,
  status: 'draft' as 'draft' | 'published' | 'scheduled',
  scheduledAt: '',
  categoryIds: [] as string[],
  tagIds: [] as string[],
});

const categories = ref<Array<{ id: string; name: { en: string; ru: string } }>>([]);
const tags = ref<Array<{ id: string; name: { en: string; ru: string } }>>([]);

function toLocalInput(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

onMounted(async () => {
  try {
    const [cats, tagData] = await Promise.all([
      api<{ categories: typeof categories.value }>('/api/admin/categories'),
      api<{ tags: typeof tags.value }>('/api/admin/tags'),
    ]);
    categories.value = cats.categories;
    tags.value = tagData.tags;

    if (!isNew.value) {
      const data = await api<{
        article: {
          title: { en: string; ru: string };
          excerpt?: { en: string; ru: string } | null;
          content: { en: string; ru: string };
          featuredImage?: string | null;
          featured?: boolean;
          status: 'draft' | 'published' | 'scheduled';
          scheduledAt?: string | null;
          categories: Array<{ categoryId: string }>;
          tags: Array<{ tagId: string }>;
        };
      }>(`/api/admin/articles/${route.params.id}`);

      form.title = data.article.title;
      form.excerpt = data.article.excerpt || { en: '', ru: '' };
      form.content = data.article.content;
      form.featuredImage = data.article.featuredImage || '';
      form.featured = Boolean(data.article.featured);
      form.status = data.article.status;
      form.scheduledAt = toLocalInput(data.article.scheduledAt);
      form.categoryIds = data.article.categories.map((c) => c.categoryId);
      form.tagIds = (data.article.tags || []).map((t) => t.tagId);
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
      featured: form.featured,
      status: form.status,
      scheduledAt: form.status === 'scheduled' ? new Date(form.scheduledAt).toISOString() : null,
      categoryIds: form.categoryIds,
      tagIds: form.tagIds,
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
.featured-check {
  margin-top: 1.7rem;
  color: var(--text);
  font-weight: 500;
}
.hint {
  color: var(--text-muted);
  font-size: 0.9rem;
}
.ok {
  color: var(--success);
}
@media (max-width: 800px) {
  .row {
    grid-template-columns: 1fr;
  }
  .featured-check {
    margin-top: 0;
  }
}
</style>
