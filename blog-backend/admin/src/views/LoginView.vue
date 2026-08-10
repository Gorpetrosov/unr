<template>
  <div class="login-wrap">
    <form class="card login-card" @submit.prevent="onSubmit">
      <h1>Admin Login</h1>
      <p class="muted">Sign in to manage articles, banners, and analytics.</p>

      <div class="field">
        <label class="label">Email</label>
        <input v-model="email" class="input" type="email" required autocomplete="username" />
      </div>
      <div class="field">
        <label class="label">Password</label>
        <input
          v-model="password"
          class="input"
          type="password"
          required
          autocomplete="current-password"
        />
      </div>

      <p v-if="error" class="error">{{ error }}</p>
      <button class="btn" type="submit" :disabled="loading">
        {{ loading ? 'Signing in…' : 'Sign in' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { api, setTokens } from '../api/client';

const router = useRouter();
const route = useRoute();
const email = ref('admin@example.com');
const password = ref('');
const error = ref('');
const loading = ref(false);

async function onSubmit() {
  error.value = '';
  loading.value = true;
  try {
    const data = await api<{
      accessToken: string;
      refreshToken: string;
      user: { id: string; email: string; role: string };
    }>('/api/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.value, password: password.value }),
    });
    setTokens(data.accessToken, data.refreshToken);
    localStorage.setItem('adminUser', JSON.stringify(data.user));
    const redirect = (route.query.redirect as string) || '/';
    router.push(redirect);
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Login failed';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-wrap {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background:
    radial-gradient(ellipse at top, rgba(61, 156, 240, 0.12), transparent 50%),
    var(--bg);
}

.login-card {
  width: min(400px, 92vw);
}

h1 {
  margin: 0 0 0.35rem;
  font-size: 1.6rem;
}

.muted {
  color: var(--text-muted);
  margin: 0 0 1.25rem;
}

.btn {
  width: 100%;
  margin-top: 0.5rem;
}
</style>
