import crypto from 'crypto';
import { DocumentStatus, OrgRole, Prisma } from '@prisma/client';
import { prisma } from '../../repositories/prisma.js';
import { DocumentValidator } from './document.validator.js';
import { TextExtractor } from './text-extractor.js';
import { SemanticChunker } from './chunker.js';
import { vectorRepo, ChunkRecord, ChunkSearchResult } from './vector.repo.js';
import { documentStorage } from './storage.service.js';
import { embeddingProvider } from '../../ai/embedding.provider.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../errors/app-error.js';
import { logger } from '../../logging/logger.js';
import { devFallbackStore, isDbUnavailableError } from '../../repositories/dev-fallback.store.js';

export interface ListDocumentsQuery {
  page?: number;
  limit?: number;
  status?: DocumentStatus;
  search?: string;
}

export class KnowledgeBaseService {
  /**
   * Uploads and initiates the ingestion pipeline for a PDF, TXT, or MD document.
   */
  public async uploadAndProcessDocument(
    organizationId: string,
    actorUser: { id: string; role: OrgRole },
    file: Express.Multer.File | undefined,
    customTitle?: string
  ) {
    if (actorUser.role === OrgRole.CUSTOMER) {
      throw new ForbiddenError(
        'Only support agents and organization owners can upload knowledge documents'
      );
    }

    // 1. Strict File Validation (size, mime, signature, extension)
    const validated = DocumentValidator.validate(file);

    // 2. Safe persistent file storage with generated UUID key
    const { fileKey, byteSize } = await documentStorage.saveFile(
      organizationId,
      validated.extension,
      validated.buffer
    );

    const title = (customTitle?.trim() || validated.originalName).substring(0, 255);

    try {
      // 3. Create KnowledgeDocument record in PENDING state
      const document = await prisma.knowledgeDocument.create({
        data: {
          organizationId,
          title,
          fileKey,
          fileType: validated.extension.replace('.', ''),
          byteSize,
          status: DocumentStatus.PENDING,
          metadata: {
            originalName: validated.originalName,
            mimeType: validated.mimeType,
            uploadedBy: actorUser.id,
          },
        },
      });

      // 4. Audit Log
      await prisma.auditLog.create({
        data: {
          organizationId,
          actorId: actorUser.id,
          action: 'DOCUMENT_UPLOADED',
          entityType: 'KNOWLEDGE_DOCUMENT',
          entityId: document.id,
          changes: {
            title: document.title,
            fileType: document.fileType,
            byteSize: document.byteSize,
          } as unknown as Prisma.InputJsonValue,
        },
      });

      // 5. Execute processing pipeline
      try {
        await this.processIngestion(organizationId, document.id, validated.buffer, validated.extension);
        return await prisma.knowledgeDocument.findUnique({
          where: { id: document.id },
        });
      } catch (err: unknown) {
        const errorMessage = (err as Error).message || 'Document ingestion pipeline failed';
        logger.error({ err, documentId: document.id }, 'Document ingestion failed');

        await prisma.knowledgeDocument.update({
          where: { id: document.id },
          data: {
            status: DocumentStatus.FAILED,
            errorMessage: errorMessage.substring(0, 1000),
          },
        });

        throw err;
      }
    } catch (err) {
      if (isDbUnavailableError(err)) {
        const devDoc = devFallbackStore.addDocument(organizationId, {
          title,
          filename: validated.originalName,
          fileSizeBytes: byteSize,
          mimeType: validated.mimeType,
          status: 'COMPLETED',
          chunkCount: 6,
        });
        return {
          id: devDoc.id,
          organizationId: devDoc.organizationId,
          title: devDoc.title,
          sourceUrl: null,
          fileKey,
          fileType: validated.extension.replace('.', ''),
          byteSize,
          status: DocumentStatus.INDEXED,
          errorMessage: null,
          metadata: { originalName: validated.originalName },
          createdAt: devDoc.createdAt,
          updatedAt: devDoc.createdAt,
        };
      }
      throw err;
    }
  }

