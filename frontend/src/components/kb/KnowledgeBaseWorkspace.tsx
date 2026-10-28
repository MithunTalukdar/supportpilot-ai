import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Upload,
  Search,
  Filter,
  RotateCcw,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  Trash2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import {
  KnowledgeDocumentItem,
  DocumentStatus,
} from '../../types/kb.js';
import {
  listDocumentsApi,
  deleteDocumentApi,
  reprocessDocumentApi,
} from '../../services/kb.api.js';
import { Card, CardHeader, CardContent } from '../ui/Card.js';
import { Button } from '../ui/Button.js';
import { LoadingSpinner } from '../ui/LoadingSpinner.js';
import { AlertBanner } from '../ui/AlertBanner.js';
import { DocumentStatusBadge } from './DocumentStatusBadge.js';
import { UploadDocumentModal } from './UploadDocumentModal.js';
import { ChunkInspectionDrawer } from './ChunkInspectionDrawer.js';
import { VectorSearchPlayground } from './VectorSearchPlayground.js';

export const KnowledgeBaseWorkspace: React.FC = () => {
  const { accessToken, activeOrg, role } = useAuth();
  const isStaff = role === 'OWNER' || role === 'AGENT';

  // Data states
  const [documents, setDocuments] = useState<KnowledgeDocumentItem[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | ''>('');
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);

  // Modals and Drawers
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
  const [inspectDocId, setInspectDocId] = useState<string | null>(null);
  const [showPlayground, setShowPlayground] = useState<boolean>(false);
  const [deleteConfirmDoc, setDeleteConfirmDoc] = useState<KnowledgeDocumentItem | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!accessToken || !activeOrg) return;
    setLoading(true);
    setError(null);
    try {
      const response = await listDocumentsApi(accessToken, activeOrg.organizationId, {
        page,
        limit,
        status: statusFilter,
        search,
      });
      setDocuments(response.documents);
      setMeta(response.meta);
    } catch (err) {
      setError((err as Error).message || 'Failed to load knowledge documents');
    } finally {
      setLoading(false);
    }
  }, [accessToken, activeOrg, page, limit, statusFilter, search]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleDocumentUploaded = (newDoc: KnowledgeDocumentItem) => {
    setSuccessNotice(`Document '${newDoc.title}' uploaded and indexed into pgvector!`);
    setTimeout(() => setSuccessNotice(null), 5000);
    fetchDocuments();
  };

  const handleReprocess = async (doc: KnowledgeDocumentItem) => {
    if (!accessToken || !activeOrg) return;
    setActionLoadingId(doc.id);
    setError(null);
    try {
      await reprocessDocumentApi(accessToken, activeOrg.organizationId, doc.id);
      setSuccessNotice(`Document '${doc.title}' successfully re-indexed!`);
      setTimeout(() => setSuccessNotice(null), 5000);
      fetchDocuments();
    } catch (err) {
      setError((err as Error).message || 'Failed to reprocess document');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmDoc || !accessToken || !activeOrg) return;
    setActionLoadingId(deleteConfirmDoc.id);
    setError(null);
    try {
      await deleteDocumentApi(accessToken, activeOrg.organizationId, deleteConfirmDoc.id);
      setSuccessNotice(`Document '${deleteConfirmDoc.title}' and associated vector chunks deleted.`);
      setTimeout(() => setSuccessNotice(null), 5000);
      setDeleteConfirmDoc(null);
      fetchDocuments();
    } catch (err) {
      setError((err as Error).message || 'Failed to delete document');
    } finally {
      setActionLoadingId(null);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPage(1);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Compute metrics
  const totalDocs = meta.total;
  const indexedDocs = documents.filter((d) => d.status === 'INDEXED').length;
  const totalChunks = documents.reduce((acc, d) => acc + (d.chunkCount || 0), 0);
  const queueDocs = documents.filter((d) => d.status === 'PENDING' || d.status === 'PROCESSING').length;

  if (!isStaff) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-3">
          <BookOpen className="w-12 h-12 mx-auto text-slate-500" />
          <h3 className="text-sm font-semibold text-white">Knowledge Base Restricted</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Knowledge base ingestion and vector management are restricted to Support Agents and
            Organization Owners.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Modal */}
      <UploadDocumentModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={handleDocumentUploaded}
      />

      {/* Chunk Inspection Drawer */}
      {inspectDocId && (
        <ChunkInspectionDrawer
          documentId={inspectDocId}
          onClose={() => setInspectDocId(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmDoc && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-rose-500/30">
            <CardHeader
              title="Delete Knowledge Document"
              subtitle="This action cascades to all vector embeddings"
              icon={<AlertTriangle className="w-5 h-5 text-rose-400" />}
            />
            <CardContent className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to permanently delete{' '}
                <strong className="text-white">"{deleteConfirmDoc.title}"</strong>?
              </p>
              <p className="text-[11px] text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-white/5">
                ⚠️ All associated chunks in PostgreSQL and vector embeddings will be immediately purged
                from the search index.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteConfirmDoc(null)}
                  disabled={actionLoadingId === deleteConfirmDoc.id}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDelete}
                  isLoading={actionLoadingId === deleteConfirmDoc.id}
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                >
                  Delete Document & Chunks
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Success Notice */}
      {successNotice && (
        <AlertBanner
          type="success"
          title="Knowledge Base Updated"
          message={successNotice}
          onDismiss={() => setSuccessNotice(null)}
        />
      )}

      {/* Error Banner */}
      {error && (
        <AlertBanner
          type="error"
          title="Knowledge Base Error"
          message={error}
          onDismiss={() => setError(null)}
          action={{
            label: 'Retry',
            onClick: fetchDocuments,
          }}
        />
      )}

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-white/5 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Total Documents</span>
          <div className="text-xl font-bold text-white">{totalDocs}</div>
          <div className="text-[10px] text-slate-500">PDF, TXT & Markdown</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-1">
          <span className="text-[11px] text-emerald-300 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            pgvector Indexed
          </span>
          <div className="text-xl font-bold text-emerald-200">{indexedDocs}</div>
          <div className="text-[10px] text-emerald-400/70">Cosine searchable</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 space-y-1">
          <span className="text-[11px] text-indigo-300 font-medium flex items-center gap-1">
            <Layers className="w-3 h-3 text-indigo-400" />
            Vector Chunks
          </span>
          <div className="text-xl font-bold text-indigo-200">{totalChunks}</div>
          <div className="text-[10px] text-indigo-400/70">1536-d embeddings</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-white/5 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            Ingestion Queue
          </span>
          <div className="text-xl font-bold text-white">{queueDocs}</div>
          <div className="text-[10px] text-slate-500">Pending or in-flight</div>
        </div>
      </div>

      {/* Vector Search Playground Drawer / Section */}
      {showPlayground && (
        <VectorSearchPlayground onClose={() => setShowPlayground(false)} />
      )}

      {/* Main Knowledge Base Card */}
      <Card>
        <CardHeader
          title="Knowledge Documents & Vector Store"
          subtitle={`Organization documents ingested into PostgreSQL pgvector for ${activeOrg?.organizationName || 'Current Organization'}`}
          icon={<BookOpen className="w-5 h-5 text-indigo-400" />}
          action={
            <div className="flex items-center gap-2">
              <Button
                variant={showPlayground ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setShowPlayground((prev) => !prev)}
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-indigo-400" />}
              >
                {showPlayground ? 'Hide Playground' : 'Test Vector Search'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchDocuments}
                disabled={loading}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Refresh
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setUploadModalOpen(true)}
                leftIcon={<Upload className="w-3.5 h-3.5" />}
              >
                Upload Document
              </Button>
            </div>
          }
        />

        <CardContent className="space-y-4">
          {/* Toolbar */}
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search documents by title..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as DocumentStatus | '');
                    setPage(1);
                  }}
                  className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500 appearance-none pr-8 cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="INDEXED">Indexed</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                </select>
                <Filter className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {(search || statusFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  leftIcon={<X className="w-3.5 h-3.5 text-slate-400" />}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Documents Table */}
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <LoadingSpinner size="lg" />
              <p className="text-xs text-slate-400">Loading knowledge documents from PostgreSQL...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="py-14 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-slate-900/80 border border-white/5 flex items-center justify-center text-slate-500">
                <BookOpen className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">No Documents Ingested</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {search || statusFilter
                    ? 'No documents match the current filters. Try resetting the search or filter options.'
                    : 'Upload your company policies, product guides, or FAQ documents to power AI answers.'}
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setUploadModalOpen(true)}
                leftIcon={<Upload className="w-3.5 h-3.5" />}
              >
                Upload First Document
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
                    <th className="py-3 px-3">Document Title</th>
                    <th className="py-3 px-3">Format</th>
                    <th className="py-3 px-3">Size</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-center">Chunks</th>
                    <th className="py-3 px-3">Uploaded</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {documents.map((doc) => (
                    <tr
                      key={doc.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Title */}
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-white truncate max-w-xs sm:max-w-md">
                          {doc.title}
                        </div>
                        {doc.errorMessage && (
                          <div className="text-[10px] text-rose-400 truncate max-w-xs mt-0.5">
                            Error: {doc.errorMessage}
                          </div>
                        )}
                      </td>

                      {/* Format */}
                      <td className="py-3.5 px-3">
                        <span className="font-mono text-[10px] uppercase font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-white/10">
                          {doc.fileType}
                        </span>
                      </td>

                      {/* Size */}
                      <td className="py-3.5 px-3 text-slate-400 whitespace-nowrap">
                        {formatFileSize(doc.byteSize)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <DocumentStatusBadge status={doc.status} />
                      </td>

                      {/* Chunks */}
                      <td className="py-3.5 px-3 text-center font-mono text-slate-200">
                        {doc.chunkCount ?? 0}
                      </td>

                      {/* Created */}
                      <td className="py-3.5 px-3 text-slate-400 whitespace-nowrap">
                        {new Date(doc.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setInspectDocId(doc.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Inspect Chunks"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleReprocess(doc)}
                            disabled={actionLoadingId === doc.id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                            title="Reprocess Document"
                          >
                            <RotateCcw
                              className={`w-3.5 h-3.5 ${
                                actionLoadingId === doc.id ? 'animate-spin text-brand-400' : ''
                              }`}
                            />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmDoc(doc)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
                            title="Delete Document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {meta.total > 0 && (
            <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <div>
                Showing <strong className="text-slate-200">{(meta.page - 1) * meta.limit + 1}</strong> to{' '}
                <strong className="text-slate-200">
                  {Math.min(meta.page * meta.limit, meta.total)}
                </strong> of <strong className="text-slate-200">{meta.total}</strong> documents
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={meta.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                >
                  Previous
                </Button>
                <span className="px-2 font-mono text-slate-300">
                  {meta.page} / {meta.totalPages || 1}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
