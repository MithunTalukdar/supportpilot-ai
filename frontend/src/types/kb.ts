export type DocumentStatus = 'PENDING' | 'PROCESSING' | 'INDEXED' | 'FAILED';

export interface DocumentChunkItem {
  id: string;
  chunkIndex: number;
  content: string;
  tokenCount: number;
  metadata?: Record<string, unknown> | null;
}

export interface KnowledgeDocumentItem {
  id: string;
  organizationId: string;
  title: string;
  sourceUrl?: string | null;
  fileType: string;
  byteSize: number;
  status: DocumentStatus;
  errorMessage?: string | null;
  metadata?: {
    chunkCount?: number;
    wordCount?: number;
    characterCount?: number;
    pageCount?: number;
    totalTokens?: number;
    originalName?: string;
  } | null;
  chunkCount?: number;
  createdAt: string;
  updatedAt: string;
  chunks?: DocumentChunkItem[];
}

export interface ChunkSearchResultItem {
  id: string;
  documentId: string;
  documentTitle: string;
  chunkIndex: number;
  content: string;
  tokenCount: number;
  similarity: number;
}
