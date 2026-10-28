import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  BookOpen,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { searchKnowledgeBaseApi } from '../../services/kb.api.js';
import { ChunkSearchResultItem } from '../../types/kb.js';
import { Card, CardHeader, CardContent } from '../ui/Card.js';
import { Button } from '../ui/Button.js';
import { Badge } from '../ui/Badge.js';
import { LoadingSpinner } from '../ui/LoadingSpinner.js';

interface VectorSearchPlaygroundProps {
  onClose: () => void;
}

export const VectorSearchPlayground: React.FC<VectorSearchPlaygroundProps> = ({ onClose }) => {
  const { accessToken, activeOrg } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ChunkSearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !accessToken || !activeOrg) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const data = await searchKnowledgeBaseApi(accessToken, activeOrg.organizationId, query.trim(), {
        limit: 5,
        threshold: 0.35,
      });
      setResults(data);
    } catch (err) {
      setError((err as Error).message || 'Vector search query failed');
    } finally {
      setLoading(false);
    }
  };

  const getMatchQualityVariant = (similarity: number): 'success' | 'warning' | 'neutral' => {
    if (similarity >= 0.75) return 'success';
    if (similarity >= 0.5) return 'warning';
    return 'neutral';
  };

  return (
    <Card className="border-indigo-500/30 shadow-xl mb-6 bg-slate-900/60">
      <CardHeader
        title="Vector Semantic Search Playground"
        subtitle="Simulate live pgvector cosine similarity retrieval (<=>) across indexed organization chunks"
        icon={<Sparkles className="w-5 h-5 text-indigo-400" />}
        action={
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        }
      />
      <CardContent className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a natural language query (e.g. 'How do customer refunds work within 14 days?')..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!query.trim() || loading}
            isLoading={loading}
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            Search Vector Store
          </Button>
        </form>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2">
            <LoadingSpinner size="md" />
            <p className="text-xs text-slate-400">Embedding query and running pgvector distance search...</p>
          </div>
        ) : hasSearched && results.length === 0 ? (
          <div className="py-6 text-center text-slate-400 space-y-1">
            <BookOpen className="w-6 h-6 mx-auto text-slate-600 mb-1" />
            <p className="text-xs font-semibold text-white">No Matching Chunks Found</p>
            <p className="text-[11px] text-slate-400">
              No chunks in the current organization exceeded the similarity threshold.
            </p>
          </div>
        ) : (
          results.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Top Retrieved Chunks ({results.length})
              </div>

              {results.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 space-y-2 hover:border-indigo-500/20 transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs font-bold text-slate-400">
                        #{idx + 1}
                      </span>
                      <strong className="text-xs text-white truncate">{item.documentTitle}</strong>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Chunk #{item.chunkIndex + 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={getMatchQualityVariant(item.similarity)} size="sm">
                        {(item.similarity * 100).toFixed(1)}% Match
                      </Badge>
                      <Badge variant="neutral" size="sm">
                        {item.tokenCount} tokens
                      </Badge>
                    </div>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed font-mono bg-slate-950/40 p-2.5 rounded-lg border border-white/5 whitespace-pre-wrap">
                    {item.content}
                  </p>
                </div>
              ))}
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
};
