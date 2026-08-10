<template>
  <div>
    <header class="page-head">
      <div>
        <h1>Banners</h1>
        <p>Custom ad banners with impression and click tracking.</p>
      </div>
    </header>

    <p v-if="error" class="error">{{ error }}</p>

    <form class="card form" @submit.prevent="create">
      <h2>{{ editingId ? 'Edit banner' : 'Create banner' }}</h2>
      <div class="row">
        <div class="field">
          <label class="label">Title</label>
          <input v-model="form.title" class="input" required />
        </div>
        <div class="field">
          <label class="label">Position</label>
          <select v-model="form.position" class="select">
            <option value="sidebar">Sidebar</option>
            <option value="header">Header</option>
            <option value="in_article">In article</option>
          </select>
        </div>
      </div>
      <div class="row">
        <div class="field">
          <label class="label">Image URL</label>
          <input v-model="form.imageUrl" class="input" type="url" required />
        </div>
        <div class="field">
          <label class="label">Link URL</label>
          <input v-model="form.linkUrl" class="input" type="url" required />
        </div>
      </div>
      <label class="check">
        <input v-model="form.isActive" type="checkbox" />
        Active
      </label>
      <div class="actions">
        <button class="btn" type="submit">{{ editingId ? 'Update' : 'Create' }}</button>
        <button v-if="editingId" class="btn secondary" type="button" @click="reset">Cancel</button>
      </div>
    </form>

    <div class="card" style="margin-top: 1rem">
      <table class="table" v-if="banners.length">
        <thead>
          <tr>
            <th>Title</th>
            <th>Position</th>
            <th>Active</th>
            <th>Impr.</th>
            <th>Clicks</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in banners" :key="b.id">
            <td>{{ b.title }}</td>
            <td>{{ b.position }}</td>
            <td>{{ b.isActive ? 'Yes' : 'No' }}</td>
            <td>{{ b.impressions }}</td>
            <td>{{ b.clicks }}</td>
            <td class="actions">
              <button class="btn secondary" @click="edit(b)">Edit</button>
              <button class="btn danger" @click="remove(b.id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty">No banners yet.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { api } from '../api/client';

type Banner = {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  position: 'sidebar' | 'header' | 'in_article';
  isActive: boolean;
  impressions: number;
  clicks: number;
};

const banners = ref<Banner[]>([]);
const error = ref('');
const editingId = ref<string | null>(null);

const form = reactive({
  title: '',
  imageUrl: '',
  linkUrl: '',
  position: 'sidebar' as Banner['position'],
  isActive: true,
});

function reset() {
  editingId.value = null;
  form.title = '';
  form.imageUrl = '';
  form.linkUrl = '';
  form.position = 'sidebar';
  form.isActive = true;
}

function edit(b: Banner) {
  editingId.value = b.id;
  form.title = b.title;
  form.imageUrl = b.imageUrl;
  form.linkUrl = b.linkUrl;
  form.position = b.position;
  form.isActive = b.isActive;
}

async function load() {
  const data = await api<{ banners: Banner[] }>('/api/admin/banners');
  banners.value = data.banners;
}

async function create() {
  error.value = '';
  try {
    if (editingId.value) {
      await api(`/api/admin/banners/${editingId.value}`, {
        method: 'PUT',
        body: JSON.stringify({ ...form }),
      });
    } else {
      await api('/api/admin/banners', {
        method: 'POST',
        body: JSON.stringify({ ...form }),
      });
    }
    reset();
    await load();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Save failed';
  }
}

async function remove(id: string) {
  if (!confirm('Delete this banner?')) return;
  try {
    await api(`/api/admin/banners/${id}`, { method: 'DELETE' });
    await load();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Delete failed';
  }
}

onMounted(async () => {
  try {
    await load();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load banners';
  }
});
</script>

<style scoped>
.page-head h1 {
  margin: 0;
}
.page-head p {
  color: var(--text-muted);
  margin: 0.35rem 0 1rem;
}
.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
h2 {
  margin: 0 0 1rem;
  font-size: 1.05rem;
}
.check {
  display: flex;
  gap: 0.4rem;
  align-items: center;
  margin-bottom: 1rem;
  color: var(--text-muted);
}
.actions {
  display: flex;
  gap: 0.5rem;
}
.empty {
  color: var(--text-muted);
}
@media (max-width: 700px) {
  .row {
    grid-template-columns: 1fr;
  }
}
</style>
