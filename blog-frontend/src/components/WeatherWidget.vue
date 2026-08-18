<template>
  <section class="widget">
    <h3>{{ t('widgets.weather') }}</h3>
    <p class="place">{{ placeLabel }}</p>
    <p v-if="loading" class="muted">{{ t('widgets.loading') }}</p>
    <p v-else-if="error" class="muted">{{ t('widgets.error') }}</p>
    <div v-else class="body">
      <div class="temp">{{ Math.round(temp!) }}°</div>
      <div>
        <div>{{ condition }}</div>
        <div class="muted meta">{{ humidity }}% humidity · {{ wind }} km/h wind</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { fetchWeather, resolveWeatherPlace, weatherLabel } from '@/services/weather';
import { useLocaleStore } from '@/stores/locale';

const { t } = useI18n();
const localeStore = useLocaleStore();

const loading = ref(true);
const error = ref(false);
const temp = ref<number | null>(null);
const humidity = ref<number | null>(null);
const wind = ref<number | null>(null);
const code = ref(0);
const placeLabel = ref('');

const condition = computed(() => weatherLabel(code.value, localeStore.locale));

async function load() {
  loading.value = true;
  error.value = false;
  try {
    const place = await resolveWeatherPlace(localeStore.locale);
    placeLabel.value = place.label || t('widgets.yourLocation');
    const data = await fetchWeather(place.lat, place.lon);
    temp.value = data.temperature;
    humidity.value = data.humidity;
    wind.value = data.wind;
    code.value = data.code;
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(() => localeStore.locale, () => {
  /* labels recompute via computed */
});
</script>

<style scoped>
.widget {
  background: linear-gradient(160deg, #163041, #0c1a24);
  color: #eef4f1;
  border-radius: var(--radius);
  padding: 1.1rem 1.15rem;
  box-shadow: var(--shadow);
  animation: rise 0.6s ease both;
}

h3 {
  margin: 0;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--moss-light);
  font-weight: 600;
}

.place {
  margin: 0.25rem 0 0.85rem;
  font-family: var(--font-display);
  font-size: 1.15rem;
}

.body {
  display: flex;
  gap: 0.85rem;
  align-items: center;
}

.temp {
  font-family: var(--font-display);
  font-size: 2.4rem;
  font-weight: 600;
  line-height: 1;
}

.meta {
  font-size: 0.85rem;
  margin-top: 0.2rem;
  color: rgba(238, 244, 241, 0.7);
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