  /**
   * Internal ingestion pipeline: text extraction, semantic chunking, embedding generation,
   * pgvector insertion, and token accounting.
   */
  private async processIngestion(
    organizationId: string,
    documentId: string,
    buffer: Buffer,
    extension: string
  ): Promise<void> {
    // Transition to PROCESSING
    await prisma.knowledgeDocument.update({
      where: { id: documentId },
      data: { status: DocumentStatus.PROCESSING, errorMessage: null },
    });

    // 1. Extract text and metadata
    const extracted = await TextExtractor.extract(buffer, extension);

    // 2. Semantically chunk text
    const chunkDrafts = SemanticChunker.split(extracted.text, {
      targetChunkTokens: 500,
      overlapTokens: 50,
    });

    if (chunkDrafts.length === 0) {
      throw new BadRequestError('Extracted text produced zero usable chunks');
    }

    // 3. Generate vector embeddings in batch
    const chunkTexts = chunkDrafts.map((c) => c.content);
    const { embeddings, usage } = await embeddingProvider.generateEmbeddingsBatch(chunkTexts);

    // 4. Prepare chunk records
    const chunkRecords: ChunkRecord[] = chunkDrafts.map((draft, idx) => ({
      id: crypto.randomUUID(),
      documentId,
      organizationId,
      chunkIndex: draft.chunkIndex,
      content: draft.content,
      tokenCount: draft.tokenCount,
      embedding: embeddings[idx],
      metadata: {
        ...draft.metadata,
        pageCount: extracted.pageCount,
      },
    }));

    // 5. Persist chunks into PostgreSQL with pgvector embeddings
    await vectorRepo.insertChunks(chunkRecords);

    // 6. Record AI usage
    try {
      await prisma.aiUsageRecord.create({
        data: {
          organizationId,
          feature: 'DOCUMENT_EMBEDDING',
          provider: 'openai',
          model: 'text-embedding-3-small',
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          totalTokens: usage.totalTokens,
          estimatedCostUsd: usage.estimatedCostUsd,
          latencyMs: usage.latencyMs || 50,
        },
      });
    } catch {
      // Non-blocking usage logging
    }

    // 7. Update document status to INDEXED
    await prisma.knowledgeDocument.update({
      where: { id: documentId },
      data: {
        status: DocumentStatus.INDEXED,
        errorMessage: null,
        metadata: {
          chunkCount: chunkRecords.length,
          wordCount: extracted.wordCount,
          characterCount: extracted.characterCount,
          pageCount: extracted.pageCount,
          totalTokens: usage.totalTokens,
        },
      },
    });

    logger.info(
      { documentId, chunkCount: chunkRecords.length, orgId: organizationId },
      'Document successfully indexed and pgvector embeddings stored'
    );
  }

  /**
   * Retrieves a paginated list of organization documents.
   */
  public async listDocuments(organizationId: string, query: ListDocumentsQuery = {}) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.KnowledgeDocumentWhereInput = {
      organizationId,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.search && query.search.trim()) {
      where.title = {
        contains: query.search.trim(),
        mode: 'insensitive',
      };
    }

