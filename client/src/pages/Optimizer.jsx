import { useState, useRef, useEffect } from 'react';
import usePromptStore, { latestOptimizedText } from '../store/promptStore';
import useHistoryStore from '../store/historyStore';
import useAnalyticsStore from '../store/analyticsStore';
import { optimizePromptStream, reOptimizePromptStream, scorePrompt } from '../api/client';
import PromptInput from '../components/prompt/PromptInput';
import OptimizationModes from '../components/prompt/OptimizationModes';
import PresetSelector from '../components/prompt/PresetSelector';
import OutputPanel from '../components/prompt/OutputPanel';
import DiffView from '../components/prompt/DiffView';
import PromptScoreCard from '../components/prompt/PromptScoreCard';
import { Wand2, Target, RefreshCw, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Optimizer() {
  const store = usePromptStore();
  const { addEntry } = useHistoryStore();
  const { trackOptimization, trackScore } = useAnalyticsStore();

  const [failure, setFailure] = useState(null);
  const [completion, setCompletion] = useState('');
  const [streamOpen, setStreamOpen] = useState(false);
  const [slowRequest, setSlowRequest] = useState(false);
  const activeRequest = useRef(null);
  const busy = store.isLoading || store.isScoring;

  const waiting = busy && !store.streamingText;
  useEffect(() => {
    if (!waiting) return;
    const timer = setTimeout(() => setSlowRequest(true), 10000);
    return () => clearTimeout(timer);
  }, [waiting]);

  let status = completion;
  if (store.isScoring) {
    status = slowRequest ? 'Still waiting for a score. The request is active.' : 'Scoring prompt…';
  } else if (store.isLoading) {
    if (store.streamingText) status = 'Receiving output…';
    else if (slowRequest) status = 'Still waiting for output. The request is active.';
    else status = streamOpen ? 'Waiting for the first output…' : 'Sending optimization request…';
  }

  useEffect(() => () => {
    const request = activeRequest.current;
    if (!request) return;
    activeRequest.current = null;
    request.controller?.abort();
    const state = usePromptStore.getState();
    state.clearStreaming();
    state.setLoading(false);
    state.setScoring(false);
  }, []);

  function optimize(refine = false) {
    if (activeRequest.current || busy) return;
    const prompt = refine ? latestOptimizedText(store) : store.prompt;
    if (!prompt?.trim()) {
      toast.error('Please enter a prompt to optimize');
      return;
    }

    const request = {};
    activeRequest.current = request;
    setFailure(null);
    setCompletion('');
    setSlowRequest(false);
    setStreamOpen(false);
    store.setLoading(true);
    store.clearStreaming();
    store.setStreaming(true);
    store.setActiveTab('output');

    const iteration = store.iterations.length + 2;
    const startStream = refine ? reOptimizePromptStream : optimizePromptStream;
    request.controller = startStream({
      prompt,
      mode: store.mode,
      toneStyle: store.mode === 'tone' ? store.toneStyle : undefined,
      ...(refine ? { iteration } : { preset: store.preset, context: store.context || undefined }),
    }, {
      onOpen() {
        if (activeRequest.current === request) setStreamOpen(true);
      },
      onChunk(text) {
        if (activeRequest.current === request) store.appendStreamingText(text);
      },
      onDone(result) {
        if (activeRequest.current !== request) return;
        activeRequest.current = null;
        if (refine) {
          store.addIteration(result);
        } else {
          store.clearIterations();
          store.setResult(result);
          addEntry({
            original: prompt,
            optimized: result.optimized,
            mode: store.mode,
            preset: store.preset,
            explanation: result.explanation,
          });
        }
        store.setScores(null);
        store.clearStreaming();
        store.setLoading(false);
        trackOptimization(store.mode, store.preset);
        setCompletion(refine ? `Iteration ${iteration} complete.` : 'Optimization complete.');
      },
      onError(error) {
        if (activeRequest.current !== request) return;
        activeRequest.current = null;
        store.clearStreaming();
        store.setLoading(false);
        setFailure({
          action: refine ? 'refine' : 'optimize',
          message: error.message || 'Optimization failed. Please try again.',
        });
      },
    });
  }

  async function handleScore() {
    if (activeRequest.current || busy) return;
    const text = latestOptimizedText(store) || store.prompt;
    if (!text.trim()) {
      toast.error('Enter or optimize a prompt first');
      return;
    }

    const request = {};
    activeRequest.current = request;
    setFailure(null);
    setCompletion('');
    setSlowRequest(false);
    store.setScoring(true);
    store.setActiveTab('score');
    try {
      const scores = await scorePrompt(text);
      if (activeRequest.current !== request) return;
      const current = usePromptStore.getState();
      if ((latestOptimizedText(current) || current.prompt) !== text) return;
      store.setScores(scores);
      trackScore(scores.overall);
      setCompletion('Score ready.');
    } catch (error) {
      if (activeRequest.current === request) {
        setFailure({ action: 'score', message: error.message || 'Scoring failed. Please try again.' });
      }
    } finally {
      if (activeRequest.current === request) {
        activeRequest.current = null;
        store.setScoring(false);
      }
    }
  }

  function retry() {
    if (failure.action === 'score') return handleScore();
    optimize(failure.action === 'refine');
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-text tracking-tight flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
            <Wand2 className="w-5 h-5 text-white" />
          </div>
          Prompt Optimizer
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1 ml-0 sm:ml-[52px]">
          Enhance your prompts for maximum LLM effectiveness
        </p>
      </div>

      {/* Input Section */}
      <PromptInput />

      {/* Mode & Preset Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <OptimizationModes />
        </div>
        <div>
          <PresetSelector />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => optimize()}
          disabled={busy || !store.prompt.trim()}
          className="px-6 sm:px-8 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 cursor-pointer"
          id="optimize-btn"
        >
          {store.isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Optimizing…
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              Optimize
            </>
          )}
        </button>

        <button
          onClick={handleScore}
          disabled={busy || (!store.prompt.trim() && !store.result)}
          className="px-5 sm:px-6 py-3 rounded-xl font-semibold text-sm bg-surface border border-border text-text-secondary hover:text-text hover:bg-surface-hover hover:border-border-light disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
          id="score-btn"
        >
          {store.isScoring ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Target className="w-4 h-4" />
          )}
          {store.isScoring ? 'Scoring…' : 'Score'}
        </button>

        {store.result && (
          <button
            onClick={() => optimize(true)}
            disabled={busy}
            className="px-5 sm:px-6 py-3 rounded-xl font-semibold text-sm bg-surface border border-accent/20 text-accent-light hover:bg-accent/10 disabled:opacity-40 transition-all flex items-center justify-center gap-2 animate-fade-in cursor-pointer"
            id="reoptimize-btn"
          >
            <RefreshCw className="w-4 h-4" />
            Re-optimize
            {store.iterations.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 font-mono">
                v{store.iterations.length + 2}
              </span>
            )}
          </button>
        )}
      </div>

      <div role="status" aria-atomic="true" className={status ? 'text-sm text-text-secondary' : 'sr-only'}>
        {status}
      </div>
      {failure && (
        <div className="glass-card flex flex-wrap items-center justify-between gap-3 p-4">
          <p role="alert" className="text-sm text-text">{failure.message}</p>
          <button
            type="button"
            onClick={retry}
            disabled={busy}
            className="min-h-11 rounded-lg border border-border px-4 text-sm font-semibold text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Retry {failure.action === 'score' ? 'scoring' : failure.action === 'refine' ? 're-optimization' : 'optimization'}
          </button>
        </div>
      )}

      {/* Output Tabs & Content */}
      {(failure || store.result || store.scores || store.isLoading || store.isScoring || store.isStreaming) && (
        <div className="space-y-4 animate-fade-in">
          {/* Tab Bar — horizontal scroll on mobile */}
          <div className="flex items-center gap-1 p-1 bg-surface rounded-xl border border-border w-full sm:w-fit overflow-x-auto">
            {[
              { id: 'output', label: 'Output', show: true },
              { id: 'diff', label: 'Diff View', show: !!store.result },
              { id: 'score', label: 'Score', show: true },
            ]
              .filter((t) => t.show)
              .map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => store.setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    store.activeTab === tab.id
                      ? 'bg-surface-hover text-text shadow-xs font-semibold'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
          </div>

          {/* Tab Content */}
          {store.activeTab === 'output' && <OutputPanel />}
          {store.activeTab === 'diff' && <DiffView />}
          {store.activeTab === 'score' && <PromptScoreCard />}
        </div>
      )}
    </div>
  );
}
