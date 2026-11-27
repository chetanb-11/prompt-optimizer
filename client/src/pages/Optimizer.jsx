import { useState, useRef, useEffect } from 'react';
import usePromptStore from '../store/promptStore';
import useHistoryStore from '../store/historyStore';
import useAnalyticsStore from '../store/analyticsStore';
import { optimizePromptStream, reOptimizePromptStream, scorePrompt } from '../api/client';
import PromptInput, { PromptContext } from '../components/prompt/PromptInput';
import OptimizationModes, { MODES, TONE_OPTIONS } from '../components/prompt/OptimizationModes';
import PresetSelector, { PRESETS } from '../components/prompt/PresetSelector';
import OutputPanel from '../components/prompt/OutputPanel';
import DiffView from '../components/prompt/DiffView';
import PromptScoreCard from '../components/prompt/PromptScoreCard';
import { Wand2, Target, RefreshCw, Loader2, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Optimizer() {
  const store = usePromptStore();
  const { addEntry } = useHistoryStore();
  const { trackOptimization, trackScore } = useAnalyticsStore();

  const [failure, setFailure] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [completion, setCompletion] = useState('');
  const [streamOpen, setStreamOpen] = useState(false);
  const [slowRequest, setSlowRequest] = useState(false);
  const activeRequest = useRef(null);
  const busy = store.isLoading || store.isScoring;
  const versionCount = store.result ? store.iterations.length + 1 : 0;
  const version = Math.min(selectedVersion ?? versionCount, versionCount);
  const displayedResult = version > 1 ? store.iterations[version - 2] : store.result;
  const displayedPrompt = displayedResult?.optimized ?? store.prompt;
  const versionLabel = version ? `Version ${version}` : 'Your draft';
  const scoreMatches = store.scores?.version === version && store.scores?.scoredText === displayedPrompt;
  const modeLabel = MODES.find((mode) => mode.id === store.mode)?.label;
  const toneLabel = store.mode === 'tone' && TONE_OPTIONS.find((tone) => tone.id === store.toneStyle)?.label;
  const presetLabel = PRESETS.find((preset) => preset.id === store.preset)?.label ?? 'No preset';
  const optionsSummary = [modeLabel, toneLabel, presetLabel].filter(Boolean).join(' · ');

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
    const prompt = refine ? displayedResult?.optimized : store.prompt;
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
          store.setResult({ ...result, original: prompt });
          addEntry({
            original: prompt,
            optimized: result.optimized,
            mode: store.mode,
            preset: store.preset,
            explanation: result.explanation,
          });
        }
        setSelectedVersion(null);
        if (!refine) store.setScores(null);
        store.clearStreaming();
        store.setLoading(false);
        trackOptimization(store.mode, store.preset);
        setCompletion(refine ? `Version ${iteration} ready.` : 'Optimization complete.');
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
    const text = displayedPrompt;
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
    try {
      const scores = await scorePrompt(text);
      if (activeRequest.current !== request) return;
      if (!version && usePromptStore.getState().prompt !== text) return;
      store.setScores({ ...scores, version, scoredText: text });
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
    <div className="mx-auto max-w-6xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-text">Prompt Optimizer</h1>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section aria-label="Prompt editor" className="min-w-0 space-y-4">
          <PromptInput />

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              id="optimize-btn"
              onClick={() => optimize()}
              disabled={busy || !store.prompt.trim()}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-6 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {store.isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Wand2 className="h-4 w-4" aria-hidden="true" />}
              Optimize
            </button>
            <span className="text-xs text-text-secondary">{optionsSummary}{store.context.trim() ? ' · Context added' : ''}</span>
          </div>

          <details className="glass-card group">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-xl px-4 py-2 text-sm font-semibold text-text focus-visible:outline-2 focus-visible:outline-primary">
              Options
              <ChevronDown aria-hidden="true" className="h-4 w-4 text-text-secondary group-open:rotate-180" />
            </summary>
            <div className="space-y-5 border-t border-border p-4">
              <OptimizationModes />
              <PresetSelector />
              <PromptContext />
            </div>
          </details>
        </section>

        <section aria-label="Result" className="min-w-0 space-y-3">
          <p role="status" aria-atomic="true" className={status ? 'text-sm text-text-secondary' : 'sr-only'}>
            {status}
          </p>
          {failure && (
            <div className="glass-card flex flex-wrap items-center gap-3 p-4">
              <p role="alert" className="flex-1 text-sm text-text">{failure.message}</p>
              <button
                type="button"
                onClick={retry}
                disabled={busy}
                className="min-h-11 rounded-lg border border-border px-4 text-sm font-semibold text-text focus-visible:outline-2 focus-visible:outline-primary"
              >
                Retry {failure.action === 'score' ? 'scoring' : failure.action === 'refine' ? 'refinement' : 'optimization'}
              </button>
            </div>
          )}

          <OutputPanel result={displayedResult} version={version} isLoading={store.isLoading} />

          {displayedResult && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              {versionCount > 1 && (
                <label className="flex items-center gap-2 text-sm text-text-secondary">
                  Version history
                  <select
                    value={version}
                    onChange={(event) => setSelectedVersion(Number(event.target.value))}
                    disabled={busy}
                    className="min-h-10 rounded-lg border border-border bg-surface px-2 text-sm text-text"
                  >
                    {Array.from({ length: versionCount }, (_, index) => (
                      <option key={index} value={index + 1}>Version {index + 1}</option>
                    ))}
                  </select>
                </label>
              )}
              <button
                type="button"
                id="reoptimize-btn"
                onClick={() => optimize(true)}
                disabled={busy}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-text hover:bg-surface-hover disabled:opacity-40"
              >
                <RefreshCw aria-hidden="true" className="h-4 w-4" />
                Refine version {version}
              </button>
            </div>
          )}

          {displayedResult && (
            <details className="glass-card" onToggle={(event) => setComparisonOpen(event.currentTarget.open)}>
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-text">Compare with original</summary>
              <div className="border-t border-border p-4">
                {comparisonOpen && <DiffView original={store.result.original} optimized={displayedResult.optimized} />}
              </div>
            </details>
          )}

          <details className="glass-card">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-text">Prompt score</summary>
            <div className="space-y-3 border-t border-border p-4">
              <button
                type="button"
                id="score-btn"
                onClick={handleScore}
                disabled={busy || !displayedPrompt.trim()}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-text hover:bg-surface-hover disabled:opacity-40"
              >
                <Target aria-hidden="true" className="h-4 w-4" />
                {version ? `Score version ${version}` : 'Score draft'}
              </button>
              {scoreMatches && <PromptScoreCard label={versionLabel} />}
            </div>
          </details>
        </section>
      </div>
    </div>
  );
}