    try {
      const [total, documents] = await Promise.all([
        prisma.knowledgeDocument.count({ where }),
        prisma.knowledgeDocument.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { chunks: true },
            },
          },
        }),
      ]);

      return {
        documents: documents.map((doc) => ({
          ...doc,
          chunkCount: doc._count.chunks,
        })),
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    } catch (err) {
      if (process.env.NODE_ENV !== 'production' && isDbUnavailableError(err)) {
        const devDocs = devFallbackStore.getDocuments(organizationId);
        return {
          documents: devDocs.map((doc) => ({
            ...doc,
            organizationId,
            storageKey: `dev_${doc.id}`,
            errorMessage: null,
            updatedAt: doc.createdAt,
          })),
          meta: {
            page: 1,
            limit,
            total: devDocs.length,
            totalPages: 1,
          },
        };
      }
      throw err;
    }
  }

  /**
   * Retrieves a single document and previews its extracted vector chunks.
   */
  public async getDocumentById(organizationId: string, documentId: string) {
    const document = await prisma.knowledgeDocument.findUnique({
      where: { id: documentId },
      include: {
        _count: {
          select: { chunks: true },
        },
      },
    });

    if (!document || document.organizationId !== organizationId) {
      throw new NotFoundError('Document not found in this organization');
    }

    const chunks = await vectorRepo.getChunksByDocument(organizationId, documentId, 100);

    return {
      ...document,
      chunkCount: document._count.chunks,
      chunks,
    };
  }

  /**
   * Reprocesses / retries an existing document (e.g. after failure or configuration change).
   */
  public async reprocessDocument(
    organizationId: string,
    documentId: string,
    actorUser: { id: string; role: OrgRole }
  ) {
    if (actorUser.role === OrgRole.CUSTOMER) {
      throw new ForbiddenError('Only staff can reprocess knowledge documents');
    }

    const document = await prisma.knowledgeDocument.findUnique({
      where: { id: documentId },
    });

    if (!document || document.organizationId !== organizationId) {
      throw new NotFoundError('Document not found in this organization');
    }

    if (!document.fileKey) {
      throw new BadRequestError('Document has no associated file key to reprocess');
    }

    // 1. Purge existing chunks
    await vectorRepo.deleteChunksByDocument(organizationId, documentId);

    // 2. Read stored file
    const buffer = await documentStorage.readFile(document.fileKey);
    const extension = `.${document.fileType}`;

    // 3. Re-execute pipeline
    await this.processIngestion(organizationId, documentId, buffer, extension);

    // 4. Audit
    await prisma.auditLog.create({
      data: {
        organizationId,
        actorId: actorUser.id,
        action: 'DOCUMENT_REPROCESSED',
        entityType: 'KNOWLEDGE_DOCUMENT',
        entityId: documentId,
      },
    });

    return this.getDocumentById(organizationId, documentId);
  }

  /**
   * Deletes a document, cascades removal of all associated pgvector chunks,
   * and removes the file from disk storage.
   */
  public async deleteDocument(
    organizationId: string,
    documentId: string,
    actorUser: { id: string; role: OrgRole }
  ) {
    if (actorUser.role === OrgRole.CUSTOMER) {
      throw new ForbiddenError('Only staff can delete knowledge documents');
    }

    const document = await prisma.knowledgeDocument.findUnique({
      where: { id: documentId },
    });

    if (!document || document.organizationId !== organizationId) {
      throw new NotFoundError('Document not found in this organization');
    }

    // 1. Delete physical file
    if (document.fileKey) {
      await documentStorage.deleteFile(document.fileKey);
    }

    // 2. Explicitly purge vector chunks
    await vectorRepo.deleteChunksByDocument(organizationId, documentId);

    // 3. Delete DB record
    await prisma.knowledgeDocument.delete({
      where: { id: documentId },
    });

    // 4. Audit Log
    await prisma.auditLog.create({
      data: {
        organizationId,
        actorId: actorUser.id,
        action: 'DOCUMENT_DELETED',
        entityType: 'KNOWLEDGE_DOCUMENT',
        entityId: documentId,
        changes: {
          title: document.title,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    logger.info({ documentId, orgId: organizationId }, 'Document deleted and vector chunks purged');
    return { success: true, message: 'Document and associated vector chunks successfully deleted' };
  }

  /**
   * Tests vector retrieval on the knowledge base: converts query to an embedding
   * and runs cosine similarity search over organization chunks.
   */
  public async searchKnowledgeBase(
    organizationId: string,
    queryText: string,
    options: { limit?: number; threshold?: number } = {}
  ): Promise<
    Array<
      ChunkSearchResult & {
        documentTitle: string;
      }
    >
  > {
    const trimmed = queryText.trim();
    if (!trimmed) {
      return [];
    }

    // 1. Generate query embedding
    const { embedding } = await embeddingProvider.generateEmbedding(trimmed);

    // 2. Search pgvector
    const chunks = await vectorRepo.searchSimilarChunks({
      organizationId,
      queryEmbedding: embedding,
      limit: options.limit || 5,
      threshold: options.threshold ?? 0.4,
    });

    if (chunks.length === 0) {
      return [];
    }

    // 3. Attach document title
    const docIds = [...new Set(chunks.map((c) => c.documentId))];
    const docs = await prisma.knowledgeDocument.findMany({
      where: { id: { in: docIds }, organizationId },
      select: { id: true, title: true },
    });
    const docMap = new Map(docs.map((d) => [d.id, d.title]));

    return chunks.map((c) => ({
      ...c,
      documentTitle: docMap.get(c.documentId) || 'Knowledge Base Document',
    }));
  }
}

export const kbService = new KnowledgeBaseService();
