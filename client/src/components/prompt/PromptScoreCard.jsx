import usePromptStore from '../../store/promptStore';
import { getScoreColor, getScoreBg } from '../../utils/formatters';
import { Target, Lightbulb, Loader2 } from 'lucide-react';

export default function PromptScoreCard() {
  const { scores, isScoring } = usePromptStore();

  if (isScoring) {
    return (
      <div className="glass-card p-6 text-center animate-fade-in">
        <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto mb-2" />
        <p className="text-sm text-text-secondary">Analyzing prompt quality...</p>
      </div>
    );
  }

  if (!scores) {
    return (
      <div className="glass-card p-8 text-center">
        <Target className="w-8 h-8 text-text-muted mx-auto mb-2" />
        <p className="text-text-secondary text-sm">Score your prompt to see quality analysis</p>
        <p className="text-text-muted text-xs mt-1">Click "Score" after entering a prompt</p>
      </div>
    );
  }

  const dimensions = [
    { key: 'clarity', label: 'Clarity', weight: '30%' },
    { key: 'specificity', label: 'Specificity', weight: '30%' },
    { key: 'completeness', label: 'Completeness', weight: '25%' },
    { key: 'tokenEfficiency', label: 'Token Efficiency', weight: '15%' },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Overall Score */}
      <div className="glass-card p-5 text-center">
        <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Overall Score</p>
        <div className="relative w-24 h-24 mx-auto mb-3">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#1e293b" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="url(#scoreGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(scores.overall / 10) * 264} 264`}
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl font-bold ${getScoreColor(scores.overall)}`}>
              {scores.overall}
            </span>
          </div>
        </div>
        <p className="text-xs text-text-muted">out of 10</p>
      </div>

      {/* Dimension Scores */}
      <div className="glass-card p-5 space-y-4">
        <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
          Breakdown
        </h4>
        {dimensions.map(({ key, label, weight }) => {
          const dim = scores.scores[key];
          if (!dim) return null;
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-text font-medium">{label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-text-muted">{weight}</span>
                  <span className={`text-sm font-bold ${getScoreColor(dim.score)}`}>
                    {dim.score}
                  </span>
                </div>
              </div>
              <div className="w-full h-1.5 bg-surface-active rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full score-bar-fill ${getScoreBg(dim.score)}`}
                  style={{ width: `${(dim.score / 10) * 100}%` }}
                />
              </div>
              <p className="text-xs text-text-muted mt-1">{dim.feedback}</p>
            </div>
          );
        })}
      </div>

      {/* Suggestions */}
      {scores.suggestions?.length > 0 && (
        <div className="glass-card p-5">
          <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3 flex items-center gap-2">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            Suggestions
          </h4>
          <ul className="space-y-2">
            {scores.suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="text-primary font-bold mt-0.5">•</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
