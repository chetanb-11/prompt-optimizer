import usePromptStore from '../../store/promptStore';
import CopyButton from '../common/CopyButton';
import { Lightbulb, Coins, RefreshCw, Zap } from 'lucide-react';

export default function OutputPanel() {
  const { result, isLoading, isStreaming, streamingText, iterations } = usePromptStore();

  // ── Streaming State — show tokens appearing in real-time ──
  if (isStreaming || (isLoading && !result)) {
    return (
      <div className="glass-card p-6 space-y-4 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div className="pulse-dot" />
          <p className="text-sm text-text-secondary flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            {streamingText
              ? 'Streaming response from Gemini AI...'
              : 'Connecting to Gemini AI...'}
          </p>
        </div>

        {streamingText ? (
          <div className="bg-surface rounded-xl p-4 border border-border">
            <pre className="whitespace-pre-wrap text-sm text-text leading-relaxed font-mono">
              {streamingText}
              <span className="streaming-cursor" />
            </pre>
          </div>
        ) : (
          <>
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-5/6" />
            <div className="skeleton h-4 w-4/6" />
            <div className="skeleton h-4 w-full mt-4" />
            <div className="skeleton h-4 w-3/4" />
          </>
        )}
      </div>
    );
  }

  if (!result) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-surface-hover mx-auto mb-3 flex items-center justify-center">
          <Lightbulb className="w-6 h-6 text-text-muted" />
        </div>
        <p className="text-text-secondary text-sm">Optimized prompt will appear here</p>
        <p className="text-text-muted text-xs mt-1">Select a mode and click "Optimize"</p>
      </div>
    );
  }

  // Show the latest version (from iterations or base result)
  const latestOptimized =
    iterations.length > 0 ? iterations[iterations.length - 1].optimized : result.optimized;
  const latestExplanation =
    iterations.length > 0 ? iterations[iterations.length - 1].explanation : result.explanation;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Optimized Prompt Card */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-accent" />
            Optimized Prompt
            {iterations.length > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent-light font-medium">
                v{iterations.length + 1}
              </span>
            )}
          </h3>
          <CopyButton text={latestOptimized} label="Copy" />
        </div>
        <div className="bg-surface rounded-xl p-4 border border-border">
          <pre className="whitespace-pre-wrap text-sm text-text leading-relaxed font-mono">
            {latestOptimized}
          </pre>
        </div>
      </div>

      {/* Explanation Card */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-text mb-2 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          What Changed
        </h3>
        <p className="text-sm text-text-secondary leading-relaxed">{latestExplanation}</p>
      </div>

      {/* Token & Cost Info */}
      {result.tokenCount && (
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Coins className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
              Token Analysis
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Original" value={result.tokenCount.original} unit="tokens" />
            <Stat label="Optimized" value={result.tokenCount.optimized} unit="tokens" />
            <Stat
              label="Change"
              value={`${result.tokenCount.optimized > result.tokenCount.original ? '+' : ''}${
                result.tokenCount.optimized - result.tokenCount.original
              }`}
              unit="tokens"
              color={result.tokenCount.optimized <= result.tokenCount.original ? 'text-emerald-400' : 'text-amber-400'}
            />
            {result.estimatedCost && (
              <Stat label="Est. Cost" value={result.estimatedCost.totalCost} />
            )}
          </div>
        </div>
      )}

      {/* Iteration History */}
      {iterations.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3 flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5" />
            Iteration History
          </h3>
          <div className="space-y-2">
            {iterations.map((iter, idx) => (
              <details key={idx} className="group">
                <summary className="flex items-center gap-2 cursor-pointer text-xs text-text-secondary hover:text-text transition-colors py-1">
                  <span className="px-1.5 py-0.5 rounded bg-surface-hover text-text-muted font-mono">
                    v{idx + 2}
                  </span>
                  <span className="truncate">{iter.explanation}</span>
                </summary>
                <pre className="mt-2 p-3 bg-surface rounded-lg text-xs text-text-secondary font-mono whitespace-pre-wrap border border-border">
                  {iter.optimized}
                </pre>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, unit, color = 'text-text' }) {
  return (
    <div className="bg-surface rounded-lg p-2.5 border border-border">
      <p className="text-[10px] text-text-muted uppercase tracking-wide">{label}</p>
      <p className={`text-sm font-semibold ${color} animate-count`}>
        {value} {unit && <span className="text-[10px] text-text-muted font-normal">{unit}</span>}
      </p>
    </div>
  );
}
