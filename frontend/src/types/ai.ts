export interface TicketSummaryResult {
  ticketId: string;
  summary: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCostUsd: number;
    latencyMs: number;
  };
}

export interface TicketClassificationResult {
  ticketId: string;
  classification: {
    suggestedCategory: string;
    urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    sentimentScore: number;
    confidence: number;
    reasoning: string;
  };
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCostUsd: number;
    latencyMs: number;
  };
}

export interface SuggestedReplyResult {
  ticketId: string;
  draftReply: string;
  citations: Array<{
    documentTitle: string;
    snippet: string;
  }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCostUsd: number;
    latencyMs: number;
  };
}

export interface AiUsageRecordItem {
  id: string;
  feature: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  latencyMs: number;
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
}

export interface AiUsageSummary {
  totalRequests: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  totalEstimatedCostUsd: number;
  averageLatencyMs: number;
}

export interface AiSettings {
  aiMonthlySpendLimitUsd: number;
  ragConfidenceThreshold: number;
  maxRetrievalCount: number;
  aiAutoReply: boolean;
}
