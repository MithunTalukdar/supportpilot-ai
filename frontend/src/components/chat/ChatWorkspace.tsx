import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  Bot,
  User,
  Trash2,
  AlertTriangle,
  Clock,
  Ticket,
  ChevronRight,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import {
  ChatConversationItem,
  ChatMessageItem,
  CitationItem,
} from '../../types/chat.js';
import {
  listConversationsApi,
  createConversationApi,
  getConversationApi,
  sendMessageApi,
  deleteConversationApi,
} from '../../services/chat.api.js';
import { Button } from '../ui/Button.js';
import { Badge } from '../ui/Badge.js';
import { LoadingSpinner } from '../ui/LoadingSpinner.js';
import { CitationModal } from './CitationModal.js';

export const ChatWorkspace: React.FC = () => {
  const { accessToken, activeOrg, role } = useAuth();

  const [conversations, setConversations] = useState<ChatConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<ChatConversationItem | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);

  const [loadingList, setLoadingList] = useState<boolean>(true);
  const [loadingActive, setLoadingActive] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [inputContent, setInputContent] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Citation inspection modal state
  const [inspectedCitation, setInspectedCitation] = useState<CitationItem | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  // Load conversations list
  const loadConversations = useCallback(async () => {
    if (!accessToken || !activeOrg) return;
    setLoadingList(true);
    setError(null);
    try {
      const res = await listConversationsApi(accessToken, activeOrg.organizationId);
      setConversations(res.items);
      if (res.items.length > 0 && !activeConversationId) {
        setActiveConversationId(res.items[0].id);
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to load conversations');
    } finally {
      setLoadingList(false);
    }
  }, [accessToken, activeOrg, activeConversationId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load selected conversation thread
  useEffect(() => {
    if (!accessToken || !activeOrg || !activeConversationId) {
      setActiveConversation(null);
      setMessages([]);
      return;
    }

    setLoadingActive(true);
    getConversationApi(accessToken, activeOrg.organizationId, activeConversationId)
      .then((conv) => {
        setActiveConversation(conv);
        setMessages(conv.messages || []);
      })
      .catch((err) => {
        setError((err as Error).message || 'Failed to load conversation messages');
      })
      .finally(() => {
        setLoadingActive(false);
      });
  }, [accessToken, activeOrg, activeConversationId]);

  // Create new conversation
  const handleCreateNew = async () => {
    if (!accessToken || !activeOrg) return;
    setError(null);
    try {
      const newConv = await createConversationApi(accessToken, activeOrg.organizationId, {
        title: 'New Support Conversation',
      });
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
    } catch (err) {
      setError((err as Error).message || 'Failed to create new conversation');
    }
  };

  // Send message and get grounded RAG response
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputContent.trim() || sending || !accessToken || !activeOrg || !activeConversationId) {
      return;
    }

    const text = inputContent.trim();
    setInputContent('');
    setSending(true);
    setError(null);

    // Optimistically show user message
    const tempUserMsg: ChatMessageItem = {
      id: 'temp-' + Date.now(),
      conversationId: activeConversationId,
      organizationId: activeOrg.organizationId,
      senderType: role === 'CUSTOMER' ? 'CUSTOMER' : 'AGENT',
      content: text,
      citations: null,
      tokenMetrics: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const result = await sendMessageApi(
        accessToken,
        activeOrg.organizationId,
        activeConversationId,
        text
      );

      // Replace optimistic message and append bot response
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== tempUserMsg.id);
        return [...filtered, result.userMessage, result.botMessage];
      });

      // Update conversation in list (e.g. updated title or last message)
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId
            ? {
                ...c,
                title:
                  c.title === 'New Support Conversation'
                    ? text.length > 40
                      ? `${text.substring(0, 37)}...`
                      : text
                    : c.title,
                updatedAt: new Date().toISOString(),
                lastMessage: {
                  id: result.botMessage.id,
                  content: result.botMessage.content,
                  senderType: result.botMessage.senderType,
                  createdAt: result.botMessage.createdAt,
                },
              }
            : c
        )
      );
    } catch (err) {
      setError((err as Error).message || 'Failed to send message and generate AI response');
    } finally {
      setSending(false);
    }
  };

  // Delete conversation
  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!accessToken || !activeOrg) return;
    if (!confirm('Are you sure you want to delete this support conversation?')) return;

    try {
      await deleteConversationApi(accessToken, activeOrg.organizationId, convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConversationId === convId) {
        const remaining = conversations.filter((c) => c.id !== convId);
        setActiveConversationId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to delete conversation');
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-12rem)] min-h-[550px] flex rounded-2xl glass-card border border-white/5 overflow-hidden shadow-2xl">
      {/* Citation Inspection Modal */}
      <CitationModal citation={inspectedCitation} onClose={() => setInspectedCitation(null)} />

      {/* Left Pane: Conversation Threads Sidebar */}
      <div className="w-80 border-r border-white/5 flex flex-col bg-slate-950/40">
        <div className="p-4 border-b border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-brand-400" />
              <span className="text-sm font-bold text-white tracking-tight">RAG Copilot</span>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={handleCreateNew}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              New Chat
            </Button>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter conversations..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingList ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <LoadingSpinner size="sm" />
              <span className="text-[11px] text-slate-500">Loading conversation history...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="py-12 text-center px-4 space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">No support chats found.</p>
              <Button size="sm" variant="ghost" onClick={handleCreateNew}>
                Start First Conversation
              </Button>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = conv.id === activeConversationId;
              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`p-3 rounded-xl cursor-pointer transition-all border group relative ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-600/25 to-indigo-600/15 border-brand-500/30 text-white shadow-glow'
                      : 'bg-slate-900/30 hover:bg-slate-900/60 border-white/5 text-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold truncate flex-1">{conv.title}</span>
                    <button
                      onClick={(e) => handleDeleteConversation(conv.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-400 transition-opacity"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {conv.lastMessage && (
                    <p className="text-[11px] text-slate-400 truncate mt-1">
                      {conv.lastMessage.senderType === 'BOT' ? '🤖 ' : '👤 '}
                      {conv.lastMessage.content}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(conv.updatedAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    {conv.ticket && (
                      <span className="text-brand-400 font-mono font-medium flex items-center gap-0.5">
                        <Ticket className="w-2.5 h-2.5" />
                        #SP-{conv.ticket.ticketNumber}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Tenant Isolation Guard Badge */}
        <div className="p-3 border-t border-white/5 bg-slate-900/40 text-[10px] text-slate-400 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Tenant boundary cryptographically isolated</span>
        </div>
      </div>

      {/* Right Pane: Active Message Thread */}
      <div className="flex-1 flex flex-col bg-slate-900/20">
        {/* Header Bar */}
        <div className="h-16 px-6 border-b border-white/5 flex items-center justify-between bg-slate-950/20">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">
                {activeConversation?.title || 'Select or start a conversation'}
              </h2>
              <Badge variant="brand" size="sm">
                RAG Grounded
              </Badge>
              {activeConversation?.ticket && (
                <Badge variant="neutral" size="sm">
                  Ticket #SP-{activeConversation.ticket.ticketNumber}
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Directly grounded in your organization knowledge documents with strict source citations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="success" size="sm">
              Anti-Hallucination Safe
            </Badge>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="px-6 py-2 bg-red-950/40 border-b border-red-500/20 text-red-300 text-xs flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              {error}
            </span>
            <button
              onClick={() => setError(null)}
              className="text-xs text-red-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loadingActive ? (
            <div className="h-full flex flex-col items-center justify-center gap-2">
              <LoadingSpinner size="md" />
              <span className="text-xs text-slate-400">Loading conversation history...</span>
            </div>
          ) : !activeConversationId ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shadow-glow">
                <Sparkles className="w-7 h-7" />
              </div>
              <div className="max-w-md">
                <h3 className="text-sm font-bold text-white">SupportPilot AI Grounded Assistant</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Ask questions about support operations, product features, or company policies. All
                  answers cite real document sections.
                </p>
              </div>
              <Button size="sm" variant="primary" onClick={handleCreateNew}>
                Start New Conversation
              </Button>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <Bot className="w-6 h-6" />
              </div>
              <div className="max-w-sm">
                <h3 className="text-xs font-bold text-white">How can SupportPilot assist you today?</h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Type a question below or pick a suggested query to test knowledge base retrieval:
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-sm">
                {[
                  'What is your standard refund policy window?',
                  'How do I invite team members and assign roles?',
                  'What are the SLAs for urgent priority support tickets?',
                ].map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputContent(sample);
                    }}
                    className="p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-white/5 text-left text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between group"
                  >
                    <span>{sample}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-brand-400" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.senderType === 'CUSTOMER' || msg.senderType === 'AGENT';
              const isFallback =
                msg.senderType === 'BOT' &&
                (msg.content.includes('could not find sufficient information') ||
                  msg.content.includes('I apologize, but I could not find'));

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isUser
                        ? 'bg-brand-600 text-white shadow-glow'
                        : 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-glow'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div className="space-y-2">
                    <div
                      className={`p-4 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? 'bg-brand-600 text-white shadow-glow rounded-tr-sm'
                          : 'glass-card border border-white/10 text-slate-100 rounded-tl-sm shadow-xl'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>

                      {/* Source Citations Badges */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-brand-400" />
                            Supporting Citations & Evidence:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.citations.map((c) => (
                              <button
                                key={c.index}
                                onClick={() => setInspectedCitation(c)}
                                className="px-2 py-1 rounded-lg bg-brand-500/15 hover:bg-brand-500/25 border border-brand-500/30 text-brand-300 text-[10px] font-medium flex items-center gap-1 transition-all"
                              >
                                <span>[{c.index}]</span>
                                <span className="max-w-[140px] truncate">{c.documentTitle}</span>
                                <span className="text-emerald-400 font-bold">
                                  {Math.round(c.similarity * 100)}%
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Safe Fallback Indicator */}
                      {isFallback && (
                        <div className="mt-3 pt-2.5 border-t border-amber-500/20 text-[11px] text-amber-300 flex items-center gap-1.5 bg-amber-500/10 p-2 rounded-lg">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>No verified knowledge documents matched this inquiry.</span>
                        </div>
                      )}
                    </div>

                    {/* Metadata Footer */}
                    <div
                      className={`flex items-center gap-2 text-[10px] text-slate-500 ${
                        isUser ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {msg.tokenMetrics && (
                        <span>
                          · {msg.tokenMetrics.totalTokens} tokens ({msg.tokenMetrics.latencyMs}ms)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Typing / Generating Indicator */}
          {sending && (
            <div className="flex gap-3 max-w-lg mr-auto">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-glow">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="p-3.5 rounded-2xl glass-card border border-brand-500/20 rounded-tl-sm flex items-center gap-2 text-xs text-slate-300">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce"
                    style={{ animationDelay: '0.4s' }}
                  />
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  Retrieving knowledge context and synthesizing grounded response...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-white/5 bg-slate-950/40">
          <form onSubmit={handleSendMessage} className="space-y-2">
            <div className="relative rounded-2xl glass-card border border-white/10 focus-within:border-brand-500/50 transition-all p-1 flex items-end">
              <textarea
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={sending || !activeConversationId}
                placeholder={
                  activeConversationId
                    ? 'Ask a support question... (Enter to send, Shift+Enter for newline)'
                    : 'Select or start a conversation to ask questions'
                }
                rows={2}
                maxLength={4000}
                className="w-full bg-transparent border-0 text-xs text-white placeholder-slate-500 focus:outline-none p-2.5 resize-none"
              />

              <div className="p-2 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  type="submit"
                  onClick={handleSendMessage}
                  disabled={!inputContent.trim() || sending || !activeConversationId}
                  isLoading={sending}
                  rightIcon={<Send className="w-3.5 h-3.5" />}
                >
                  Send
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
              <span>Grounded AI answers strictly cite authorized organization documents.</span>
              <span>{inputContent.length} / 4,000 characters</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
