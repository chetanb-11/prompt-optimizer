import ABTestPanel from '../components/testing/ABTestPanel';
import FormatConverter from '../components/converter/FormatConverter';
import { FlaskConical, ArrowRightLeft } from 'lucide-react';
import { useState } from 'react';

export default function ABTesting() {
  const [activeView, setActiveView] = useState('ab');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-text tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-white" />
          </div>
          A/B Testing & Tools
        </h1>
        <p className="text-sm text-text-muted mt-1 ml-[52px]">
          Compare variants and convert prompt formats
        </p>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-1 p-1 bg-surface rounded-xl border border-border w-fit">
        <button
          onClick={() => setActiveView('ab')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeView === 'ab'
              ? 'bg-surface-hover text-text shadow-sm'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          A/B Testing
        </button>
        <button
          onClick={() => setActiveView('converter')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeView === 'converter'
              ? 'bg-surface-hover text-text shadow-sm'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          Format Converter
        </button>
      </div>

      {/* Content */}
      {activeView === 'ab' ? <ABTestPanel /> : <FormatConverter />}
    </div>
  );
}
