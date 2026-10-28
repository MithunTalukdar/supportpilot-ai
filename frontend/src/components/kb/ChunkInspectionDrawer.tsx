import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Layers,
  FileText,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { KnowledgeDocumentItem } from '../../types/kb.js';
import { getDocumentApi } from '../../services/kb.api.js';
import { DocumentStatusBadge } from './DocumentStatusBadge.js';
import { LoadingSpinner } from '../ui/LoadingSpinner.js';
import { Badge } from '../ui/Badge.js';

interface ChunkInspectionDrawerProps {
  documentId: string | null;
  onClose: () => void;
}

export const ChunkInspectionDrawer: React.FC<ChunkInspectionDrawerProps> = ({
  documentId,
  onClose,
}) => {
  const { accessToken, activeOrg } = useAuth();
  const [document, setDocument] = useState<KnowledgeDocumentItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedChunkId, setCopiedChunkId] = useState<string | null>(null);

  const fetchDocumentDetails = useCallback(async () => {
    if (!documentId || !accessToken || !activeOrg) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getDocumentApi(accessToken, activeOrg.organizationId, documentId);
      setDocument(data);
    } catch (err) {
      setError((err as Error).message || 'Failed to inspect document chunks');
    } finally {
      setLoading(false);
    }
  }, [documentId, accessToken, activeOrg]);

  useEffect(() => {
    if (documentId) {
      fetchDocumentDetails();
    }
  }, [documentId, fetchDocumentDetails]);

  if (!documentId) return null;

  const handleCopyChunk = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedChunkId(id);
    setTimeout(() => setCopiedChunkId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div className="w-full max-w-2xl bg-surface-darkest border-l border-white/10 shadow-2xl flex flex-col h-full transform transition-all">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-slate-900/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white truncate">
                {document?.title || 'Loading chunks...'}
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                <span>Format: <strong className="text-slate-300 uppercase">{document?.fileType || 'Doc'}</strong></span>
                <span>•</span>
                <span>{document?.chunks?.length || 0} Chunks Indexed</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close inspector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <LoadingSpinner size="lg" />
            <p className="text-xs text-slate-400">Loading vector chunks from PostgreSQL...</p>
          </div>
        ) : error || !document ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="w-10 h-10 text-rose-400 mb-2" />
            <h3 className="text-sm font-semibold text-white">Error Inspecting Document</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">{error || 'Document not found'}</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Metadata Bar */}
            <div className="p-4 bg-slate-900/30 border-b border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Status</span>
                <div>
                  <DocumentStatusBadge status={document.status} />
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Vector Chunks</span>
                <div className="text-sm font-bold text-white font-mono">
                  {document.chunks?.length || 0}
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Word Count</span>
                <div className="text-sm font-bold text-white font-mono">
                  {document.metadata?.wordCount || '—'}
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Vector Dim</span>
                <div className="text-sm font-bold text-brand-300 font-mono">
                  1536 (pgvector)
                </div>
              </div>
            </div>

            {/* Chunks List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
              {document.chunks && document.chunks.length > 0 ? (
                document.chunks.map((chunk) => (
                  <div
                    key={chunk.id}
                    className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-2 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                          Chunk #{chunk.chunkIndex + 1}
                        </span>
                        <Badge variant="neutral" size="sm">
                          {chunk.tokenCount} tokens
                        </Badge>
                      </div>

                      <button
                        onClick={() => handleCopyChunk(chunk.id, chunk.content)}
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                        title="Copy chunk text"
                      >
                        {copiedChunkId === chunk.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap">
                      {chunk.content}
                    </p>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <FileText className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  <p className="text-xs font-medium">No chunks generated yet</p>
                  <p className="text-[11px] text-slate-500">
                    {document.status === 'FAILED'
                      ? 'Processing failed before chunks could be extracted. Use Retry to re-process.'
                      : 'Document is currently in the processing queue.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
