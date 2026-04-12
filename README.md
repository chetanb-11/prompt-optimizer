# ⚡ PromptForge — AI Prompt Optimizer

A full-stack web application that intelligently optimizes, scores, compares, and transforms prompts using the **Google Gemini API**. Built for developers and prompt engineers who want to get the best results from large language models.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini_2.5-Flash-4285F4?logo=google&logoColor=white)

---

## 🎯 What It Does

Enter any prompt → choose an optimization mode → get a dramatically improved version with explanations, scoring, and diff highlighting.

**Before:**
> Write me a python function that sorts a list

**After:**
> Create a Python function named `sort_list_ascending`.
>
> **OBJECTIVE:** The function must accept a single argument: a list of comparable elements (e.g., numbers, strings).
>
> **EXPECTED BEHAVIOR:** The function must return a *new* list containing all elements from the input list, sorted in ascending order. The original input list must remain unmodified.
>
> **EXPECTED OUTPUT FORMAT:** Provide the complete Python function definition.

---

## ✨ Features

### Core
- **5 Optimization Modes** — Clarity, Concise, Reasoning, System Prompt, Tone (formal/technical/creative)
- **4 One-Click Presets** — ChatGPT-ready, Claude-ready, API-efficient, Beginner-friendly
- **Prompt Scoring** — 4-dimension analysis (clarity, specificity, completeness, token efficiency) with weighted scoring
- **Diff View** — Side-by-side + inline diff with word-level change stats
- **Live Counters** — Real-time word, character, and token counts

### Intermediate
- **Multi-Iteration Optimization** — Re-optimize sequentially with version tracking (v2, v3...)
- **A/B Testing** — Generate 2–5 distinct optimization variants to compare
- **Template Gallery** — 8 pre-built templates across 5 categories (coding, writing, research, system design, business)
- **Format Converter** — Convert prompts to JSON, Chat (system/user/assistant), or API-ready code

### Advanced
- **Prompt Chain Builder** — Build multi-step optimization pipelines (e.g., clarity → reasoning → concise)
- **Context-Aware Optimization** — Upload text/files as context for smarter optimization
- **Token Cost Estimator** — Real Gemini pricing (Flash, Pro, Flash-Lite)
- **Analytics Dashboard** — Daily usage charts, mode distribution, score trends

### Quality of Life
- **Prompt History** — Search, tag, favorite, and reload past prompts (persisted in localStorage)
- **Copy Buttons** — One-click copy on every output
- **Toast Notifications** — Clear feedback for all actions
- **Error Handling** — Graceful API error recovery with rate limit detection

---

## 🏗️ Architecture

```
┌──────────────────┐     Proxy /api/*      ┌──────────────────┐
│   React + Vite   │ ──────────────────▶  │  Express Server  │
│   :5173          │                       │  :3001           │
│                  │                       │                  │
│  • Zustand Store │  ◀─── JSON ─────────  │  • Route Layer   │
│  • Tailwind CSS  │                       │  • Service Layer  │
│  • Recharts      │                       │  • Gemini Service │
│  • LocalStorage  │                       │  • Prompt Engine  │
└──────────────────┘                       └────────┬─────────┘
                                                    │
                                                    ▼
                                           ┌──────────────────┐
                                           │ Google Gemini API │
                                           │ (2.5 Flash)       │
                                           └──────────────────┘
```

