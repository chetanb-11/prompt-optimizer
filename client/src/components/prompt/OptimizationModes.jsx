import usePromptStore from '../../store/promptStore';
import { Sparkles, Minimize2, Brain, Terminal, Palette } from 'lucide-react';

const MODES = [
  {
    id: 'clarity',
    label: 'Improve Clarity',
    description: 'Remove ambiguity, add structure',
    icon: Sparkles,
    color: 'from-blue-500 to-cyan-500',
    activeBg: 'bg-blue-500/10',
    activeText: 'text-blue-400',
    activeBorder: 'border-blue-500/30',
  },
  {
    id: 'concise',
    label: 'Make Concise',
    description: 'Minimize tokens, maximize info',
    icon: Minimize2,
    color: 'from-emerald-500 to-teal-500',
    activeBg: 'bg-emerald-500/10',
    activeText: 'text-emerald-400',
    activeBorder: 'border-emerald-500/30',
  },
  {
    id: 'reasoning',
    label: 'Add Reasoning',
    description: 'Chain-of-thought, step-by-step',
    icon: Brain,
    color: 'from-purple-500 to-violet-500',
    activeBg: 'bg-purple-500/10',
    activeText: 'text-purple-400',
    activeBorder: 'border-purple-500/30',
  },
  {
    id: 'system_prompt',
    label: 'System Prompt',
    description: 'Convert to API system instruction',
    icon: Terminal,
    color: 'from-amber-500 to-orange-500',
    activeBg: 'bg-amber-500/10',
    activeText: 'text-amber-400',
    activeBorder: 'border-amber-500/30',
  },
  {
    id: 'tone',
    label: 'Transform Tone',
    description: 'Formal, technical, or creative',
    icon: Palette,
    color: 'from-pink-500 to-rose-500',
    activeBg: 'bg-pink-500/10',
    activeText: 'text-pink-400',
    activeBorder: 'border-pink-500/30',
  },
];

const TONE_OPTIONS = [
  { id: 'formal', label: 'Formal' },
  { id: 'technical', label: 'Technical' },
  { id: 'creative', label: 'Creative' },
];

export default function OptimizationModes() {
  const { mode, setMode, toneStyle, setToneStyle } = usePromptStore();

  return (
    <div className="space-y-3">
      <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
        Optimization Mode
      </label>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {MODES.map((m) => {
          const isActive = mode === m.id;
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              id={`mode-${m.id}`}
              className={`relative flex flex-col items-start gap-1.5 p-3 rounded-xl border text-left transition-all duration-200 ${
                isActive
                  ? `${m.activeBg} ${m.activeText} ${m.activeBorder}`
                  : 'bg-surface border-border text-text-secondary hover:bg-surface-hover hover:border-border-light'
              }`}
            >
              <div
                className={`p-1.5 rounded-lg ${
                  isActive ? `bg-gradient-to-br ${m.color} text-white` : 'bg-surface-hover'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className={`text-xs font-semibold ${isActive ? m.activeText : 'text-text'}`}>
                  {m.label}
                </p>
                <p className="text-[10px] text-text-muted leading-tight mt-0.5">{m.description}</p>
              </div>
              {isActive && (
                <div className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-r ${m.color}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Tone Style Selector (only when tone mode is active) */}
      {mode === 'tone' && (
        <div className="flex items-center gap-2 animate-fade-in">
          <span className="text-xs text-text-muted">Style:</span>
          {TONE_OPTIONS.map((t) => (
            <button
              key={t.id}
              onClick={() => setToneStyle(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                toneStyle === t.id
                  ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                  : 'bg-surface text-text-secondary hover:bg-surface-hover border border-transparent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
