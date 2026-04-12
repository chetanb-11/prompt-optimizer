import { useState } from 'react';
import { comparePrompts } from '../../api/client';
import CopyButton from '../common/CopyButton';
import { FlaskConical, Loader2, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';

const MODES = [
  { id: 'clarity', label: 'Clarity' },
  { id: 'concise', label: 'Concise' },
  { id: 'reasoning', label: 'Reasoning' },
  { id: 'system_prompt', label: 'System Prompt' },
  { id: 'tone', label: 'Tone' },
];

const VARIANT_COLORS = [
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-purple-500 to-violet-500',
  'from-amber-500 to-orange-500',
  'from-pink-500 to-rose-500',
];

export default function ABTestPanel() {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState('clarity');
  const [variantCount, setVariantCount] = useState(3);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Enter a prompt first');
      return;
    }

    setLoading(true);
    setResult(null);
    setSelectedWinner(null);

    try {
      const data = await comparePrompts({ prompt, variants: variantCount, mode });
      setResult(data);
      toast.success(`${data.variants.length} variants generated`);
    } catch {
      // Error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input */}
      <div className="glass-card p-1">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter a prompt to generate optimized variants..."
          rows={4}
          className="w-full bg-transparent border-0 outline-none resize-none p-4 text-text placeholder-text-dim font-mono text-sm"
          id="ab-prompt-input"
        />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs text-text-muted">Mode:</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text outline-none focus:border-primary/50 appearance-none cursor-pointer"
          >
            {MODES.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-text-muted">Variants:</label>
          <div className="flex items-center gap-1">
            {[2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setVariantCount(n)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                  variantCount === n
                    ? 'bg-primary text-white'
                    : 'bg-surface text-text-secondary hover:bg-surface-hover border border-border'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="ml-auto px-6 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          id="generate-variants-btn"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FlaskConical className="w-4 h-4" />
              Generate Variants
            </>
          )}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: variantCount }).map((_, i) => (
            <div key={i} className="glass-card p-5 space-y-3">
              <div className="skeleton h-4 w-20" />
              <div className="skeleton h-3 w-full" />
              <div className="skeleton h-3 w-5/6" />
              <div className="skeleton h-3 w-4/6" />
            </div>
          ))}
        </div>
      )}

      {/* Variants */}
      {result && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {result.variants.map((variant, index) => (
              <div
                key={variant.id}
                className={`glass-card p-5 cursor-pointer transition-all ${
                  selectedWinner === variant.id
                    ? 'ring-2 ring-primary glow-blue'
                    : 'hover:border-border-light'
                }`}
                onClick={() => setSelectedWinner(variant.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-8 h-8 rounded-lg bg-gradient-to-br ${
                        VARIANT_COLORS[index % VARIANT_COLORS.length]
                      } flex items-center justify-center text-sm font-bold text-white`}
                    >
                      {variant.id}
                    </span>
                    <span className="text-xs text-text-muted font-medium">
                      {variant.approach}
                    </span>
                  </div>
                  {selectedWinner === variant.id && (
                    <Trophy className="w-4 h-4 text-amber-400 animate-scale-in" />
                  )}
                </div>

                <pre className="text-xs text-text-secondary font-mono bg-surface rounded-lg p-3 whitespace-pre-wrap border border-border mb-3 max-h-48 overflow-y-auto leading-relaxed">
                  {variant.optimized}
                </pre>

                <p className="text-xs text-text-muted">{variant.explanation}</p>

                <div className="mt-3 pt-3 border-t border-border">
                  <CopyButton text={variant.optimized} label="Copy Variant" className="w-full justify-center" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
