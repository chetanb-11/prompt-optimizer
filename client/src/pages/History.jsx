import HistoryList from '../components/history/HistoryList';
import useHistoryStore from '../store/historyStore';
import { History as HistoryIcon, Trash2 } from 'lucide-react';

export default function History() {
  const { history, clearHistory } = useHistoryStore();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center">
              <HistoryIcon className="w-5 h-5 text-white" />
            </div>
            Prompt History
          </h1>
          <p className="text-sm text-text-muted mt-1 ml-[52px]">
            {history.length} saved prompt{history.length !== 1 ? 's' : ''}
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={() => {
              if (confirm('Clear all history? This cannot be undone.')) clearHistory();
            }}
            className="p-2 rounded-xl text-text-muted hover:text-error hover:bg-error/10 transition-colors"
            title="Clear all history"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      <HistoryList />
    </div>
  );
}
