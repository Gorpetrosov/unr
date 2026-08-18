<template>
  <div v-if="banner || showAdsense" class="ad" :class="position">
    <a
      v-if="banner"
      :href="banner.linkUrl"
      target="_blank"
      rel="noopener sponsored"
      @click="onClick"
    >
      <img :src="banner.imageUrl" :alt="banner.title" loading="lazy" />
    </a>
    <ins
      v-else-if="showAdsense"
      class="adsbygoogle"
      style="display: block"
      :data-ad-client="client"
      :data-ad-slot="slot"
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { getBanners, trackBannerClick, type Banner } from '@/services/api';
import { adsenseConfigured } from '@/utils/adsense';

const props = defineProps<{ position: 'sidebar' | 'header' | 'in_article' }>();

const banner = ref<Banner | null>(null);
const client = import.meta.env.VITE_ADSENSE_CLIENT;
const slot = import.meta.env.VITE_ADSENSE_SLOT;
const showAdsense = computed(() => !banner.value && adsenseConfigured());

onMounted(async () => {
  try {
    const data = await getBanners(props.position);
    banner.value = data.banners[0] || null;
  } catch {
    banner.value = null;
  }

  if (showAdsense.value && (window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle) {
    try {
      ((window as unknown as { adsbygoogle: unknown[] }).adsbygoogle =
        (window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle || []).push({});
    } catch {
      /* ignore */
    }
  }
});

async function onClick() {
  if (!banner.value) return;
  try {
    await trackBannerClick(banner.value.id);
  } catch {
    /* ignore tracking errors */
  }
}
</script>

<style scoped>
.ad {
  overflow: hidden;
  border-radius: 12px;
  background: var(--card);
}

.ad img {
  width: 100%;
  height: auto;
}

.ad.header {
  min-height: 0;
}

.ad.sidebar {
  position: sticky;
  top: 5.5rem;
}
</style>
