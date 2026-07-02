# PromptForge — Codebase Analysis

## Project Overview

**PromptForge** is a full-stack AI-powered prompt engineering tool that helps users optimize, score, compare, convert, and chain LLM prompts. It uses Google's Gemini 2.5 Flash as its AI backbone, exposed via a custom Express REST API, consumed by a React/Vite SPA.

---

## Architecture

```
promptOptimizer/
├── client/          # React + Vite SPA (frontend)
└── server/          # Express REST API (backend)
```

The project follows a monorepo layout with two independent npm packages. The client talks to the server over HTTP (Axios), with the server acting as a secure proxy to the Gemini AI API.

---

## Tech Stack

### Frontend (`client/`)
| Layer | Technology |
|---|---|
| Framework | React 19 |
| Build Tool | Vite 6 + `@vitejs/plugin-react` |
| Routing | React Router DOM v7 |
| State Management | Zustand v5 |
| Styling | TailwindCSS v4 |
| HTTP Client | Axios v1 |
| Charts | Recharts v2 |
| Icons | Lucide React |
| Notifications | React Hot Toast |
| Diff Engine | `diff` v7 |
| PDF Parsing | `pdfjs-dist` |
| Deployment | Vercel (SPA rewrite rules in `vercel.json`) |

### Backend (`server/`)
| Layer | Technology |
|---|---|
| Runtime | Node.js (ESM) |
| Framework | Express v4 |
| AI Provider | `@google/genai` SDK (Gemini) |
| Rate Limiting | `express-rate-limit` |
| File Upload | `multer` |
| PDF Parsing | `pdf-parse` |
| Config | `dotenv` |
| Dev Server | `node --watch` |

---

## Directory Structure

### Client

```
client/src/
├── App.jsx               # Root router — 6 pages wired to routes
├── main.jsx              # React DOM entry point
├── index.css             # Global styles / design tokens
├── api/
│   └── client.js         # Axios instance + all API call exports
├── pages/
│   ├── Optimizer.jsx     # Main optimizer page (core feature)
│   ├── History.jsx       # Optimization history browser
│   ├── Templates.jsx     # Pre-built prompt template gallery
│   ├── ChainBuilderPage.jsx  # Multi-step chain builder
│   ├── ABTesting.jsx     # A/B prompt variant testing
│   └── Analytics.jsx     # Usage analytics dashboard
├── components/
│   ├── prompt/           # Core optimizer UI components
│   │   ├── PromptInput.jsx       # Input textarea + context + PDF upload
│   │   ├── OptimizationModes.jsx # Mode selector (clarity/concise/etc.)
│   │   ├── PresetSelector.jsx    # Preset picker (GPT-4, Claude, etc.)
│   │   ├── OutputPanel.jsx       # Optimized prompt output display
│   │   ├── DiffView.jsx          # Side-by-side diff of original vs optimized
│   │   └── PromptScoreCard.jsx   # Score breakdown display
│   ├── layout/
│   │   ├── Layout.jsx            # Page shell with sidebar
│   │   └── Sidebar.jsx           # Navigation sidebar
│   ├── analytics/        # Analytics chart components
│   ├── chain/            # Chain builder UI components
│   ├── common/           # Shared/reusable UI elements
│   ├── converter/
│   │   └── FormatConverter.jsx   # Prompt format converter UI
│   ├── history/          # History list/item components
│   ├── templates/        # Template gallery components
│   └── testing/          # A/B testing UI components
├── store/
│   ├── promptStore.js    # Core optimizer state (Zustand)
│   ├── historyStore.js   # History with localStorage persistence
│   └── analyticsStore.js # Analytics with localStorage persistence
└── utils/
    ├── costEstimator.js  # Gemini API cost calculation
    ├── diffUtils.js      # Text diff helpers
    ├── formatters.js     # Display formatting helpers
    ├── pdfParser.js      # Client-side PDF text extraction
    └── tokenCounter.js   # Client-side token counting
```

### Server

