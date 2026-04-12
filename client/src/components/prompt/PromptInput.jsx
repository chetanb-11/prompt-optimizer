import usePromptStore from '../../store/promptStore';
import { estimateTokens, countWords, countChars } from '../../utils/tokenCounter';
import { X, Upload } from 'lucide-react';
import { useRef, useState } from 'react';

export default function PromptInput() {
  const { prompt, setPrompt, context, setContext, isLoading } = usePromptStore();
  const [showContext, setShowContext] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const tokens = estimateTokens(prompt);
  const words = countWords(prompt);
  const chars = countChars(prompt);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'text/plain' || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
      const text = await file.text();
      setContext(text);
      setShowContext(true);
    } else {
      // For other file types, read as text
      try {
        const text = await file.text();
        setContext(text);
        setShowContext(true);
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Main Prompt Input */}
      <div className="glass-card p-1 glow-blue">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt here... (e.g., 'Write a Python function that sorts a list')"
            rows={6}
            disabled={isLoading}
            className="w-full bg-transparent border-0 outline-none resize-none p-4 text-text placeholder-text-dim font-mono text-sm leading-relaxed"
            id="prompt-input"
          />

          {/* Clear button */}
          {prompt && (
            <button
              onClick={() => setPrompt('')}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
              title="Clear prompt"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Stats Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border text-xs text-text-muted">
          <div className="flex items-center gap-4">
            <span>
              <span className="text-text-secondary font-medium">{words}</span> words
            </span>
            <span>
              <span className="text-text-secondary font-medium">{chars}</span> chars
            </span>
            <span>
              ~<span className="text-text-secondary font-medium">{tokens}</span> tokens
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowContext(!showContext)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                showContext || context
                  ? 'bg-primary/10 text-primary-light'
                  : 'hover:bg-surface-hover text-text-muted hover:text-text-secondary'
              }`}
            >
              <Upload className="w-3 h-3" />
              Context
            </button>
          </div>
        </div>
      </div>

      {/* Context Panel (collapsible) */}
      {showContext && (
        <div className="glass-card p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
              Additional Context
            </label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.csv,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs px-2 py-1 rounded-md bg-surface-hover text-text-secondary hover:text-text transition-colors"
              >
                Upload File
              </button>
              {context && (
                <button
                  onClick={() => setContext('')}
                  className="text-xs px-2 py-1 rounded-md text-error hover:bg-error/10 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Paste additional context here (documentation, requirements, etc.)..."
            rows={3}
            className="w-full bg-surface rounded-lg border border-border p-3 text-sm text-text placeholder-text-dim outline-none focus:border-primary/50 resize-none font-mono"
          />
          {context && (
            <p className="text-xs text-text-muted mt-1">
              {countWords(context)} words of context will be included in the optimization.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
