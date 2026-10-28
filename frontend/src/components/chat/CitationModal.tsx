import React from 'react';
import { X, BookOpen, ExternalLink, Percent, ShieldCheck } from 'lucide-react';
import { CitationItem } from '../../types/chat.js';
import { Button } from '../ui/Button.js';
import { Badge } from '../ui/Badge.js';

interface CitationModalProps {
  citation: CitationItem | null;
  onClose: () => void;
}

export const CitationModal: React.FC<CitationModalProps> = ({ citation, onClose }) => {
  if (!citation) return null;

  const similarityPct = Math.round(citation.similarity * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl glass-card border border-brand-500/30 p-6 shadow-2xl z-10 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-tight">
                  Source Document Citation [{citation.index}]
                </span>
                <Badge variant="brand" size="sm">
                  Chunk #{citation.chunkIndex}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-400 font-medium truncate max-w-xs mt-0.5">
                {citation.documentTitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Relevance Metric */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between">
            <span className="text-slate-400 text-[11px] flex items-center gap-1">
              <Percent className="w-3.5 h-3.5 text-brand-400" />
              Semantic Match
            </span>
            <span className="font-semibold text-emerald-400">{similarityPct}%</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between">
            <span className="text-slate-400 text-[11px] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Verification
            </span>
            <span className="font-semibold text-slate-200">Grounded Fact</span>
          </div>
        </div>

        {/* Chunk Content Excerpt */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Retrieved Evidence Excerpt
          </span>
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/5 text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap max-h-56 overflow-y-auto">
            {citation.snippet}
          </div>
        </div>

        {/* Footer info & dismiss */}
        <div className="pt-2 flex items-center justify-between border-t border-white/5 text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <ExternalLink className="w-3 h-3 text-slate-400" />
            Document ID: {citation.documentId.substring(0, 12)}...
          </span>
          <Button size="sm" variant="secondary" onClick={onClose}>
            Close Citation
          </Button>
        </div>
      </div>
    </div>
  );
};
