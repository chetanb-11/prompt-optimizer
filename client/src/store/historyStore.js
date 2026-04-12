import { create } from 'zustand';

const STORAGE_KEY = 'promptforge_history';

function loadHistory() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    console.warn('Failed to save history to localStorage');
  }
}

const useHistoryStore = create((set, get) => ({
  history: loadHistory(),
  searchQuery: '',
  filterTag: null,

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setFilterTag: (filterTag) => set((s) => ({
    filterTag: s.filterTag === filterTag ? null : filterTag,
  })),

  // Add a new entry to history
  addEntry: ({ original, optimized, mode, preset, scores, explanation }) => {
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      original,
      optimized,
      mode,
      preset: preset || null,
      scores: scores || null,
      explanation: explanation || '',
      tags: [],
      timestamp: new Date().toISOString(),
      favorite: false,
    };

    const updated = [entry, ...get().history].slice(0, 200); // Keep last 200
    saveHistory(updated);
    set({ history: updated });
    return entry;
  },

  // Remove an entry
  removeEntry: (id) => {
    const updated = get().history.filter((e) => e.id !== id);
    saveHistory(updated);
    set({ history: updated });
  },

  // Toggle favorite
  toggleFavorite: (id) => {
    const updated = get().history.map((e) =>
      e.id === id ? { ...e, favorite: !e.favorite } : e
    );
    saveHistory(updated);
    set({ history: updated });
  },

  // Add tag to an entry
  addTag: (id, tag) => {
    const updated = get().history.map((e) =>
      e.id === id && !e.tags.includes(tag)
        ? { ...e, tags: [...e.tags, tag] }
        : e
    );
    saveHistory(updated);
    set({ history: updated });
  },

  // Remove tag from an entry
  removeTag: (id, tag) => {
    const updated = get().history.map((e) =>
      e.id === id ? { ...e, tags: e.tags.filter((t) => t !== tag) } : e
    );
    saveHistory(updated);
    set({ history: updated });
  },

  // Clear all history
  clearHistory: () => {
    saveHistory([]);
    set({ history: [] });
  },

  // Get filtered history
  getFiltered: () => {
    const { history, searchQuery, filterTag } = get();
    let filtered = history;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.original.toLowerCase().includes(q) ||
          e.optimized.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (filterTag) {
      filtered = filtered.filter((e) => e.tags.includes(filterTag));
    }

    return filtered;
  },

  // Get all unique tags
  getAllTags: () => {
    const tags = new Set();
    get().history.forEach((e) => e.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  },
}));

export default useHistoryStore;
