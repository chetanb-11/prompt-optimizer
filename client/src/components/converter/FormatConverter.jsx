import { useState } from 'react';
import { convertPrompt } from '../../api/client';
import CopyButton from '../common/CopyButton';
import { ArrowRightLeft, Loader2, FileJson, MessageCircle, Code } from 'lucide-react';
import toast from 'react-hot-toast';

const FORMATS = [
  { id: 'json', label: 'JSON Format', icon: FileJson, desc: 'Structured API-ready JSON' },
  { id: 'chat', label: 'Chat Format', icon: MessageCircle, desc: 'System/User/Assistant messages' },
  { id: 'api', label: 'API-Ready Code', icon: Code, desc: 'Copy-paste ready code snippet' },
];

export default function FormatConverter() {
  const [prompt, setPrompt] = useState('');
  const [format, setFormat] = useState('json');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleConvert = async () => {
    if (!prompt.trim()) {
      toast.error('Enter a prompt first');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const data = await convertPrompt({ prompt, format });
      setResult(data);
      toast.success('Prompt converted!');
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
          placeholder="Enter a prompt to convert to a different format..."
          rows={4}
          className="w-full bg-transparent border-0 outline-none resize-none p-4 text-text placeholder-text-dim font-mono text-sm"
          id="converter-prompt-input"
        />
      </div>

      {/* Format Selection */}
      <div className="grid grid-cols-3 gap-3">
        {FORMATS.map((f) => {
          const Icon = f.icon;
          const isActive = format === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFormat(f.id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                isActive
                  ? 'bg-primary/10 border-primary/30 text-primary-light'
                  : 'bg-surface border-border text-text-secondary hover:bg-surface-hover'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{f.label}</span>
              <span className="text-[10px] text-text-muted">{f.desc}</span>
            </button>
          );
        })}
      </div>

      {/* Convert Button */}
      <button
        onClick={handleConvert}
        disabled={loading || !prompt.trim()}
        className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        id="convert-btn"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Converting...
          </>
        ) : (
          <>
            <ArrowRightLeft className="w-4 h-4" />
            Convert to {FORMATS.find((f) => f.id === format)?.label}
          </>
        )}
      </button>

      {/* Result */}
      {result && (
        <div className="space-y-4 animate-fade-in">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text">Converted Output</h3>
              <CopyButton text={result.converted} label="Copy" />
            </div>
            <pre className="text-sm text-text font-mono bg-surface rounded-xl p-4 whitespace-pre-wrap border border-border leading-relaxed overflow-x-auto">
              {result.converted}
            </pre>
          </div>

          <div className="glass-card p-4">
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
              Usage Notes
            </h4>
            <p className="text-sm text-text-secondary">{result.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
}
