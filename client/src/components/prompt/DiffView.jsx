import { useMemo } from 'react';
import usePromptStore from '../../store/promptStore';
import { computeDiff, diffStats } from '../../utils/diffUtils';
import { GitCompareArrows, Plus, Minus, Equal } from 'lucide-react';

export default function DiffView() {
  const { result, prompt } = usePromptStore();

  const parts = useMemo(() => {
    if (!result) return [];
    return computeDiff(prompt, result.optimized);
  }, [prompt, result]);

  const stats = useMemo(() => {
    if (!result) return null;
    return diffStats(prompt, result.optimized);
  }, [prompt, result]);

  if (!result) {
    return (
      <div className="glass-card p-8 text-center">
        <GitCompareArrows className="w-8 h-8 text-text-muted mx-auto mb-2" />
        <p className="text-text-secondary text-sm">Diff view will appear after optimization</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Stats Bar */}
      {stats && (
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1 text-emerald-400">
            <Plus className="w-3 h-3" /> {stats.added} added
          </span>
          <span className="flex items-center gap-1 text-red-400">
            <Minus className="w-3 h-3" /> {stats.removed} removed
          </span>
          <span className="flex items-center gap-1 text-text-muted">
            <Equal className="w-3 h-3" /> {stats.unchanged} unchanged
          </span>
        </div>
      )}

      {/* Side-by-Side View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Original */}
        <div className="glass-card p-4">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Original
          </h4>
          <pre className="text-sm text-text-secondary font-mono whitespace-pre-wrap leading-relaxed">
            {prompt}
          </pre>
        </div>

        {/* Optimized */}
        <div className="glass-card p-4">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Optimized
          </h4>
          <pre className="text-sm text-text font-mono whitespace-pre-wrap leading-relaxed">
            {result.optimized}
          </pre>
        </div>
      </div>

      {/* Inline Diff */}
      <div className="glass-card p-4">
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
          Inline Diff
        </h4>
        <div className="bg-surface rounded-xl p-4 border border-border font-mono text-sm leading-relaxed">
          {parts.map((part, i) => (
            <span
              key={i}
              className={
                part.added
                  ? 'bg-emerald-500/15 text-emerald-300 px-0.5 rounded'
                  : part.removed
                  ? 'bg-red-500/15 text-red-400 line-through px-0.5 rounded opacity-60'
                  : 'text-text-secondary'
              }
            >
              {part.value}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
