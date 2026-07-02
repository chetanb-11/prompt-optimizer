import { useState, useRef } from 'react';
import usePromptStore from '../store/promptStore';
import useHistoryStore from '../store/historyStore';
import useAnalyticsStore from '../store/analyticsStore';
import { optimizePromptStream, reOptimizePromptStream, scorePrompt } from '../api/client';
import PromptInput from '../components/prompt/PromptInput';
import OptimizationModes from '../components/prompt/OptimizationModes';
import PresetSelector from '../components/prompt/PresetSelector';
import OutputPanel from '../components/prompt/OutputPanel';
import DiffView from '../components/prompt/DiffView';
import PromptScoreCard from '../components/prompt/PromptScoreCard';
import { Wand2, Target, RefreshCw, Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Optimizer() {
  const store = usePromptStore();
  const { addEntry } = useHistoryStore();
  const { trackOptimization, trackScore } = useAnalyticsStore();

  // Ref to hold the AbortController for cancelling in-flight streams
  const streamController = useRef(null);

  const handleOptimize = () => {
    if (!store.prompt.trim()) {
      toast.error('Please enter a prompt to optimize');
      return;
    }

    // Cancel any in-flight stream
    streamController.current?.abort();

    store.setLoading(true);
    store.setResult(null);
    store.setScores(null);
    store.clearIterations();
    store.clearStreaming();
    store.setStreaming(true);
    store.setActiveTab('output');

    streamController.current = optimizePromptStream(
      {
        prompt: store.prompt,
        mode: store.mode,
        toneStyle: store.mode === 'tone' ? store.toneStyle : undefined,
        preset: store.preset,
        context: store.context || undefined,
      },
      {
        onChunk: (text) => {
          store.appendStreamingText(text);
        },

        onDone: (result) => {
          store.setResult(result);
          store.clearStreaming();
          store.setLoading(false);

          // Track analytics
          trackOptimization(store.mode, store.preset);

          // Save to history
          addEntry({
            original: store.prompt,
            optimized: result.optimized,
            mode: store.mode,
            preset: store.preset,
            explanation: result.explanation,
          });

          toast.success('Prompt optimized!');
        },

        onError: (err) => {
          store.clearStreaming();
          store.setLoading(false);
          toast.error(err.message || 'Optimization failed.');
        },
      }
    );
  };

  const handleReOptimize = () => {
    if (!store.result) return;

    const iteration = store.iterations.length + 2;
    const currentPrompt =
      store.iterations.length > 0
        ? store.iterations[store.iterations.length - 1].optimized
        : store.result.optimized;

    // Cancel any in-flight stream
    streamController.current?.abort();

    store.setLoading(true);
    store.clearStreaming();
    store.setStreaming(true);
    store.setActiveTab('output');

    streamController.current = reOptimizePromptStream(
      {
        prompt: currentPrompt,
        mode: store.mode,
        toneStyle: store.mode === 'tone' ? store.toneStyle : undefined,
        iteration,
      },
      {
        onChunk: (text) => {
          store.appendStreamingText(text);
        },

        onDone: (result) => {
          store.addIteration(result);
          store.clearStreaming();
          store.setLoading(false);
          trackOptimization(store.mode, store.preset);
          toast.success(`Iteration ${iteration} complete`);
        },

        onError: (err) => {
          store.clearStreaming();
          store.setLoading(false);
          toast.error(err.message || 'Re-optimization failed.');
        },
      }
    );
  };

  const handleScore = async () => {
    const textToScore = store.result?.optimized || store.prompt;
    if (!textToScore?.trim()) {
      toast.error('Enter or optimize a prompt first');
      return;
    }

    store.setScoring(true);
    store.setActiveTab('score');

    try {
      const result = await scorePrompt(textToScore);
      store.setScores(result);
      trackScore(result.overall);
    } catch {
      // handled
    } finally {
      store.setScoring(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-text tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Wand2 className="w-5 h-5 text-white" />
          </div>
          Prompt Optimizer
        </h1>
        <p className="text-sm text-text-muted mt-1 ml-[52px]">
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
          onClick={handleOptimize}
          disabled={store.isLoading || !store.prompt.trim()}
          className="px-8 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
          id="optimize-btn"
        >
          {store.isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {store.isStreaming ? 'Streaming...' : 'Optimizing...'}
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
          disabled={store.isScoring || (!store.prompt.trim() && !store.result)}
          className="px-6 py-3 rounded-xl font-semibold text-sm bg-surface border border-border text-text-secondary hover:text-text hover:bg-surface-hover hover:border-border-light disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          id="score-btn"
        >
          {store.isScoring ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Target className="w-4 h-4" />
          )}
          Score
        </button>

        {store.result && (
          <button
            onClick={handleReOptimize}
            disabled={store.isLoading}
            className="px-6 py-3 rounded-xl font-semibold text-sm bg-surface border border-accent/20 text-accent-light hover:bg-accent/10 disabled:opacity-40 transition-all flex items-center gap-2 animate-fade-in"
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

      {/* Output Tabs & Content */}
      {(store.result || store.scores || store.isLoading || store.isScoring || store.isStreaming) && (
        <div className="space-y-4 animate-fade-in">
          {/* Tab Bar */}
          <div className="flex items-center gap-1 p-1 bg-surface rounded-xl border border-border w-fit">
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
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                    store.activeTab === tab.id
                      ? 'bg-surface-hover text-text shadow-sm'
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