```
server/src/
├── app.js                # Express entry point — registers all middleware & routes
├── middleware/
│   ├── errorHandler.js   # Global error handler + AppError class
│   ├── rateLimiter.js    # 30 req/min per IP via express-rate-limit
│   └── validateRequest.js # Field-level request body validation factory
├── routes/
│   ├── optimize.js       # POST /api/optimize, POST /api/optimize/iterate (supports SSE streaming & fallback JSON)
│   ├── score.js          # POST /api/score
│   ├── compare.js        # POST /api/compare
│   ├── convert.js        # POST /api/convert
│   └── chain.js          # POST /api/chain
├── services/
│   ├── geminiService.js  # Core AI wrapper — retry logic, fallback, JSON/text generation & generateJSONStream()
│   ├── optimizeService.js # Prompt optimization & streaming wrappers + token counting + cost estimation
│   ├── reOptimize (in optimizeService) # Iterative refinement & reOptimizeStream()
│   ├── scoreService.js   # Multi-criteria prompt scoring
│   ├── compareService.js # A/B variant generation
│   ├── convertService.js # Format conversion (JSON / Chat / API-ready)
│   └── chainService.js   # Multi-step sequential optimization chain
├── prompts/
│   └── systemPrompts.js  # All system prompt templates, presets (ChatGPT, Claude, Gemini, API-Efficient, Beginner) + JSON schemas (~18KB)
└── utils/
    └── tokenEstimator.js # Server-side token estimation + cost calculation
```

---

## API Endpoints

| Method | Endpoint | Service | Description |
|---|---|---|---|
| `GET` | `/` | — | Health check (returns `{ status: 'ok' }`) |
| `GET` | `/api/health` | — | Versioned health check |
| `POST` | `/api/optimize` | `optimizeService` | Optimize a prompt by mode + preset (SSE streaming if `stream=true`) |
| `POST` | `/api/optimize/iterate` | `optimizeService` | Re-optimize for iterative refinement (SSE streaming if `stream=true`) |
| `POST` | `/api/score` | `scoreService` | Score a prompt on multiple criteria |
| `POST` | `/api/compare` | `compareService` | Generate A/B prompt variants |
| `POST` | `/api/convert` | `convertService` | Convert a prompt to JSON/Chat/API format |
| `POST` | `/api/chain` | `chainService` | Execute a multi-step optimization chain |

---

## Core Features & Data Flow

### 1. Prompt Optimization (Core)

```
User Input → PromptInput.jsx
           → Optimizer.jsx (handleOptimize)
           → api/client.js (optimizePromptStream / optimizePrompt)
           → POST /api/optimize?stream=true
           → validateRequest middleware
           → optimizeService.optimizePromptStream()
             ├── Selects system prompt by mode (from systemPrompts.js)
             ├── Appends preset instructions if selected
             ├── Calls geminiService.generateJSONStream() with OPTIMIZE_SCHEMA
             │   └── callWithRetry() → Gemini API (gemini-2.5-flash) via generateContentStream
             │       └── Fallback to gemini-2.0-flash on failure
             │       └── Emits 'chunk' SSE event for each text fragment
             ├── countTokens() on original + optimized text (post-stream completion)
             ├── estimateCost() for token billing estimate
             └── Emits final 'done' SSE event with structured payload
           ← SSE Event Stream
           → promptStore.appendStreamingText() (real-time UI rendering)
           → promptStore.setResult() (upon 'done' event)
           → historyStore.addEntry()   ← persisted to localStorage
           → analyticsStore.trackOptimization()
           → Renders: OutputPanel / DiffView / PromptScoreCard tabs
```

### 2. Optimization Modes

| Mode Key | Description |
|---|---|
| `clarity` | Improves clarity and readability |
| `concise` | Reduces verbosity while preserving intent |
| `reasoning` | Adds chain-of-thought reasoning structure |
| `system_prompt` | Formats as a system-level instruction |
| `tone_formal` | Rewrites in formal tone |
| `tone_technical` | Rewrites in technical tone |
| `tone_creative` | Rewrites in creative tone |

### 3. Iterative Re-Optimization

Users can re-optimize already-optimized prompts. Each iteration is tracked in `promptStore.iterations[]` and displayed with a version badge (v2, v3, …). Max iterations: unlimited client-side.

### 4. Prompt Scoring

Scores a prompt across multiple dimensions (e.g., clarity, specificity, completeness) using Gemini with a structured JSON schema response. Results are shown in `PromptScoreCard.jsx`.

### 5. A/B Comparison

Generates N variants (default: 3) of a prompt using `compareService`. Used on the `/testing` route via `ABTesting.jsx`.

### 6. Format Conversion

Converts a raw prompt to:
- **JSON** — structured JSON prompt object
- **Chat** — message array format (`system`/`user` roles)
- **API-ready** — formatted for direct API consumption

### 7. Chain Builder

Executes a pipeline of up to **5 sequential optimization steps**, each feeding its output into the next step's input. Useful for compound transformations (e.g., clarity → concise → system_prompt).

---

## State Management (Zustand Stores)

### `promptStore.js`
The primary transient UI state store. Not persisted.

