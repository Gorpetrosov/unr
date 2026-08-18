<template>
  <div>
    <header class="page-head">
      <div>
        <h1>Categories & tags</h1>
        <p>Organize articles for filtering and related posts.</p>
      </div>
    </header>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="ok" class="ok">{{ ok }}</p>

    <div class="grid">
      <section class="card">
        <h2>Categories</h2>
        <form class="mini" @submit.prevent="saveCategory">
          <input v-model="catForm.en" class="input" placeholder="Name (EN)" required />
          <input v-model="catForm.ru" class="input" placeholder="Name (RU)" required />
          <button class="btn" type="submit">{{ catForm.id ? 'Update' : 'Add' }}</button>
          <button v-if="catForm.id" class="btn secondary" type="button" @click="resetCat">Cancel</button>
        </form>
        <ul class="list">
          <li v-for="c in categories" :key="c.id">
            <div>
              <strong>{{ c.name.en }}</strong>
              <span>{{ c.name.ru }}</span>
            </div>
            <div class="actions">
              <button class="btn secondary" type="button" @click="editCat(c)">Edit</button>
              <button class="btn danger" type="button" @click="removeCategory(c.id)">Delete</button>
            </div>
          </li>
          <li v-if="!categories.length" class="empty">No categories yet.</li>
        </ul>
      </section>

      <section class="card">
        <h2>Tags</h2>
        <form class="mini" @submit.prevent="saveTag">
          <input v-model="tagForm.en" class="input" placeholder="Name (EN)" required />
          <input v-model="tagForm.ru" class="input" placeholder="Name (RU)" required />
          <button class="btn" type="submit">{{ tagForm.id ? 'Update' : 'Add' }}</button>
          <button v-if="tagForm.id" class="btn secondary" type="button" @click="resetTag">Cancel</button>
        </form>
        <ul class="list">
          <li v-for="t in tags" :key="t.id">
            <div>
              <strong>{{ t.name.en }}</strong>
              <span>{{ t.name.ru }}</span>
            </div>
            <div class="actions">
              <button class="btn secondary" type="button" @click="editTag(t)">Edit</button>
              <button class="btn danger" type="button" @click="removeTag(t.id)">Delete</button>
            </div>
          </li>
          <li v-if="!tags.length" class="empty">No tags yet.</li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { api } from '../api/client';

type Named = { id: string; name: { en: string; ru: string } };

const categories = ref<Named[]>([]);
const tags = ref<Named[]>([]);
const error = ref('');
const ok = ref('');

const catForm = reactive({ id: '', en: '', ru: '' });
const tagForm = reactive({ id: '', en: '', ru: '' });

async function load() {
  const [cats, tagData] = await Promise.all([
    api<{ categories: Named[] }>('/api/admin/categories'),
    api<{ tags: Named[] }>('/api/admin/tags'),
  ]);
  categories.value = cats.categories;
  tags.value = tagData.tags;
}

function resetCat() {
  catForm.id = '';
  catForm.en = '';
  catForm.ru = '';
}
function resetTag() {
  tagForm.id = '';
  tagForm.en = '';
  tagForm.ru = '';
}
function editCat(c: Named) {
  catForm.id = c.id;
  catForm.en = c.name.en;
  catForm.ru = c.name.ru;
}
function editTag(t: Named) {
  tagForm.id = t.id;
  tagForm.en = t.name.en;
  tagForm.ru = t.name.ru;
}

async function saveCategory() {
  error.value = '';
  ok.value = '';
  const payload = { name: { en: catForm.en, ru: catForm.ru } };
  try {
    if (catForm.id) {
      await api(`/api/admin/categories/${catForm.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      ok.value = 'Category updated.';
    } else {
      await api('/api/admin/categories', { method: 'POST', body: JSON.stringify(payload) });
      ok.value = 'Category created.';
    }
    resetCat();
    await load();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Save failed';
  }
}

async function saveTag() {
  error.value = '';
  ok.value = '';
  const payload = { name: { en: tagForm.en, ru: tagForm.ru } };
  try {
    if (tagForm.id) {
      await api(`/api/admin/tags/${tagForm.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      ok.value = 'Tag updated.';
    } else {
      await api('/api/admin/tags', { method: 'POST', body: JSON.stringify(payload) });
      ok.value = 'Tag created.';
    }
    resetTag();
    await load();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Save failed';
  }
}

async function removeCategory(id: string) {
  if (!confirm('Delete this category?')) return;
  await api(`/api/admin/categories/${id}`, { method: 'DELETE' });
  await load();
}

async function removeTag(id: string) {
  if (!confirm('Delete this tag?')) return;
  await api(`/api/admin/tags/${id}`, { method: 'DELETE' });
  await load();
}

onMounted(async () => {
  try {
    await load();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load';
  }
});
</script>

<style scoped>
.page-head h1 {
  margin: 0;
}
.page-head p {
  color: var(--text-muted);
  margin: 0.35rem 0 1.25rem;
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
h2 {
  margin: 0 0 1rem;
  font-size: 1.05rem;
}
.mini {
  display: grid;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.list li {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.7rem 0;
  border-bottom: 1px solid var(--border);
}
.list span {
  display: block;
  color: var(--text-muted);
  font-size: 0.85rem;
}
.actions {
  display: flex;
  gap: 0.35rem;
  align-items: start;
}
.empty {
  color: var(--text-muted);
  border: none;
}
.ok {
  color: var(--success);
}
@media (max-width: 800px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
