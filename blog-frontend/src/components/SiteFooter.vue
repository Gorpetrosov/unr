<template>
  <footer class="footer">
    <div class="container inner">
      <div>
        <strong class="brand">{{ t('brand') }}</strong>
        <p class="muted">{{ t('tagline') }}</p>
      </div>
      <p class="muted copy">© {{ year }} {{ t('brand') }}. {{ t('footer.rights') }}</p>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const year = new Date().getFullYear();
</script>

<style scoped>
.footer {
  margin-top: 4rem;
  border-top: 1px solid var(--line);
  background: var(--paper-deep);
}

.inner {
  display: flex;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 2rem 0;
  align-items: end;
}

.brand {
  font-family: var(--font-display);
  font-size: 1.2rem;
}

.copy {
  margin: 0;
  font-size: 0.9rem;
}

@media (max-width: 640px) {
  .inner {
    flex-direction: column;
    align-items: start;
  }
}
</style>
