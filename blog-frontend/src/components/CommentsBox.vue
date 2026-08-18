<template>
  <section class="comments">
    <h2>{{ t('comments.title') }}</h2>
    <p v-if="!comments.length" class="muted">{{ t('comments.empty') }}</p>
    <ul v-else>
      <li v-for="comment in comments" :key="comment.id">
        <strong>{{ comment.authorName }}</strong>
        <time class="muted">{{ formatDate(comment.createdAt) }}</time>
        <p>{{ comment.body }}</p>
      </li>
    </ul>

    <form class="form" @submit.prevent="submit">
      <label>
        <span class="visually-hidden">{{ t('comments.name') }}</span>
        <input v-model="name" class="input" :placeholder="t('comments.name')" required minlength="2" />
      </label>
      <label>
        <span class="visually-hidden">{{ t('comments.body') }}</span>
        <textarea v-model="body" class="input area" :placeholder="t('comments.body')" required minlength="2" />
      </label>
      <p v-if="error" class="muted">{{ error }}</p>
      <p v-if="ok" class="ok">{{ t('comments.posted') }}</p>
      <button class="btn" type="submit" :disabled="sending">{{ t('comments.submit') }}</button>
    </form>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { addComment, type Comment } from '@/services/api';
import { useLocaleStore } from '@/stores/locale';

const props = defineProps<{ articleId: string; comments: Comment[] }>();
const emit = defineEmits<{ (e: 'added', comment: Comment): void }>();
const { t } = useI18n();
const localeStore = useLocaleStore();

const name = ref(localStorage.getItem('hn-comment-name') || '');
const body = ref('');
const sending = ref(false);
const error = ref('');
const ok = ref(false);

function formatDate(d: string) {
  return new Date(d).toLocaleString(localeStore.locale === 'ru' ? 'ru-RU' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function submit() {
  error.value = '';
  ok.value = false;
  sending.value = true;
  try {
    const data = await addComment(props.articleId, {
      authorName: name.value.trim(),
      body: body.value.trim(),
    });
    localStorage.setItem('hn-comment-name', name.value.trim());
    body.value = '';
    ok.value = true;
    emit('added', data.comment);
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to post';
  } finally {
    sending.value = false;
  }
}
</script>

<style scoped>
.comments {
  margin: 2.5rem 0 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--line);
}

h2 {
  margin: 0 0 1rem;
  font-family: var(--font-display);
  font-size: 1.45rem;
}

ul {
  list-style: none;
  margin: 0 0 1.5rem;
  padding: 0;
}

li {
  padding: 0.85rem 0;
  border-bottom: 1px solid var(--line);
}

strong {
  margin-right: 0.5rem;
}

p {
  margin: 0.35rem 0 0;
}

.form {
  display: grid;
  gap: 0.65rem;
}

.input {
  width: 100%;
  border: 1px solid var(--line);
  background: var(--card);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  color: var(--ink);
}

.area {
  min-height: 110px;
  resize: vertical;
}

.ok {
  color: var(--moss);
  margin: 0;
}
</style>
