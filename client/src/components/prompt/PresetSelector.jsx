import usePromptStore from '../../store/promptStore';
import { MessageSquare, Bot, Gauge, BookOpen, Sparkles } from 'lucide-react';

const PRESETS = [
  { id: 'chatgpt', label: 'ChatGPT', icon: MessageSquare, desc: 'Optimized for ChatGPT conventions' },
  { id: 'claude', label: 'Claude', icon: Bot, desc: 'XML tags, detailed context' },
  { id: 'gemini', label: 'Gemini', icon: Sparkles, desc: 'Structured output, grounding context' },
  { id: 'api_efficient', label: 'API Efficient', icon: Gauge, desc: 'Minimum tokens, max quality' },
  { id: 'beginner', label: 'Beginner', icon: BookOpen, desc: 'Simple, with examples' },
];

export default function PresetSelector() {
  const { preset, setPreset } = usePromptStore();

  return (
    <div className="space-y-3">
      <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
        Preset <span className="text-text-muted font-normal normal-case">(optional)</span>
      </label>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => {
          const isActive = preset === p.id;
          const Icon = p.icon;
          return (
            <button
              key={p.id}
              onClick={() => setPreset(p.id)}
              id={`preset-${p.id}`}
              title={p.desc}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all duration-200 ${
                isActive
                  ? 'bg-accent/10 text-accent-light border-accent/30'
                  : 'bg-surface text-text-secondary border-border hover:bg-surface-hover hover:border-border-light'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
