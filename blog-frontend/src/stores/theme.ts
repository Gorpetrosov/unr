import { defineStore } from 'pinia';
import { ref } from 'vue';

export type Theme = 'light' | 'dark';

function preferred(): Theme {
  const saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0c1a24' : '#f3efe6');
}

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>(preferred());
  apply(theme.value);

  function setTheme(next: Theme) {
    theme.value = next;
    localStorage.setItem('theme', next);
    apply(next);
  }

  function toggle() {
    setTheme(theme.value === 'dark' ? 'light' : 'dark');
  }

  return { theme, setTheme, toggle };
});
