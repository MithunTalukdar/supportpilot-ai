export interface EmbeddingOptions {
  dimensions?: number;
  model?: string;
}

export interface CompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  timeoutMs?: number;
}

export interface AIUsageMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  latencyMs: number;
}

export interface EmbeddingResult {
  embedding: number[];
  usage: AIUsageMetrics;
}

export interface BatchEmbeddingResult {
  embeddings: number[][];
  usage: AIUsageMetrics;
}

export interface CompletionResult {
  content: string;
  usage: AIUsageMetrics;
  model: string;
  provider: string;
}

export interface IEmbeddingProvider {
  id: string;
  generateEmbedding(text: string, options?: EmbeddingOptions): Promise<EmbeddingResult>;
  generateEmbeddingsBatch(texts: string[], options?: EmbeddingOptions): Promise<BatchEmbeddingResult>;
}

export interface ICompletionProvider {
  id: string;
  complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult>;
}
