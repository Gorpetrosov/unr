<template>
  <div class="reactions">
    <button
      v-for="item in items"
      :key="item.type"
      type="button"
      class="react"
      :class="{ on: reactions.mine.includes(item.type) }"
      @click="toggle(item.type)"
    >
      <span>{{ item.icon }}</span>
      {{ t(`reactions.${item.type}`) }}
      <em>{{ reactions.counts[item.type] }}</em>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { toggleReaction, type Reactions } from '@/services/api';
import { visitorId } from '@/services/visitor';

const props = defineProps<{ articleId: string; reactions: Reactions }>();
const emit = defineEmits<{ (e: 'update', value: Reactions): void }>();
const { t } = useI18n();

const items = [
  { type: 'like' as const, icon: '👍' },
  { type: 'love' as const, icon: '❤️' },
  { type: 'insightful' as const, icon: '💡' },
];

async function toggle(type: 'like' | 'love' | 'insightful') {
  try {
    const next = await toggleReaction(props.articleId, { type, visitorId: visitorId() });
    emit('update', next);
  } catch {
    /* ignore */
  }
}
</script>

<style scoped>
.reactions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1rem 0 0.25rem;
}

.react {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--ink);
  border-radius: 999px;
  padding: 0.4rem 0.8rem;
  cursor: pointer;
  font-weight: 600;
}

.react.on {
  border-color: var(--moss);
  background: rgba(47, 107, 90, 0.12);
}

em {
  font-style: normal;
  color: var(--ink-soft);
}
</style>
