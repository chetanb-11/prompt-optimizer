import { create } from 'zustand';

const usePromptStore = create((set, get) => ({
  // ── Input State ───────────────────────────────────────
  prompt: '',
  mode: 'clarity',
  toneStyle: 'formal',
  preset: null,
  context: '',

  // ── Output State ──────────────────────────────────────
  result: null,
  scores: null,
  isLoading: false,
  isScoring: false,
  activeTab: 'output', // output | diff | score
  iterations: [], // For multi-iteration optimization

  // ── Actions ───────────────────────────────────────────
  setPrompt: (prompt) => set({ prompt }),
  setMode: (mode) => set({ mode }),
  setToneStyle: (toneStyle) => set({ toneStyle }),
  setPreset: (preset) => set((s) => ({ preset: s.preset === preset ? null : preset })),
  setContext: (context) => set({ context }),
  setResult: (result) => set({ result }),
  setScores: (scores) => set({ scores }),
  setLoading: (isLoading) => set({ isLoading }),
  setScoring: (isScoring) => set({ isScoring }),
  setActiveTab: (activeTab) => set({ activeTab }),

  addIteration: (iteration) =>
    set((s) => ({ iterations: [...s.iterations, iteration] })),

  clearIterations: () => set({ iterations: [] }),

  // Load a prompt from history or template
  loadPrompt: (prompt) =>
    set({
      prompt,
      result: null,
      scores: null,
      iterations: [],
      activeTab: 'output',
    }),

  // Reset everything
  reset: () =>
    set({
      prompt: '',
      mode: 'clarity',
      toneStyle: 'formal',
      preset: null,
      context: '',
      result: null,
      scores: null,
      isLoading: false,
      isScoring: false,
      activeTab: 'output',
      iterations: [],
    }),
}));

export default usePromptStore;
