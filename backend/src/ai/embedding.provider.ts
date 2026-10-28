import {
  IEmbeddingProvider,
  EmbeddingOptions,
  EmbeddingResult,
  BatchEmbeddingResult,
  AIUsageMetrics,
} from './ai.types.js';
import { logger } from '../logging/logger.js';

export const EMBEDDING_DIMENSION = 1536;

/**
 * Deterministic local embedding provider that creates 1536-dimensional L2-normalized
 * vector representations of text. Ensures local development and automated test suites
 * run smoothly without requiring external paid API keys.
 */
export class DeterministicLocalEmbeddingProvider implements IEmbeddingProvider {
  public readonly id = 'deterministic-local-v1';

  public async generateEmbedding(
    text: string,
    options?: EmbeddingOptions
  ): Promise<EmbeddingResult> {
    const start = Date.now();
    const dims = options?.dimensions || EMBEDDING_DIMENSION;
    const embedding = this.computeVector(text, dims);
    const tokenCount = Math.max(1, Math.ceil(text.length / 4));

    const usage: AIUsageMetrics = {
      promptTokens: tokenCount,
      completionTokens: 0,
      totalTokens: tokenCount,
      estimatedCostUsd: Number((tokenCount * 0.00000002).toFixed(8)),
      latencyMs: Date.now() - start,
    };

    return { embedding, usage };
  }

  public async generateEmbeddingsBatch(
    texts: string[],
    options?: EmbeddingOptions
  ): Promise<BatchEmbeddingResult> {
    const start = Date.now();
    const dims = options?.dimensions || EMBEDDING_DIMENSION;
    let totalTokens = 0;

    const embeddings = texts.map((text) => {
      totalTokens += Math.max(1, Math.ceil(text.length / 4));
      return this.computeVector(text, dims);
    });

    const usage: AIUsageMetrics = {
      promptTokens: totalTokens,
      completionTokens: 0,
      totalTokens,
      estimatedCostUsd: Number((totalTokens * 0.00000002).toFixed(8)),
      latencyMs: Date.now() - start,
    };

    return { embeddings, usage };
  }

  /**
   * Generates a deterministic L2-normalized 1536-d vector based on character and n-gram hash projection.
   * Texts containing identical or overlapping semantic words yield high cosine similarity.
   */
  private computeVector(text: string, dimensions: number): number[] {
    const vec = new Float64Array(dimensions);
    const normalized = text.toLowerCase().trim();

    // Word tokens
    const words = normalized.split(/[\s,.;:!?_/\-()[\]{}"]+/).filter((w) => w.length > 0);

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      let hash = 0x811c9dc5; // FNV-1a basis
      for (let j = 0; j < word.length; j++) {
        hash ^= word.charCodeAt(j);
        hash = Math.imul(hash, 0x01000193);
      }

      // Project each word onto multiple orthogonal pseudo-random dimensions
      for (let k = 0; k < 6; k++) {
        const h = Math.imul(hash, k + 1) ^ (k * 0x9e3779b9);
        const index = Math.abs(h) % dimensions;
        const sign = (h & 1) === 0 ? 1.0 : -1.0;
        const weight = 1.0 / (1.0 + Math.log(1 + word.length));
        vec[index] += sign * weight;
      }
    }

    // Character trigrams for morphological and spelling similarity
    for (let i = 0; i <= normalized.length - 3; i++) {
      const trigram = normalized.substring(i, i + 3);
      let tHash = 0;
      for (let j = 0; j < 3; j++) {
        tHash = (tHash << 5) - tHash + trigram.charCodeAt(j);
        tHash |= 0;
      }
      const index = Math.abs(tHash) % dimensions;
      vec[index] += 0.25;
    }

    // Compute Euclidean norm and normalize to unit length (L2 norm = 1.0)
    let sumSq = 0;
    for (let i = 0; i < dimensions; i++) {
      sumSq += vec[i] * vec[i];
    }

    const norm = Math.sqrt(sumSq);
    const result: number[] = new Array(dimensions);
    if (norm < 1e-12) {
      // Fallback uniform unit vector if text is empty
      const val = 1.0 / Math.sqrt(dimensions);
      for (let i = 0; i < dimensions; i++) {
        result[i] = val;
      }
    } else {
      for (let i = 0; i < dimensions; i++) {
        result[i] = Number((vec[i] / norm).toFixed(6));
      }
    }

    return result;
  }
}

/**
 * OpenAI API embedding adapter using text-embedding-3-small (1536 dims).
 * Falls back to deterministic local embeddings when OPENAI_API_KEY is not configured.
 */
export class OpenAIEmbeddingProvider implements IEmbeddingProvider {
  public readonly id = 'openai-text-embedding-3-small';
  private apiKey?: string;
  private fallback: DeterministicLocalEmbeddingProvider;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY;
    this.fallback = new DeterministicLocalEmbeddingProvider();
  }

  public async generateEmbedding(
    text: string,
    options?: EmbeddingOptions
  ): Promise<EmbeddingResult> {
    if (!this.apiKey) {
      return this.fallback.generateEmbedding(text, options);
    }

    const res = await this.generateEmbeddingsBatch([text], options);
    return {
      embedding: res.embeddings[0],
      usage: res.usage,
    };
  }

  public async generateEmbeddingsBatch(
    texts: string[],
    options?: EmbeddingOptions
  ): Promise<BatchEmbeddingResult> {
    if (!this.apiKey) {
      return this.fallback.generateEmbeddingsBatch(texts, options);
    }

    const start = Date.now();
    const model = options?.model || 'text-embedding-3-small';
    const dimensions = options?.dimensions || EMBEDDING_DIMENSION;

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          input: texts,
          model,
          dimensions,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI Embedding API error (${response.status}): ${errorText}`);
      }

      const json = (await response.json()) as {
        data: Array<{ embedding: number[] }>;
        usage?: { total_tokens?: number };
      };
      const embeddings: number[][] = json.data.map((item) => item.embedding);
      const totalTokens = json.usage?.total_tokens || texts.reduce((acc, t) => acc + Math.ceil(t.length / 4), 0);

      const usage: AIUsageMetrics = {
        promptTokens: totalTokens,
        completionTokens: 0,
        totalTokens,
        estimatedCostUsd: Number((totalTokens * 0.00000002).toFixed(8)),
        latencyMs: Date.now() - start,
      };

      return { embeddings, usage };
    } catch (err) {
      logger.warn({ err }, 'OpenAI embedding generation failed, falling back to deterministic local model');
      return this.fallback.generateEmbeddingsBatch(texts, options);
    }
  }
}

// Global active embedding provider singleton
export const embeddingProvider: IEmbeddingProvider = new OpenAIEmbeddingProvider();
