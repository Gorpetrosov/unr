<template>
  <div class="share">
    <span class="label">{{ t('article.share') }}</span>
    <div class="buttons">
      <button
        v-for="p in platforms"
        :key="p.id"
        type="button"
        class="share-btn"
        :title="p.label"
        @click="share(p.id)"
      >
        {{ p.icon }}
      </button>
    </div>
    <span v-if="copied" class="copied">{{ t('article.copied') }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { trackShare } from '@/services/api';
import { shareUrl } from '@/utils/seo';

const props = defineProps<{
  articleId: string;
  title: string;
  url: string;
}>();

const { t } = useI18n();
const copied = ref(false);

const platforms = [
  { id: 'twitter', label: 'X / Twitter', icon: '𝕏' },
  { id: 'facebook', label: 'Facebook', icon: 'f' },
  { id: 'telegram', label: 'Telegram', icon: '✈' },
  { id: 'linkedin', label: 'LinkedIn', icon: 'in' },
  { id: 'whatsapp', label: 'WhatsApp', icon: 'W' },
  { id: 'copy', label: 'Copy link', icon: '⧉' },
];

async function share(platform: string) {
  const target = shareUrl(platform, { url: props.url, title: props.title });
  try {
    await trackShare(props.articleId, platform);
  } catch {
    /* ignore */
  }

  if (target === 'copy') {
    await navigator.clipboard.writeText(props.url);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 1800);
    return;
  }

  window.open(target, '_blank', 'noopener,width=600,height=500');
}
</script>

<style scoped>
.share {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin: 1.5rem 0;
}

.label {
  font-weight: 600;
  color: var(--ink-soft);
}

.buttons {
  display: flex;
  gap: 0.4rem;
}

.share-btn {
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  font-weight: 700;
  transition: transform 0.15s ease, background 0.15s ease;
}

.share-btn:hover {
  transform: translateY(-2px);
  background: var(--sea);
  color: #f5f1e8;
  border-color: var(--sea);
}

.copied {
  color: var(--moss);
  font-size: 0.9rem;
  animation: fade 0.3s ease;
}

@keyframes fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
