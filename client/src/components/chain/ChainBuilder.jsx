import { useState } from 'react';
import { executeChain } from '../../api/client';
import CopyButton from '../common/CopyButton';
import { Plus, Trash2, Play, Loader2, ArrowDown, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';

const AVAILABLE_STEPS = [
  { id: 'clarity', label: 'Improve Clarity', color: 'text-blue-400' },
  { id: 'concise', label: 'Make Concise', color: 'text-emerald-400' },
  { id: 'reasoning', label: 'Add Reasoning', color: 'text-purple-400' },
  { id: 'system_prompt', label: 'System Prompt', color: 'text-amber-400' },
  { id: 'tone', label: 'Transform Tone', color: 'text-pink-400' },
];

export default function ChainBuilder() {
  const [prompt, setPrompt] = useState('');
  const [steps, setSteps] = useState(['clarity', 'concise']);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const addStep = (mode) => {
    if (steps.length >= 5) {
      toast.error('Maximum 5 steps allowed');
      return;
    }
    setSteps([...steps, mode]);
  };

  const removeStep = (index) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const changeStep = (index, mode) => {
    const updated = [...steps];
    updated[index] = mode;
    setSteps(updated);
  };

  const handleExecute = async () => {
    if (!prompt.trim()) {
      toast.error('Enter a prompt first');
      return;
    }
    if (steps.length === 0) {
      toast.error('Add at least one step');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const data = await executeChain({ prompt, steps });
      setResult(data);
      toast.success('Chain completed!');
    } catch {
      // Error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Prompt Input */}
      <div className="glass-card p-1 glow-purple">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter the prompt to run through the optimization chain..."
          rows={4}
          className="w-full bg-transparent border-0 outline-none resize-none p-4 text-text placeholder-text-dim font-mono text-sm leading-relaxed"
          id="chain-prompt-input"
        />
      </div>

      {/* Pipeline Steps */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Pipeline Steps
          </h3>
          <span className="text-xs text-text-muted">{steps.length}/5</span>
        </div>

        <div className="space-y-2">
          {steps.map((step, index) => {
            const stepInfo = AVAILABLE_STEPS.find((s) => s.id === step);
            return (
              <div key={index} className="animate-fade-in">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-surface-hover flex items-center justify-center text-xs font-mono text-text-muted flex-shrink-0">
                    {index + 1}
                  </span>
                  <select
                    value={step}
                    onChange={(e) => changeStep(index, e.target.value)}
                    className="flex-1 bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-text outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
                  >
                    {AVAILABLE_STEPS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeStep(index)}
                    className="p-2 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors"
                    title="Remove step"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex justify-center py-1">
                    <ArrowDown className="w-4 h-4 text-text-dim" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Step */}
        {steps.length < 5 && (
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_STEPS.map((s) => (
              <button
                key={s.id}
                onClick={() => addStep(s.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-surface border border-border text-text-secondary hover:bg-surface-hover hover:border-border-light transition-colors"
              >
                <Plus className="w-3 h-3" />
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Execute Button */}
      <button
        onClick={handleExecute}
        disabled={loading || !prompt.trim() || steps.length === 0}
        className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-accent to-primary text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        id="execute-chain-btn"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Running Pipeline...
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            Execute Chain ({steps.length} steps)
          </>
        )}
      </button>

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-fade-in">
          {/* Step-by-step results */}
          {result.steps.map((step, index) => (
            <div key={index} className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-white">
                    {step.step}
                  </span>
                  <span className="text-sm font-medium text-text capitalize">
                    {step.mode.replace('_', ' ')}
                  </span>
                </div>
                <CopyButton text={step.result} label="Copy" />
              </div>
              <pre className="text-xs text-text-secondary font-mono bg-surface rounded-lg p-3 whitespace-pre-wrap border border-border mb-2">
                {step.result}
              </pre>
              <p className="text-xs text-text-muted">{step.explanation}</p>
            </div>
          ))}

          {/* Final Result */}
          <div className="gradient-border p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-text flex items-center gap-2">
                🎯 Final Result
              </h3>
              <CopyButton text={result.final} label="Copy Final" />
            </div>
            <pre className="text-sm text-text font-mono whitespace-pre-wrap leading-relaxed">
              {result.final}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