| State | Type | Purpose |
|---|---|---|
| `prompt` | `string` | Current raw prompt text |
| `mode` | `string` | Selected optimization mode |
| `toneStyle` | `string` | Tone variant (when mode = `tone`) |
| `preset` | `string\|null` | Target model preset |
| `context` | `string` | Optional context hint |
| `result` | `object\|null` | Latest optimization result |
| `scores` | `object\|null` | Latest scoring result |
| `iterations` | `array` | Re-optimization iteration history |
| `isStreaming` | `boolean` | True when SSE stream chunk delivery is active |
| `streamingText` | `string` | The accumulated streamed output text preview |
| `activeTab` | `string` | `'output' \| 'diff' \| 'score'` |

### `historyStore.js`
Persisted to `localStorage` under key `promptforge_history`. Keeps last **200** entries.

Features: search, tag filtering, favorite toggle, tag add/remove, export-ready.

### `analyticsStore.js`
Persisted to `localStorage` under key `promptforge_analytics`.

Tracks: total optimizations, total scores, mode usage breakdown, preset usage, daily usage, score history (last 100). Powers the `Analytics.jsx` dashboard with Recharts visualizations.

---

## Gemini Service Architecture

```
geminiService.js
├── generateJSON(systemPrompt, userPrompt, schema, options)
│   └── Guarantees structured JSON output via responseJsonSchema
├── generateJSONStream(systemPrompt, userPrompt, schema, onChunk, options)
│   └── Streams content chunks via onChunk, then parses the full text as JSON
├── generateText(systemPrompt, userPrompt, options)
│   └── Plain text generation (no schema)
├── countTokens(text)
│   └── Uses Gemini token counting API; falls back to ~4 chars/token estimate
└── callWithRetry(apiFn, primaryModel)
    ├── Primary model: gemini-2.5-flash
    ├── MAX_RETRIES: 3 with exponential backoff (1s, 2s, 4s)
    ├── Retries on: 503 (overloaded), 429 (rate limit)
    └── Fallback model: gemini-2.0-flash on primary exhaustion
```

---

## Middleware Stack

```
Express App (app.js)
├── cors()                  # Allow cross-origin requests
├── express.json({ limit: '10mb' })   # JSON body parsing (large for PDF content)
├── rateLimiter             # 30 req/min per IP
├── [route handlers]
└── errorHandler            # Centralized error response formatter
```

---

## Error Handling Strategy

- **Server**: All errors are classified as `AppError(message, httpStatus, code)`. The global `errorHandler` middleware serializes them to `{ error: true, message, code, status }`.
- **Client**: Axios response interceptor maps error codes to user-friendly `react-hot-toast` notifications. Specific handling for `RATE_LIMIT`, `AUTH_ERROR`, `VALIDATION_ERROR`.
- **Gemini**: Errors are classified by HTTP status: `429 → RATE_LIMIT`, `401/403 → AUTH_ERROR`, `400 → BAD_REQUEST`, `503 → AI_OVERLOADED`.

---

## Deployment

| Component | Platform | Config |
|---|---|---|
| Client | Vercel | `client/vercel.json` — SPA rewrites all routes to `index.html` |
| Server | Any Node.js host | Reads `GEMINI_API_KEY` from `.env` |

**Environment Variables (server):**
```
GEMINI_API_KEY=<your-google-gemini-api-key>
PORT=3002  (optional, default: 3002)
```

**Client environment (optional):**
```
VITE_API_URL=/api  (defaults to /api — used for proxying in dev or production)
```

---

## Key Design Decisions

1. **Structured JSON output** — All AI responses use Gemini's `responseJsonSchema` to enforce typed, parseable output, eliminating the need for manual JSON extraction/parsing.
2. **SSE real-time streaming** — Switched core prompt optimization to Server-Sent Events (SSE). Chunks are streamed in real-time, providing immediate visual feedback and preventing slow-response spinning loaders.
3. **Automatic model fallback** — The retry layer silently degrades from `gemini-2.5-flash` → `gemini-2.0-flash` before surfacing errors to users.
4. **Client-side persistence** — History and analytics live in `localStorage` (no database), making the app deployable without a backend database.
5. **Separation of concerns** — Routes are thin (validation only); all business logic lives in `services/`; all AI prompt templates are centralized in `prompts/systemPrompts.js`.
6. **Token cost transparency** — Every optimization returns a `tokenCount` and `estimatedCost` so users can see the AI cost impact of their prompts.
7. **Preset models** — The optimization supports tailoring instructions towards specific target models: ChatGPT, Claude, Google Gemini, API-Efficient structures, and Beginner-friendly languages.
