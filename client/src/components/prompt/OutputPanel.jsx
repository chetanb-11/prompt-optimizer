import CopyButton from '../common/CopyButton';

export default function OutputPanel({ result, version, isLoading }) {
  if (!result) {
    return (
      <div className="glass-card flex min-h-60 flex-col p-5">
        <h2 className="text-base font-semibold text-text">Optimized prompt</h2>
        {isLoading ? (
          <div aria-hidden="true" className="mt-6 space-y-4">
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-5/6" />
            <div className="skeleton h-4 w-3/4" />
          </div>
        ) : (
          <p className="mt-4 text-sm text-text-secondary">Your optimized prompt will appear here.</p>
        )}
      </div>
    );
  }

  const tokens = result.tokenCount;
  return (
    <div className="glass-card min-w-0 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-text">Optimized prompt</h2>
          <p className="text-xs text-text-secondary">Version {version}</p>
        </div>
        <CopyButton key={version} text={result.optimized} label="Copy prompt" />
      </div>
      <pre className="max-h-[55vh] overflow-auto whitespace-pre-wrap [overflow-wrap:anywhere] rounded-xl border border-border bg-surface p-4 font-sans text-sm leading-relaxed text-text" tabIndex={0} aria-label="Optimized prompt text">
        {result.optimized}
      </pre>
      {result.explanation && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-semibold text-text">What changed</summary>
          <p className="mt-2 whitespace-pre-wrap [overflow-wrap:anywhere] text-sm text-text-secondary">{result.explanation}</p>
        </details>
      )}
      {tokens != null && (
        <p className="mt-4 text-xs text-text-secondary">
          {typeof tokens === 'number' ? `${tokens.toLocaleString()} tokens` : `${tokens.original} → ${tokens.optimized} tokens`}
          {result.estimatedCost && ` · Estimated cost ${result.estimatedCost.totalCost}`}
        </p>
      )}
    </div>
  );
}
