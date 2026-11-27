import usePromptStore from '../../store/promptStore';
import { estimateTokens, countWords, countChars } from '../../utils/tokenCounter';
import { extractTextFromPDF } from '../../utils/pdfParser';
import { X, Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';

export default function PromptInput() {
  const { prompt, setPrompt, isLoading } = usePromptStore();
  const textareaRef = useRef(null);

  function tryExample() {
    setPrompt('Explain how rainbows form to a curious 10-year-old. Use three short bullet points.');
    textareaRef.current?.focus();
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="prompt-input" className="text-sm font-semibold text-text">Your prompt</label>
        {!prompt && (
          <button type="button" onClick={tryExample} disabled={isLoading} className="text-sm text-primary-light hover:underline">
            Try an example
          </button>
        )}
      </div>
      <div className="glass-card overflow-hidden focus-within:ring-1 focus-within:ring-primary">
        <div className="relative">
          <textarea
            ref={textareaRef}
            id="prompt-input"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Enter or paste a prompt to improve"
            rows={10}
            readOnly={isLoading}
            className="block w-full resize-y bg-transparent py-4 pl-4 pr-11 text-sm leading-relaxed text-text outline-none placeholder-text-muted"
          />
          {prompt && (
            <button
              type="button"
              onClick={() => { setPrompt(''); textareaRef.current?.focus(); }}
              disabled={isLoading}
              aria-label="Clear prompt"
              className="absolute right-3 top-3 rounded-lg p-1.5 text-text-muted hover:bg-surface-hover hover:text-text disabled:opacity-40"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border px-4 py-2 text-xs text-text-secondary">
          <span>{countWords(prompt)} words</span>
          <span>{countChars(prompt)} chars</span>
          <span>~{estimateTokens(prompt)} tokens</span>
        </div>
      </div>
    </div>
  );
}

export function PromptContext() {
  const { context, setContext } = usePromptStore();
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingFile(true);
    setFileError('');
    try {
      let text = '';

      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // Parse PDF to extract readable text
        text = await extractTextFromPDF(file);
        if (!text.trim()) {
          throw new Error('No readable text found in this PDF. It may be a scanned/image-based PDF.');
        }
      } else {
        // Plain text files (.txt, .md, .csv, .json, etc.)
        text = await file.text();
      }

      setContext(text);
    } catch (err) {
      setFileError(err.message || 'Could not read this file.');
    } finally {
      setIsParsingFile(false);
      // Reset file input so the same file can be re-uploaded
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="glass-card p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <label htmlFor="prompt-context" className="text-xs font-medium text-text-secondary uppercase tracking-wide">
          Additional Context
        </label>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.csv,.json,.pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isParsingFile}
            className="text-xs px-2 py-1 rounded-md bg-surface-hover text-text-secondary hover:text-text transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            {isParsingFile ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Parsing...
              </>
            ) : (
              'Upload File'
            )}
          </button>
          {context && (
            <button
              onClick={() => { setContext(''); setFileError(''); }}
              className="text-xs px-2 py-1 rounded-md text-error hover:bg-error/10 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      <textarea
        id="prompt-context"
        value={context}
        onChange={(e) => setContext(e.target.value)}
        placeholder="Paste additional context here (documentation, requirements, etc.)..."
        rows={3}
        className="w-full bg-surface rounded-lg border border-border p-3 text-sm text-text placeholder-text-dim outline-none focus:border-primary/50 resize-none font-mono"
      />
      {fileError && <p role="alert" className="text-xs text-error">{fileError}</p>}
      {context && (
        <p className="text-xs text-text-muted mt-1">
          {countWords(context)} words of context will be included in the optimization.
        </p>
      )}
    </div>
  );
}
