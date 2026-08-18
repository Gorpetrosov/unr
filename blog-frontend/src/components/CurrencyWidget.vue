<template>
  <section class="widget">
    <h3>{{ t('widgets.rates') }}</h3>
    <p class="base">1 {{ base }}</p>
    <p v-if="loading" class="muted">{{ t('widgets.loading') }}</p>
    <p v-else-if="error" class="muted">{{ t('widgets.error') }}</p>
    <ul v-else>
      <li v-for="(rate, code) in rates" :key="code">
        <span>{{ code }}</span>
        <strong>{{ format(rate) }}</strong>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { fetchExchangeRates, type Rates } from '@/services/currency';

const { t } = useI18n();
const base = import.meta.env.VITE_CURRENCY_BASE || 'USD';
const symbols = (import.meta.env.VITE_CURRENCY_SYMBOLS || 'EUR,GBP,RUB,JPY').split(',');

const loading = ref(true);
const error = ref(false);
const rates = ref<Rates>({});

function format(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

onMounted(async () => {
  try {
    rates.value = await fetchExchangeRates(base, symbols);
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.widget {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 1.1rem 1.15rem;
  animation: rise 0.7s ease both;
}

h3 {
  margin: 0;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--moss);
}

.base {
  margin: 0.35rem 0 0.85rem;
  font-family: var(--font-display);
  font-size: 1.15rem;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

li {
  display: flex;
  justify-content: space-between;
  padding: 0.35rem 0;
  border-top: 1px solid var(--line);
  font-size: 0.95rem;
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
</style>
