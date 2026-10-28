import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { Card, CardHeader, CardContent } from '../ui/Card.js';
import { Button } from '../ui/Button.js';
import { AlertBanner } from '../ui/AlertBanner.js';
import { uploadDocumentApi } from '../../services/kb.api.js';
import { KnowledgeDocumentItem } from '../../types/kb.js';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (doc: KnowledgeDocumentItem) => void;
}

const ALLOWED_EXTS = ['.pdf', '.txt', '.md'];
const MAX_BYTES = 15 * 1024 * 1024; // 15MB

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { accessToken, activeOrg } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customTitle, setCustomTitle] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const validateAndSetFile = (file: File) => {
    setError(null);
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!ALLOWED_EXTS.includes(ext)) {
      setError(`Unsupported file type '${ext}'. Please upload a PDF, TXT, or Markdown document.`);
      return;
    }

    if (file.size > MAX_BYTES) {
      setError(`File exceeds maximum size of 15MB (selected file is ${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
      return;
    }

    if (file.size === 0) {
      setError('Selected file is empty (0 bytes).');
      return;
    }

    setSelectedFile(file);
    if (!customTitle) {
      setCustomTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !accessToken || !activeOrg) return;

    setLoading(true);
    setError(null);
    try {
      const doc = await uploadDocumentApi(
        accessToken,
        activeOrg.organizationId,
        selectedFile,
        customTitle
      );

      setSelectedFile(null);
      setCustomTitle('');
      onSuccess(doc);
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to upload and ingest document');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="max-w-xl w-full border-brand-500/30 shadow-2xl my-8">
        <CardHeader
          title="Upload Knowledge Document"
          subtitle={`Ingest documents into ${activeOrg?.organizationName || 'Current Organization'} vector store`}
          icon={<Upload className="w-5 h-5 text-brand-400" />}
          action={
            <button
              onClick={onClose}
              disabled={loading}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          }
        />

        <CardContent>
          {error && (
            <AlertBanner
              type="error"
              title="Upload Failed"
              message={error}
              onDismiss={() => setError(null)}
              className="mb-4"
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Drag & Drop Target Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-2xl cursor-pointer text-center transition-all ${
                isDragging
                  ? 'border-brand-400 bg-brand-500/10'
                  : selectedFile
                  ? 'border-emerald-500/50 bg-emerald-950/20'
                  : 'border-slate-700/80 hover:border-slate-500 bg-slate-900/40 hover:bg-slate-900/80'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white block">{selectedFile.name}</span>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {formatFileSize(selectedFile.size)} • Ready for ingestion
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 hover:text-slate-200 underline mt-1">
                    Click or drop to replace
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-white block">
                      Drag & drop your document here, or browse
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Supported formats: <strong>PDF</strong>, <strong>TXT</strong>, <strong>Markdown (.md)</strong> up to 15MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Document Title Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Document Display Title (Optional)
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. 2026 Customer Refund & Cancellation Policy"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Ingestion Pipeline Notice */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-1.5 text-[11px] text-slate-400 leading-relaxed">
              <div className="flex items-center gap-1.5 font-medium text-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                <span>Automated Ingestion Pipeline:</span>
              </div>
              <p>
                1. Text extraction & clean normalization • 2. Recursive semantic chunking (~500 tokens) •
                3. 1536-d vector embeddings • 4. Cosine distance indexing in PostgreSQL with pgvector.
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/5">
              <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!selectedFile || loading}
                isLoading={loading}
                leftIcon={<FileText className="w-3.5 h-3.5" />}
              >
                {loading ? 'Processing & Indexing...' : 'Upload & Index'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
