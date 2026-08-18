import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

const KEY = 'hn-bookmarks';

function readIds(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export const useBookmarksStore = defineStore('bookmarks', () => {
  const ids = ref<string[]>(readIds());

  const count = computed(() => ids.value.length);

  function persist() {
    localStorage.setItem(KEY, JSON.stringify(ids.value));
  }

  function has(id: string) {
    return ids.value.includes(id);
  }

  function toggle(id: string) {
    ids.value = has(id) ? ids.value.filter((item) => item !== id) : [id, ...ids.value];
    persist();
  }

  return { ids, count, has, toggle };
});
