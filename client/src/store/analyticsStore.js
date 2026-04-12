import { create } from 'zustand';

const STORAGE_KEY = 'promptforge_analytics';

function loadAnalytics() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data
      ? JSON.parse(data)
      : {
          totalOptimizations: 0,
          totalScores: 0,
          modeUsage: {},
          presetUsage: {},
          scoreHistory: [],
          dailyUsage: {},
          avgScoreImprovement: 0,
        };
  } catch {
    return {
      totalOptimizations: 0,
      totalScores: 0,
      modeUsage: {},
      presetUsage: {},
      scoreHistory: [],
      dailyUsage: {},
      avgScoreImprovement: 0,
    };
  }
}

function save(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

const useAnalyticsStore = create((set, get) => ({
  ...loadAnalytics(),

  // Track an optimization event
  trackOptimization: (mode, preset) => {
    const state = get();
    const today = new Date().toISOString().split('T')[0];
    const modeUsage = { ...state.modeUsage, [mode]: (state.modeUsage[mode] || 0) + 1 };
    const presetUsage = preset
      ? { ...state.presetUsage, [preset]: (state.presetUsage[preset] || 0) + 1 }
      : state.presetUsage;
    const dailyUsage = { ...state.dailyUsage, [today]: (state.dailyUsage[today] || 0) + 1 };

    const updated = {
      ...state,
      totalOptimizations: state.totalOptimizations + 1,
      modeUsage,
      presetUsage,
      dailyUsage,
    };

    save(updated);
    set(updated);
  },

  // Track a score event
  trackScore: (overall) => {
    const state = get();
    const scoreHistory = [
      ...state.scoreHistory,
      { score: overall, timestamp: Date.now() },
    ].slice(-100);

    const updated = {
      ...state,
      totalScores: state.totalScores + 1,
      scoreHistory,
    };

    save(updated);
    set(updated);
  },

  // Get usage data for charts
  getDailyUsageArray: () => {
    const { dailyUsage } = get();
    return Object.entries(dailyUsage)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);
  },

  getModeUsageArray: () => {
    const { modeUsage } = get();
    const labels = {
      clarity: 'Clarity',
      concise: 'Concise',
      reasoning: 'Reasoning',
      system_prompt: 'System Prompt',
      tone: 'Tone',
    };
    return Object.entries(modeUsage).map(([mode, count]) => ({
      name: labels[mode] || mode,
      value: count,
    }));
  },

  resetAnalytics: () => {
    const fresh = {
      totalOptimizations: 0,
      totalScores: 0,
      modeUsage: {},
      presetUsage: {},
      scoreHistory: [],
      dailyUsage: {},
      avgScoreImprovement: 0,
    };
    save(fresh);
    set(fresh);
  },
}));

export default useAnalyticsStore;
