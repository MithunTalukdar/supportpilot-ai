import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { KnowledgeBaseWorkspace } from '../components/kb/KnowledgeBaseWorkspace.js';
import { UploadDocumentModal } from '../components/kb/UploadDocumentModal.js';
import { ChunkInspectionDrawer } from '../components/kb/ChunkInspectionDrawer.js';
import { VectorSearchPlayground } from '../components/kb/VectorSearchPlayground.js';
import { AuthProvider } from '../context/AuthContext.js';

const mockDocuments = [
  {
    id: 'doc-1',
    organizationId: 'org_acme_1',
    title: 'Refund Policy 2026',
    sourceUrl: null,
    fileType: 'pdf',
    byteSize: 142050,
    status: 'INDEXED',
    errorMessage: null,
    metadata: { chunkCount: 3, wordCount: 450 },
    chunkCount: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockChunks = [
  {
    id: 'chunk-1',
    chunkIndex: 0,
    content: 'Refunds within 14 days are processed immediately to original payment method.',
    tokenCount: 16,
    metadata: { pageCount: 1 },
  },
  {
    id: 'chunk-2',
    chunkIndex: 1,
    content: 'Exceptions apply to custom enterprise licenses and non-refundable hardware.',
    tokenCount: 14,
    metadata: { pageCount: 1 },
  },
];

const mockSearchResults = [
  {
    id: 'chunk-1',
    documentId: 'doc-1',
    documentTitle: 'Refund Policy 2026',
    chunkIndex: 0,
    content: 'Refunds within 14 days are processed immediately to original payment method.',
    tokenCount: 16,
    similarity: 0.892,
  },
];

describe('Phase 4 Knowledge Base UI Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('sp_access_token', 'mock_token');
    localStorage.setItem('sp_active_org_id', 'org_acme_1');
    vi.restoreAllMocks();

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/auth/me')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: {
                user: { id: 'usr_owner', email: 'owner@acme.com', fullName: 'Sarah Owner' },
                memberships: [
                  {
                    organizationId: 'org_acme_1',
                    organizationName: 'Acme Corp',
                    organizationSlug: 'acme',
                    role: 'OWNER',
                  },
                ],
              },
            }),
          });
        }

        if (url.includes('/documents/search')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              data: mockSearchResults,
            }),
          });
        }

        if (url.includes('/documents/doc-1')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              data: {
                ...mockDocuments[0],
                chunks: mockChunks,
              },
            }),
          });
        }

        if (url.includes('/documents')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              data: mockDocuments,
              meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
            }),
          });
        }

        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: {} }),
        });
      })
    );
  });

  it('renders KnowledgeBaseWorkspace with documents table and metrics', async () => {
    render(
      <AuthProvider>
        <KnowledgeBaseWorkspace />
      </AuthProvider>
    );

    // Verify workspace title
    expect(await screen.findByText('Knowledge Documents & Vector Store')).toBeInTheDocument();

    // Verify metrics
    expect(await screen.findByText('Total Documents')).toBeInTheDocument();
    expect(screen.getByText('pgvector Indexed')).toBeInTheDocument();
    expect(screen.getByText('Vector Chunks')).toBeInTheDocument();

    // Verify document item in table
    expect(await screen.findByText('Refund Policy 2026')).toBeInTheDocument();
    expect(screen.getByText('Indexed in pgvector')).toBeInTheDocument();
  });

  it('renders ChunkInspectionDrawer with chunk list and token counts', async () => {
    render(
      <AuthProvider>
        <ChunkInspectionDrawer documentId="doc-1" onClose={vi.fn()} />
      </AuthProvider>
    );

    // Header & metadata
    expect(await screen.findByText('Refund Policy 2026')).toBeInTheDocument();
    expect(await screen.findByText('Chunk #1')).toBeInTheDocument();
    expect(screen.getByText('Chunk #2')).toBeInTheDocument();

    // Chunk text
    expect(
      screen.getByText('Refunds within 14 days are processed immediately to original payment method.')
    ).toBeInTheDocument();
    expect(screen.getByText('16 tokens')).toBeInTheDocument();
  });

  it('validates unsupported file format in UploadDocumentModal', async () => {
    const handleSuccess = vi.fn();
    const handleClose = vi.fn();

    render(
      <AuthProvider>
        <UploadDocumentModal isOpen={true} onClose={handleClose} onSuccess={handleSuccess} />
      </AuthProvider>
    );

    expect(await screen.findByText('Upload Knowledge Document')).toBeInTheDocument();

    // Create an unsupported file (.png)
    const invalidFile = new File(['fake content'], 'test.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [invalidFile] } });

    expect(
      await screen.findByText(/Unsupported file type '.png'/i)
    ).toBeInTheDocument();
  });

  it('executes vector search and renders matching chunks with similarity score in VectorSearchPlayground', async () => {
    render(
      <AuthProvider>
        <VectorSearchPlayground onClose={vi.fn()} />
      </AuthProvider>
    );

    expect(await screen.findByText('Vector Semantic Search Playground')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/Ask a natural language query/i);
    fireEvent.change(searchInput, { target: { value: 'How does refund work?' } });

    const submitBtn = screen.getByRole('button', { name: /Search Vector Store/i });
    fireEvent.click(submitBtn);

    // Verify result matching chunk rendered
    await waitFor(() => {
      expect(screen.getByText('89.2% Match')).toBeInTheDocument();
      expect(
        screen.getByText('Refunds within 14 days are processed immediately to original payment method.')
      ).toBeInTheDocument();
    });
  });
});
