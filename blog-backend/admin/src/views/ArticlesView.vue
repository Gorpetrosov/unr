<template>
  <div>
    <header class="page-head">
      <div>
        <h1>Articles</h1>
        <p>Create and manage bilingual posts.</p>
      </div>
      <RouterLink class="btn" to="/articles/new">New article</RouterLink>
    </header>

    <p v-if="error" class="error">{{ error }}</p>

    <div class="card">
      <table class="table" v-if="items.length">
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Views</th>
            <th>Updated</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in items" :key="a.id">
            <td>
              <RouterLink :to="`/articles/${a.id}`">{{ a.title?.en }}</RouterLink>
              <div class="sub">{{ a.slug?.en }}</div>
            </td>
            <td><span class="badge" :class="a.status">{{ a.status }}</span></td>
            <td>{{ a.views }}</td>
            <td>{{ formatDate(a.updatedAt) }}</td>
            <td class="actions">
              <RouterLink class="btn secondary" :to="`/articles/${a.id}`">Edit</RouterLink>
              <button class="btn danger" @click="remove(a.id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty">No articles yet.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '../api/client';

type Article = {
  id: string;
  title: { en: string; ru: string };
  slug: { en: string; ru: string };
  status: string;
  views: number;
  updatedAt: string;
};

const items = ref<Article[]>([]);
const error = ref('');

function formatDate(d: string) {
  return new Date(d).toLocaleString();
}

async function load() {
  const data = await api<{ items: Article[] }>('/api/admin/articles?limit=50');
  items.value = data.items;
}

async function remove(id: string) {
  if (!confirm('Soft-delete this article?')) return;
  try {
    await api(`/api/admin/articles/${id}`, { method: 'DELETE' });
    await load();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Delete failed';
  }
}

onMounted(async () => {
  try {
    await load();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load articles';
  }
});
</script>

<style scoped>
.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}
.page-head h1 {
  margin: 0;
}
.page-head p {
  margin: 0.35rem 0 0;
  color: var(--text-muted);
}
.sub {
  color: var(--text-muted);
  font-size: 0.8rem;
  margin-top: 0.2rem;
}
.actions {
  display: flex;
  gap: 0.4rem;
  justify-content: flex-end;
}
.empty {
  color: var(--text-muted);
}
</style>
