<template>
  <div class="export-row">
    <span class="export-label">{{ t('article.share') }}</span>
    <div class="export-list">
      <a
        v-for="p in linkPlatforms"
        :key="p.id"
        class="export-btn"
        :href="hrefFor(p.id)"
        :title="p.label"
        :aria-label="p.label"
        target="_blank"
        rel="noopener noreferrer"
        @click="track(p.id)"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path :d="p.path" />
        </svg>
      </a>
      <button type="button" class="export-btn" :title="copyLabel" :aria-label="copyLabel" @click="copyLink">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M16 1H4a2 2 0 0 0-2 2v12h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z"
          />
        </svg>
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
const copyLabel = 'Copy link';

const linkPlatforms = [
  {
    id: 'twitter',
    label: 'X / Twitter',
    path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    path: 'M14 8h3V5h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.6l.4-3H13V9c0-.6.4-1 1-1z',
  },
  {
    id: 'telegram',
    label: 'Telegram',
    path: 'M21.5 3.3 2.8 10.4c-1.3.5-1.3 1.2-.2 1.5l4.8 1.5 11.1-7c.5-.3 1-.1.6.2l-9 8.2-.3 4.8c.5 0 .7-.2 1-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l3.1-14.7c.3-1.3-.5-1.9-1.4-1.5z',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    path: 'M6.5 9H4V20h2.5V9zM5.2 4C4.3 4 3.5 4.8 3.5 5.7s.8 1.8 1.7 1.8 1.8-.8 1.8-1.8S6.2 4 5.2 4zM20 20h-2.5v-5.6c0-1.6-.6-2.4-1.8-2.4-1.2 0-1.9.8-2.2 1.6-.1.3-.1.7-.1 1.1V20H11V9h2.4v1.5c.6-.9 1.7-2 3.7-2 2.5 0 4 1.5 4 4.8V20z',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    path: 'M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.79 14.18c-.24.68-1.4 1.25-1.95 1.33-.5.07-1.13.1-1.82-.11-.42-.13-.96-.31-1.65-.61-2.91-1.26-4.81-4.2-4.96-4.39-.14-.19-1.2-1.6-1.2-3.05s.76-2.16 1.03-2.46c.24-.27.64-.4 1.02-.4.12 0 .23 0 .34.01.3.01.45.03.65.5.24.59.82 2.05.89 2.2.07.15.12.33.02.53-.09.19-.14.31-.28.48-.14.17-.3.38-.42.51-.14.14-.29.3-.12.58.16.27.73 1.2 1.56 1.95 1.08.96 1.98 1.26 2.26 1.4.28.14.44.12.61-.07.16-.19.7-.82.89-1.1.19-.28.37-.23.63-.14.26.09 1.66.78 1.95.93.28.14.47.21.54.33.07.12.07.68-.17 1.36z',
  },
];

function hrefFor(platform: string) {
  return shareUrl(platform, { url: props.url, title: props.title });
}

function track(platform: string) {
  void trackShare(props.articleId, platform).catch(() => undefined);
}

async function copyLink() {
  track('copy');
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(props.url);
    } else {
      const el = document.createElement('textarea');
      el.value = props.url;
      el.setAttribute('readonly', '');
      el.style.position = 'fixed';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      el.remove();
    }
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 1800);
  } catch {
    /* ignore */
  }
}
</script>

<style scoped>
.export-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin: 1.5rem 0;
}

.export-label {
  font-weight: 600;
  color: var(--ink-soft);
}

.export-list {
  display: flex;
  gap: 0.4rem;
}

.export-btn {
  box-sizing: border-box;
  width: 2.2rem;
  height: 2.2rem;
  padding: 0;
  display: inline-grid;
  place-items: center;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--ink);
  cursor: pointer;
  text-decoration: none;
  transition: transform 0.15s ease, background 0.15s ease, color 0.15s ease;
}

.export-btn svg {
  width: 1.05rem;
  height: 1.05rem;
  fill: currentColor;
}

.export-btn:hover {
  transform: translateY(-2px);
  background: var(--sea);
  color: #f5f1e8;
  border-color: var(--sea);
}

html[data-theme='dark'] .export-btn:hover {
  color: #0c1a24;
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
