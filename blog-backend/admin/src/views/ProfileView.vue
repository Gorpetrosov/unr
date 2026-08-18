<template>
  <div>
    <header class="page-head">
      <div>
        <h1>Author profile</h1>
        <p>Public author page shown next to your articles.</p>
      </div>
    </header>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="saved" class="ok">Profile saved.</p>

    <form class="card form" @submit.prevent="save">
      <div class="field">
        <label class="label">Display name</label>
        <input v-model="form.displayName" class="input" required minlength="2" />
      </div>
      <div class="field">
        <label class="label">Avatar URL</label>
        <input v-model="form.avatarUrl" class="input" type="url" placeholder="https://" />
      </div>
      <div class="row">
        <div class="field">
          <label class="label">Bio (EN)</label>
          <textarea v-model="form.bio.en" class="textarea" />
        </div>
        <div class="field">
          <label class="label">Bio (RU)</label>
          <textarea v-model="form.bio.ru" class="textarea" />
        </div>
      </div>
      <p v-if="slug" class="hint">Public URL: /author/{{ slug }}</p>
      <button class="btn" type="submit" :disabled="loading">
        {{ loading ? 'Saving…' : 'Save profile' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { api } from '../api/client';

const form = reactive({
  displayName: '',
  avatarUrl: '',
  bio: { en: '', ru: '' },
});
const slug = ref('');
const error = ref('');
const saved = ref(false);
const loading = ref(false);

onMounted(async () => {
  try {
    const data = await api<{
      user: {
        displayName: string;
        slug: string;
        avatarUrl?: string | null;
        bio?: { en: string; ru: string } | null;
      };
    }>('/api/admin/auth/me');
    form.displayName = data.user.displayName;
    form.avatarUrl = data.user.avatarUrl || '';
    form.bio = data.user.bio || { en: '', ru: '' };
    slug.value = data.user.slug;
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load profile';
  }
});

async function save() {
  error.value = '';
  saved.value = false;
  loading.value = true;
  try {
    const data = await api<{ user: { slug: string } }>('/api/admin/auth/me', {
      method: 'PUT',
      body: JSON.stringify({
        displayName: form.displayName,
        avatarUrl: form.avatarUrl || null,
        bio: form.bio.en && form.bio.ru ? form.bio : null,
      }),
    });
    slug.value = data.user.slug;
    saved.value = true;
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Save failed';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.page-head h1 {
  margin: 0;
}
.page-head p {
  color: var(--text-muted);
  margin: 0.35rem 0 1.25rem;
}
.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
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
}
</style>
