<template>
  <div class="shell" :class="{ auth: isLogin }">
    <aside v-if="!isLogin" class="sidebar">
      <div class="brand">Blog Admin</div>
      <nav>
        <RouterLink to="/">Dashboard</RouterLink>
        <RouterLink to="/articles">Articles</RouterLink>
        <RouterLink to="/banners">Banners</RouterLink>
      </nav>
      <button class="btn secondary logout" @click="logout">Log out</button>
    </aside>
    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { clearTokens } from './api/client';

const route = useRoute();
const router = useRouter();
const isLogin = computed(() => route.name === 'login');

function logout() {
  clearTokens();
  router.push({ name: 'login' });
}
</script>

<style scoped>
.shell {
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: 100vh;
}

.shell.auth {
  grid-template-columns: 1fr;
}

.sidebar {
  background: var(--bg-elevated);
  border-right: 1px solid var(--border);
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.brand {
  font-weight: 700;
  font-size: 1.15rem;
  letter-spacing: -0.02em;
}

nav {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

nav a {
  color: var(--text-muted);
  padding: 0.55rem 0.75rem;
  border-radius: 8px;
}

nav a.router-link-active,
nav a:hover {
  background: var(--bg-soft);
  color: var(--text);
}

.logout {
  margin-top: auto;
}

.content {
  padding: 1.75rem;
  max-width: 1100px;
}

@media (max-width: 800px) {
  .shell:not(.auth) {
    grid-template-columns: 1fr;
  }
  .sidebar {
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
}
</style>