All Gemini API calls use **structured JSON output** (`responseJsonSchema`) to guarantee parseable, consistent responses.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 6 |
| Styling | Tailwind CSS v4 |
| State | Zustand 5 |
| Routing | React Router 7 |
| Charts | Recharts |
| Icons | Lucide React |
| Diff Engine | diff (npm) |
| Backend | Node.js 20+, Express 4 |
| LLM | @google/genai (Gemini 2.5 Flash) |
| Storage | LocalStorage (client-side) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (20+ recommended)
- **Google Gemini API key** — get one free at [Google AI Studio](https://aistudio.google.com/)

### Installation

```bash
# Clone the repo
git clone https://github.com/chetanb-11/prompt-optimizer.git
cd promptOptimizer

# Install backend dependencies
cd server
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Install frontend dependencies
cd ../client
npm install
```

### Running in Development

```bash
# Terminal 1 — Start the backend
cd server
npm run dev          # → http://localhost:3001

# Terminal 2 — Start the frontend
cd client
npm run dev          # → http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

> **Note:** The Vite dev server automatically proxies `/api/*` requests to the Express backend, so no CORS issues in development.

### Building for Production

```bash
cd client
npm run build        # Outputs to client/dist/
```

Serve the built files with any static file server and point your API proxy to the Express backend.

---

## 📡 API Reference

All endpoints accept and return JSON. Base URL: `http://localhost:3001`

### `POST /api/optimize`

Optimize a prompt using a specified mode.

```json
// Request
{
  "prompt": "Write me a python function",
  "mode": "clarity",                    // clarity | concise | reasoning | system_prompt | tone
  "toneStyle": "formal",               // only when mode = "tone" (formal | technical | creative)
  "preset": "chatgpt",                 // optional: chatgpt | claude | api_efficient | beginner
  "context": "Additional context..."   // optional
}

// Response
{
  "original": "Write me a python function",
  "optimized": "Create a Python function named...",
  "explanation": "Added specificity, constraints...",
  "mode": "clarity",
  "preset": "chatgpt",
  "tokenCount": { "original": 7, "optimized": 48 },
  "estimatedCost": { "inputCost": "$0.000002", "outputCost": "$0.000120", "totalCost": "$0.000122" }
}
```

### `POST /api/optimize/iterate`

Re-optimize an already-optimized prompt (iterative refinement).

```json
{ "prompt": "...", "mode": "clarity", "iteration": 2 }
```

### `POST /api/score`

Score a prompt on 4 quality dimensions (1–10 each).

```json
// Request
{ "prompt": "Write me a python function" }

// Response
{
  "scores": {
    "clarity": { "score": 3, "feedback": "..." },
    "specificity": { "score": 2, "feedback": "..." },
    "completeness": { "score": 2, "feedback": "..." },
    "tokenEfficiency": { "score": 8, "feedback": "..." }
  },
  "overall": 3.8,
  "suggestions": ["Specify what the function should do", "..."]
}
```

### `POST /api/compare`

Generate multiple optimized variants for A/B testing.

```json
// Request
{ "prompt": "...", "variants": 3, "mode": "clarity" }

// Response
{
  "variants": [
    { "id": "A", "optimized": "...", "explanation": "...", "approach": "Structured Specification" },
    { "id": "B", "optimized": "...", "explanation": "...", "approach": "Minimal & Direct" },
    { "id": "C", "optimized": "...", "explanation": "...", "approach": "Chain-of-Thought" }
  ]
}
```

### `POST /api/convert`

Convert a prompt into JSON, Chat, or API-ready format.

```json
{ "prompt": "...", "format": "json" }   // json | chat | api
```

### `POST /api/chain`

Execute a multi-step optimization pipeline.

```json
// Request
{ "prompt": "Help me code", "steps": ["clarity", "reasoning", "concise"] }

// Response
{
  "steps": [
    { "step": 1, "mode": "clarity", "result": "...", "explanation": "..." },
    { "step": 2, "mode": "reasoning", "result": "...", "explanation": "..." },
    { "step": 3, "mode": "concise", "result": "...", "explanation": "..." }
  ],
  "final": "..."
}
```

### `GET /api/health`

Health check endpoint.

---

## 📁 Project Structure

```
promptOptimizer/
├── client/                             # React frontend
│   ├── src/
│   │   ├── api/client.js               # Axios API client with interceptors
│   │   ├── components/
│   │   │   ├── analytics/Dashboard.jsx  # Recharts analytics dashboard
│   │   │   ├── chain/ChainBuilder.jsx   # Multi-step pipeline builder
│   │   │   ├── common/CopyButton.jsx    # Reusable copy button
│   │   │   ├── converter/FormatConverter.jsx
│   │   │   ├── history/HistoryList.jsx  # Searchable history with tags
│   │   │   ├── layout/                  # Sidebar + Layout
│   │   │   ├── prompt/                  # Input, Modes, Output, Diff, Score, Presets
│   │   │   ├── templates/TemplateGallery.jsx
│   │   │   └── testing/ABTestPanel.jsx
│   │   ├── pages/                       # 6 page components
│   │   ├── store/                       # Zustand stores (prompt, history, analytics)
│   │   └── utils/                       # Token counter, cost estimator, diff, formatters
│   ├── index.html
│   └── vite.config.js                   # Vite + Tailwind v4 + API proxy
│
├── server/                              # Express backend
│   ├── src/
│   │   ├── app.js                       # Express entry point
│   │   ├── middleware/                   # Error handler, validator, rate limiter
│   │   ├── prompts/systemPrompts.js     # All prompt engineering templates + schemas
│   │   ├── routes/                      # 5 API route files
│   │   ├── services/                    # Gemini, optimize, score, compare, convert, chain
│   │   └── utils/tokenEstimator.js      # Cost estimation with Gemini pricing
│   ├── .env                             # API key (gitignored)
│   └── .env.example
│
├── .gitignore
└── README.md
```

---

## 🧠 Prompt Engineering

The core intelligence lives in [`server/src/prompts/systemPrompts.js`](server/src/prompts/systemPrompts.js).

**Key design patterns:**

- **Mode-specific system prompts** — Each optimization mode has a detailed system prompt with rules, constraints, and guidelines
- **Preset overlays** — Platform-specific instructions are appended (e.g., XML tags for Claude, markdown for ChatGPT)
- **Structured JSON output** — All Gemini calls use `responseJsonSchema` to guarantee parseable responses
- **Chain context injection** — Each chain step is aware of its position in the pipeline and avoids undoing previous work
- **Weighted scoring** — Clarity (30%), Specificity (30%), Completeness (25%), Token Efficiency (15%)

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Your Google Gemini API key | Required |
| `PORT` | Backend server port | `3001` |
| `NODE_ENV` | Environment mode | `development` |

### Rate Limiting

The backend rate limiter allows **30 requests per minute per IP** to prevent Gemini API quota exhaustion. Adjust in `server/src/middleware/rateLimiter.js`.

---

## 🔒 Security

- API key is stored server-side only (`.env`, gitignored)
- Frontend never directly calls the Gemini API — all requests are proxied through Express
- Request body validation on all endpoints
- Rate limiting to prevent abuse

---

## 📊 Gemini Pricing Reference

Costs shown in the token cost estimator are based on current Gemini pricing:

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| Gemini 2.5 Flash | $0.30 | $2.50 |
| Gemini 2.5 Pro | $1.25 | $10.00 |
| Gemini 2.5 Flash-Lite | $0.10 | $0.40 |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
