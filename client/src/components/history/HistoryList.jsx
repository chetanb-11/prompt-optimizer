import useHistoryStore from '../../store/historyStore';
import usePromptStore from '../../store/promptStore';
import { formatRelativeTime, truncate, MODE_LABELS } from '../../utils/formatters';
import CopyButton from '../common/CopyButton';
import { Trash2, Star, Tag, ExternalLink, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function HistoryList() {
  const { getFiltered, removeEntry, toggleFavorite, addTag, removeTag, searchQuery, setSearchQuery, filterTag, setFilterTag, getAllTags } = useHistoryStore();
  const { loadPrompt } = usePromptStore();
  const navigate = useNavigate();
  const [tagInput, setTagInput] = useState({});

  const items = getFiltered();
  const allTags = getAllTags();

  const handleLoad = (entry) => {
    loadPrompt(entry.original);
    toast.success('Prompt loaded');
    navigate('/');
  };

  const handleAddTag = (id, e) => {
    e.preventDefault();
    const tag = tagInput[id]?.trim();
    if (!tag) return;
    addTag(id, tag);
    setTagInput((prev) => ({ ...prev, [id]: '' }));
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search prompts..."
          className="flex-1 bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder-text-dim outline-none focus:border-primary/50 transition-colors"
          id="history-search"
        />
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setFilterTag(tag)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterTag === tag
                    ? 'bg-primary/20 text-primary-light'
                    : 'bg-surface text-text-muted hover:text-text-secondary'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* History Items */}
      {items.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-text-secondary">No prompt history yet</p>
          <p className="text-text-muted text-xs mt-1">Optimize some prompts to see them here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((entry) => (
            <div key={entry.id} className="glass-card p-4 group animate-fade-in">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-hover text-text-muted font-medium">
                      {MODE_LABELS[entry.mode] || entry.mode}
                    </span>
                    {entry.preset && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent-light font-medium">
                        {entry.preset}
                      </span>
                    )}
                    <span className="text-[10px] text-text-dim">
                      {formatRelativeTime(entry.timestamp)}
                    </span>
                    {entry.scores && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">
                        Score: {entry.scores.overall}
                      </span>
                    )}
                  </div>

                  {/* Original prompt preview */}
                  <p className="text-sm text-text-secondary mb-1 font-mono">
                    {truncate(entry.original, 120)}
                  </p>

                  {/* Optimized preview */}
                  <p className="text-xs text-text-muted">
                    → {truncate(entry.optimized, 100)}
                  </p>

                  {/* Tags */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {entry.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-hover text-[10px] text-text-muted"
                      >
                        #{tag}
                        <button
                          onClick={() => removeTag(entry.id, tag)}
                          className="hover:text-error transition-colors"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                    <form
                      onSubmit={(e) => handleAddTag(entry.id, e)}
                      className="inline-flex"
                    >
                      <input
                        value={tagInput[entry.id] || ''}
                        onChange={(e) =>
                          setTagInput((prev) => ({ ...prev, [entry.id]: e.target.value }))
                        }
                        placeholder="+ tag"
                        className="w-16 px-1.5 py-0.5 rounded bg-transparent text-[10px] text-text-muted outline-none border border-transparent focus:border-border hover:border-border transition-colors"
                      />
                    </form>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => toggleFavorite(entry.id)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      entry.favorite ? 'text-amber-400' : 'text-text-muted hover:text-amber-400'
                    }`}
                    title="Favorite"
                  >
                    <Star className={`w-4 h-4 ${entry.favorite ? 'fill-current' : ''}`} />
                  </button>
                  <CopyButton text={entry.optimized} label="" className="!px-1.5" />
                  <button
                    onClick={() => handleLoad(entry)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-primary transition-colors"
                    title="Load in optimizer"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeEntry(entry.id)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-error transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
