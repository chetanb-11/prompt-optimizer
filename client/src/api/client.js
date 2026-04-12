import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 60000, // 60s — LLM calls can be slow
  headers: { 'Content-Type': 'application/json' },
});

// ── Response Interceptor ─────────────────────────────────
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong. Please try again.';

    const code = error.response?.data?.code || 'UNKNOWN';

    // Show toast for user-facing errors
    if (code === 'RATE_LIMIT' || code === 'RATE_LIMIT_EXCEEDED') {
      toast.error('Rate limited — please wait a moment and retry.');
    } else if (code === 'AUTH_ERROR') {
      toast.error('API key issue — check your Gemini API key.');
    } else if (code === 'VALIDATION_ERROR') {
      toast.error(message);
    } else {
      toast.error(message);
    }

    return Promise.reject({ message, code, status: error.response?.status });
  }
);

// ── API Methods ──────────────────────────────────────────

export const optimizePrompt = (data) => api.post('/optimize', data);
export const reOptimizePrompt = (data) => api.post('/optimize/iterate', data);
export const scorePrompt = (prompt) => api.post('/score', { prompt });
export const comparePrompts = (data) => api.post('/compare', data);
export const convertPrompt = (data) => api.post('/convert', data);
export const executeChain = (data) => api.post('/chain', data);
export const healthCheck = () => api.get('/health');

export default api;
