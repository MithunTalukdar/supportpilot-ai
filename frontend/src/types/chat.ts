export type ChatSenderType = 'CUSTOMER' | 'AGENT' | 'BOT';
export type ChatChannel = 'PORTAL' | 'WIDGET';

export interface CitationItem {
  index: number;
  documentId: string;
  documentTitle: string;
  chunkIndex: number;
  snippet: string;
  similarity: number;
}

export interface TokenMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
}

export interface ChatMessageItem {
  id: string;
  conversationId: string;
  organizationId: string;
  senderType: ChatSenderType;
  content: string;
  citations: CitationItem[] | null;
  tokenMetrics: TokenMetrics | null;
  createdAt: string;
}

export interface ChatConversationItem {
  id: string;
  organizationId: string;
  customerId: string | null;
  ticketId: string | null;
  title: string;
  channel: ChatChannel;
  createdAt: string;
  updatedAt: string;
  lastMessage?: {
    id: string;
    content: string;
    senderType: ChatSenderType;
    createdAt: string;
  } | null;
  ticket?: {
    id: string;
    ticketNumber: number;
    title: string;
    status?: string;
  } | null;
  messages?: ChatMessageItem[];
}
