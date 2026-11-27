import { useMemo } from 'react';
import { computeDiff, diffStats } from '../../utils/diffUtils';
import { Plus, Minus, Equal } from 'lucide-react';

export default function DiffView({ original, optimized }) {
  const parts = useMemo(() => computeDiff(original, optimized), [original, optimized]);
  const stats = useMemo(() => diffStats(original, optimized), [original, optimized]);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Stats Bar */}
      {stats && (
        <div className="flex flex-wrap items-center gap-4 text-xs">
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
      <div className="grid grid-cols-1 min-[1450px]:grid-cols-2 gap-4">
        {/* Original */}
        <div className="glass-card p-4">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Original
          </h4>
          <pre className="text-sm text-text-secondary font-mono whitespace-pre-wrap [overflow-wrap:anywhere] leading-relaxed">
            {original}
          </pre>
        </div>

        {/* Optimized */}
        <div className="glass-card p-4">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Optimized
          </h4>
          <pre className="text-sm text-text font-mono whitespace-pre-wrap [overflow-wrap:anywhere] leading-relaxed">
            {optimized}
          </pre>
        </div>
      </div>

      {/* Inline Diff */}
      <div className="glass-card p-4">
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
          Inline Diff
        </h4>
        <div className="bg-surface rounded-xl p-4 border border-border font-mono text-sm leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">
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
