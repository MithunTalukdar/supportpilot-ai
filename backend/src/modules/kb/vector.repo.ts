import { prisma } from '../../repositories/prisma.js';
import { logger } from '../../logging/logger.js';

export interface ChunkRecord {
  id: string;
  documentId: string;
  organizationId: string;
  chunkIndex: number;
  content: string;
  tokenCount: number;
  embedding: number[];
  metadata?: Record<string, unknown>;
}

export interface ChunkSearchResult {
  id: string;
  documentId: string;
  organizationId: string;
  chunkIndex: number;
  content: string;
  tokenCount: number;
  metadata: Record<string, unknown> | null;
  similarity: number;
}

export class VectorRepository {
  /**
   * Inserts an array of chunks into PostgreSQL document_chunks table with pgvector embeddings.
   * Parameterized execution prevents SQL injection and properly casts vector strings.
   */
  public async insertChunks(chunks: ChunkRecord[]): Promise<void> {
    if (chunks.length === 0) return;

    for (const chunk of chunks) {
      const vectorString = `[${chunk.embedding.join(',')}]`;
      const metadataJson = JSON.stringify(chunk.metadata || {});

      await prisma.$executeRawUnsafe(
        `INSERT INTO document_chunks (
          id, document_id, organization_id, chunk_index, content, token_count, embedding, metadata, created_at
        ) VALUES (
          $1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7::vector, $8::jsonb, NOW()
        );`,
        chunk.id,
        chunk.documentId,
        chunk.organizationId,
        chunk.chunkIndex,
        chunk.content,
        chunk.tokenCount,
        vectorString,
        metadataJson
      );
    }

    logger.debug(
      { count: chunks.length, documentId: chunks[0]?.documentId },
      'Successfully inserted document chunks with pgvector embeddings'
    );
  }

  /**
   * Queries top-k similar chunks using pgvector cosine distance (<=>).
   * Strict organization isolation is enforced in the WHERE clause.
   */
  public async searchSimilarChunks(params: {
    organizationId: string;
    queryEmbedding: number[];
    limit?: number;
    threshold?: number;
  }): Promise<ChunkSearchResult[]> {
    const limit = params.limit || 5;
    const threshold = params.threshold ?? 0.5;
    const vectorString = `[${params.queryEmbedding.join(',')}]`;

    try {
      const rows = await prisma.$queryRawUnsafe<
        Array<{
          id: string;
          document_id: string;
          organization_id: string;
          chunk_index: number;
          content: string;
          token_count: number;
          metadata: Record<string, unknown> | null;
          similarity: number;
        }>
      >(
        `SELECT id, document_id, organization_id, chunk_index, content, token_count, metadata,
                (1 - (embedding <=> $1::vector)) AS similarity
         FROM document_chunks
         WHERE organization_id = $2::uuid
           AND embedding IS NOT NULL
           AND (1 - (embedding <=> $1::vector)) >= $3
         ORDER BY embedding <=> $1::vector ASC
         LIMIT $4;`,
        vectorString,
        params.organizationId,
        threshold,
        limit
      );

      return rows.map((r) => ({
        id: r.id,
        documentId: r.document_id,
        organizationId: r.organization_id,
        chunkIndex: r.chunk_index,
        content: r.content,
        tokenCount: r.token_count,
        metadata: r.metadata,
        similarity: Number(r.similarity),
      }));
    } catch (err) {
      logger.error({ err, orgId: params.organizationId }, 'pgvector similarity query failed');
      throw err;
    }
  }

  /**
   * Deletes all chunks associated with a document, strictly scoped to the organization.
   */
  public async deleteChunksByDocument(
    organizationId: string,
    documentId: string
  ): Promise<number> {
    const result = await prisma.$executeRawUnsafe(
      `DELETE FROM document_chunks 
       WHERE organization_id = $1::uuid AND document_id = $2::uuid;`,
      organizationId,
      documentId
    );
    return Number(result);
  }

  /**
   * Fetches chunks belonging to a document for inspection in the UI.
   */
  public async getChunksByDocument(
    organizationId: string,
    documentId: string,
    limit: number = 50
  ): Promise<
    Array<{
      id: string;
      chunkIndex: number;
      content: string;
      tokenCount: number;
      metadata: Record<string, unknown> | null;
    }>
  > {
    const rows = await prisma.documentChunk.findMany({
      where: {
        organizationId,
        documentId,
      },
      select: {
        id: true,
        chunkIndex: true,
        content: true,
        tokenCount: true,
        metadata: true,
      },
      orderBy: { chunkIndex: 'asc' },
      take: limit,
    });

    return rows.map((r) => ({
      id: r.id,
      chunkIndex: r.chunkIndex,
      content: r.content,
      tokenCount: r.tokenCount,
      metadata: r.metadata as Record<string, unknown> | null,
    }));
  }
}

export const vectorRepo = new VectorRepository();
