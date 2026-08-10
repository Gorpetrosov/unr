<template>
  <div class="site">
    <SiteHeader />
    <AdBanner position="header" class="header-ad" />
    <main class="site-main">
      <RouterView />
    </main>
    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import SiteHeader from './components/SiteHeader.vue';
import SiteFooter from './components/SiteFooter.vue';
import AdBanner from './components/AdBanner.vue';
import { useLocaleStore } from './stores/locale';
import { loadAdSense } from './utils/adsense';

const localeStore = useLocaleStore();
onMounted(() => {
  document.documentElement.lang = localeStore.locale;
  loadAdSense();
});
</script>

<style scoped>
.header-ad {
  width: min(var(--max), calc(100% - 2.5rem));
  margin: 0.75rem auto 0;
}
</style>
