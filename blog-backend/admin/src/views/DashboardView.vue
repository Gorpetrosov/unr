<template>
  <div>
    <header class="page-head">
      <h1>Dashboard</h1>
      <p>Overview of traffic, content, and engagement.</p>
    </header>

    <p v-if="error" class="error">{{ error }}</p>

    <div class="stats" v-if="stats">
      <div class="card stat"><span>Total views</span><strong>{{ stats.totalViews }}</strong></div>
      <div class="card stat"><span>Total shares</span><strong>{{ stats.totalShares }}</strong></div>
      <div class="card stat"><span>Published</span><strong>{{ stats.publishedArticles }}</strong></div>
      <div class="card stat"><span>Active banners</span><strong>{{ stats.activeBanners }}</strong></div>
    </div>

    <div class="grid">
      <section class="card">
        <h2>Views (30 days)</h2>
        <div v-if="!views.length" class="empty">No view data yet.</div>
        <ul v-else class="bars">
          <li v-for="item in views" :key="String(item.date)">
            <span>{{ formatDay(item.date) }}</span>
            <div class="bar-track">
              <div class="bar" :style="{ width: barWidth(item.views) }" />
            </div>
            <em>{{ item.views }}</em>
          </li>
        </ul>
      </section>

      <section class="card">
        <h2>Shares by platform</h2>
        <div v-if="!shares.length" class="empty">No share data yet.</div>
        <ul v-else class="list">
          <li v-for="item in shares" :key="item.platform">
            <span>{{ item.platform }}</span>
            <strong>{{ item.shares }}</strong>
          </li>
        </ul>
      </section>
    </div>

    <section class="card" style="margin-top: 1rem">
      <h2>Top articles</h2>
      <table class="table" v-if="stats?.topArticles?.length">
        <thead>
          <tr>
            <th>Title</th>
            <th>Views</th>
            <th>Shares</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in stats.topArticles" :key="a.id">
            <td>{{ a.title?.en || 'Untitled' }}</td>
            <td>{{ a.views }}</td>
            <td>{{ a.shares }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty">No articles yet.</div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { api } from '../api/client';

type Stats = {
  totalViews: number;
  totalShares: number;
  publishedArticles: number;
  activeBanners: number;
  topArticles: Array<{
    id: string;
    title: { en?: string; ru?: string };
    views: number;
    shares: number;
  }>;
};

const stats = ref<Stats | null>(null);
const views = ref<Array<{ date: string; views: number }>>([]);
const shares = ref<Array<{ platform: string; shares: number }>>([]);
const error = ref('');

const maxViews = computed(() => Math.max(1, ...views.value.map((v) => v.views)));

function barWidth(v: number) {
  return `${Math.max(4, (v / maxViews.value) * 100)}%`;
}

function formatDay(d: string) {
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

onMounted(async () => {
  try {
    const [s, v, sh] = await Promise.all([
      api<Stats>('/api/admin/analytics/stats'),
      api<{ items: Array<{ date: string; views: number }> }>('/api/admin/analytics/views?days=30'),
      api<{ items: Array<{ platform: string; shares: number }> }>(
        '/api/admin/analytics/shares?days=30'
      ),
    ]);
    stats.value = s;
    views.value = v.items;
    shares.value = sh.items;
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load dashboard';
  }
});
</script>

<style scoped>
.page-head h1 {
  margin: 0;
}
.page-head p {
  color: var(--text-muted);
  margin: 0.35rem 0 1.25rem;
}
.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.stat {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.stat span {
  color: var(--text-muted);
  font-size: 0.85rem;
}
.stat strong {
  font-size: 1.6rem;
}
.grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 1rem;
}
h2 {
  margin: 0 0 1rem;
  font-size: 1.05rem;
}
.empty {
  color: var(--text-muted);
}
.bars,
.list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.bars li,
.list li {
  display: grid;
  grid-template-columns: 70px 1fr 40px;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.45rem;
  font-size: 0.85rem;
}
.list li {
  grid-template-columns: 1fr auto;
}
.bar-track {
  height: 8px;
  background: var(--bg);
  border-radius: 99px;
  overflow: hidden;
}
.bar {
  height: 100%;
  background: var(--accent);
  border-radius: 99px;
}
@media (max-width: 900px) {
  .stats,
  .grid {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 600px) {
  .stats,
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
