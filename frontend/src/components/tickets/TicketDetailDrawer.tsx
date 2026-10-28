import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  MessageSquare,
  Lock,
  Send,
  User,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle,
  Tag,
  Shield,
  HelpCircle,
  Sparkles,
  Bot,
  BrainCircuit,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { TicketItem, TicketCommentItem, TicketPriority, TicketStatus } from '../../types/ticket.js';
import { OrgMemberDetail } from '../../types/auth.js';
import { TicketStatusBadge, TicketPriorityBadge } from './TicketStatusBadge.js';
import { Button } from '../ui/Button.js';
import { Badge } from '../ui/Badge.js';
import { LoadingSpinner } from '../ui/LoadingSpinner.js';
import { AlertBanner } from '../ui/AlertBanner.js';
import {
  getTicketApi,
  updateTicketApi,
  addCommentApi,
} from '../../services/ticket.api.js';
import { listMembersApi } from '../../services/auth.api.js';
import {
  summarizeTicketApi,
  classifyTicketApi,
  suggestReplyApi,
} from '../../services/ai-assist.api.js';

interface TicketDetailDrawerProps {
  ticketId: string | null;
  onClose: () => void;
  onTicketUpdated?: (updatedTicket: TicketItem) => void;
}

export const TicketDetailDrawer: React.FC<TicketDetailDrawerProps> = ({
  ticketId,
  onClose,
  onTicketUpdated,
}) => {
  const { accessToken, activeOrg, role, user } = useAuth();
  const [ticket, setTicket] = useState<TicketItem | null>(null);
  const [comments, setComments] = useState<TicketCommentItem[]>([]);
  const [agents, setAgents] = useState<OrgMemberDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [replyLoading, setReplyLoading] = useState<boolean>(false);
  const [updatingTicket, setUpdatingTicket] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Reply state
  const [replyText, setReplyText] = useState<string>('');
  const [isInternalNote, setIsInternalNote] = useState<boolean>(false);

  // AI Copilot state
  const [summarizing, setSummarizing] = useState<boolean>(false);
  const [classifying, setClassifying] = useState<boolean>(false);
  const [suggestingReply, setSuggestingReply] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const isStaff = role === 'OWNER' || role === 'AGENT';

  // Load ticket details
  const fetchTicketDetails = useCallback(async () => {
    if (!ticketId || !accessToken || !activeOrg) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getTicketApi(accessToken, activeOrg.organizationId, ticketId);
      setTicket(data);
      setComments(data.comments || []);
    } catch (err) {
      setError((err as Error).message || 'Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  }, [ticketId, accessToken, activeOrg]);

  // Load org agents for assignment
  useEffect(() => {
    if (!isStaff || !accessToken || !activeOrg) return;
    listMembersApi(accessToken, activeOrg.organizationId)
      .then((members) => {
        const staff = members.filter((m) => m.role === 'OWNER' || m.role === 'AGENT');
        setAgents(staff);
      })
      .catch(() => {
        // Silently catch member list fail if permission edge case
      });
  }, [isStaff, accessToken, activeOrg]);

  useEffect(() => {
    if (ticketId) {
      fetchTicketDetails();
    }
  }, [ticketId, fetchTicketDetails]);

  if (!ticketId) return null;

  // AI Copilot Handlers
  const handleSummarizeTicket = async () => {
    if (!ticket || !accessToken || !activeOrg) return;
    setSummarizing(true);
    setAiError(null);
    try {
      const res = await summarizeTicketApi(accessToken, activeOrg.organizationId, ticket.id);
      const updated = { ...ticket, aiSummary: res.summary };
      setTicket(updated);
      onTicketUpdated?.(updated);
    } catch (err) {
      setAiError((err as Error).message || 'Failed to generate AI summary');
    } finally {
      setSummarizing(false);
    }
  };

  const handleClassifyTicket = async () => {
    if (!ticket || !accessToken || !activeOrg) return;
    setClassifying(true);
    setAiError(null);
    try {
      const res = await classifyTicketApi(accessToken, activeOrg.organizationId, ticket.id);
      const updated = {
        ...ticket,
        aiCategory: res.classification.suggestedCategory,
        sentimentScore: res.classification.sentimentScore,
      };
      setTicket(updated);
      onTicketUpdated?.(updated);
    } catch (err) {
      setAiError((err as Error).message || 'Failed to classify ticket');
    } finally {
      setClassifying(false);
    }
  };

  const handleSuggestReply = async () => {
    if (!ticket || !accessToken || !activeOrg) return;
    setSuggestingReply(true);
    setAiError(null);
    try {
      const res = await suggestReplyApi(accessToken, activeOrg.organizationId, ticket.id);
      setReplyText(res.draftReply);
      setIsInternalNote(false);
    } catch (err) {
      setAiError((err as Error).message || 'Failed to draft AI reply');
    } finally {
      setSuggestingReply(false);
    }
  };

  // Handle status update
  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticket || !accessToken || !activeOrg) return;
    setUpdatingTicket(true);
    setError(null);
    try {
      const updated = await updateTicketApi(accessToken, activeOrg.organizationId, ticket.id, {
        status: newStatus,
      });
      setTicket(updated);
      onTicketUpdated?.(updated);
    } catch (err) {
      setError((err as Error).message || 'Failed to update ticket status');
    } finally {
      setUpdatingTicket(false);
    }
  };

  // Handle priority update
  const handlePriorityChange = async (newPriority: TicketPriority) => {
    if (!ticket || !accessToken || !activeOrg) return;
    setUpdatingTicket(true);
    setError(null);
    try {
      const updated = await updateTicketApi(accessToken, activeOrg.organizationId, ticket.id, {
        priority: newPriority,
      });
      setTicket(updated);
      onTicketUpdated?.(updated);
    } catch (err) {
      setError((err as Error).message || 'Failed to update ticket priority');
    } finally {
      setUpdatingTicket(false);
    }
  };

  // Handle agent assignment
  const handleAssignAgent = async (agentIdStr: string) => {
    if (!ticket || !accessToken || !activeOrg) return;
    setUpdatingTicket(true);
    setError(null);
    try {
      const assignedAgentId = agentIdStr === 'UNASSIGNED' ? null : agentIdStr;
      const updated = await updateTicketApi(accessToken, activeOrg.organizationId, ticket.id, {
        assignedAgentId,
      });
      setTicket(updated);
      onTicketUpdated?.(updated);
    } catch (err) {
      setError((err as Error).message || 'Failed to reassign agent');
    } finally {
      setUpdatingTicket(false);
    }
  };

  // Handle reply submit
  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !ticket || !accessToken || !activeOrg) return;

    setReplyLoading(true);
    setError(null);
    try {
      const newComment = await addCommentApi(accessToken, activeOrg.organizationId, ticket.id, {
        content: replyText.trim(),
        isInternal: isStaff ? isInternalNote : false,
      });

      setComments((prev) => [...prev, newComment]);
      setReplyText('');
      setIsInternalNote(false);

      // Re-fetch ticket to refresh any status changes (e.g. customer reply auto re-opening to IN_PROGRESS)
      const refreshedTicket = await getTicketApi(accessToken, activeOrg.organizationId, ticket.id);
      setTicket(refreshedTicket);
      onTicketUpdated?.(refreshedTicket);
    } catch (err) {
      setError((err as Error).message || 'Failed to submit comment');
    } finally {
      setReplyLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div className="w-full max-w-3xl bg-surface-darkest border-l border-white/10 shadow-2xl flex flex-col h-full transform transition-all">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-slate-900/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-sm font-bold text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-lg border border-brand-500/20 shrink-0">
              #SP-{ticket?.ticketNumber || '...'}
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white truncate">
                {ticket?.title || 'Loading ticket...'}
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                <span>Category: <strong className="text-slate-300">{ticket?.category || 'General'}</strong></span>
                <span>•</span>
                <span>Created {ticket ? formatDate(ticket.createdAt) : ''}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors shrink-0"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <LoadingSpinner size="lg" />
            <p className="text-xs text-slate-400">Loading conversation thread and telemetry...</p>
          </div>
        ) : !ticket ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="w-10 h-10 text-rose-400 mb-2" />
            <h3 className="text-sm font-semibold text-white">Ticket Not Found</h3>
            <p className="text-xs text-slate-400 mt-1">
              This ticket may belong to another organization or was removed.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Staff Controls & Properties Bar */}
            <div className="p-4 bg-slate-900/30 border-b border-white/5 space-y-3">
              {error && (
                <AlertBanner
                  type="error"
                  title="Ticket Action Failed"
                  message={error}
                  onDismiss={() => setError(null)}
                  className="mb-2"
                />
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {/* Status Control */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Status
                  </span>
                  {isStaff ? (
                    <select
                      value={ticket.status}
                      disabled={updatingTicket}
                      onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
                    >
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="WAITING_FOR_CUSTOMER">Waiting for Customer</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  ) : (
                    <div>
                      <TicketStatusBadge status={ticket.status} />
                    </div>
                  )}
                </div>

                {/* Priority Control */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Priority
                  </span>
                  {isStaff ? (
                    <select
                      value={ticket.priority}
                      disabled={updatingTicket}
                      onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  ) : (
                    <div>
                      <TicketPriorityBadge priority={ticket.priority} />
                    </div>
                  )}
                </div>

                {/* Agent Assignment */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Assigned Agent
                  </span>
                  {isStaff ? (
                    <select
                      value={ticket.assignedAgentId || 'UNASSIGNED'}
                      disabled={updatingTicket}
                      onChange={(e) => handleAssignAgent(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500 truncate"
                    >
                      <option value="UNASSIGNED">Unassigned</option>
                      {agents.map((ag) => (
                        <option key={ag.id} value={ag.id}>
                          {ag.fullName} ({ag.role})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-xs text-slate-300 truncate py-1">
                      {ticket.assignedAgent?.fullName || 'Unassigned'}
                    </div>
                  )}
                </div>

                {/* Customer Info */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Requester
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-200 truncate py-1">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{ticket.customer.fullName}</span>
                  </div>
                </div>
              </div>

              {/* Tags & Resolved At Bar */}
              {(ticket.tags?.length > 0 || ticket.resolvedAt) && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-[11px]">
                  {ticket.tags?.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Tag className="w-3 h-3 text-slate-400" />
                      {ticket.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {ticket.resolvedAt && (
                    <div className="text-emerald-400 flex items-center gap-1 text-[10px] ml-auto">
                      <CheckCircle className="w-3 h-3" />
                      <span>Resolved on {formatDate(ticket.resolvedAt)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* AI Copilot Card for Staff */}
            {isStaff && (
              <div className="mx-4 sm:mx-5 mt-4 p-4 rounded-xl glass-card border border-brand-500/30 space-y-3 bg-gradient-to-r from-brand-950/20 via-slate-900/40 to-indigo-950/20 shadow-glow">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-white tracking-tight">
                      SupportPilot AI Copilot
                    </span>
                    <Badge variant="brand" size="sm">
                      Staff Only
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleSummarizeTicket}
                      disabled={summarizing}
                      isLoading={summarizing}
                      leftIcon={<Bot className="w-3.5 h-3.5 text-brand-400" />}
                    >
                      {ticket.aiSummary ? 'Refresh Summary' : 'Summarize Issue'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleClassifyTicket}
                      disabled={classifying}
                      isLoading={classifying}
                      leftIcon={<BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />}
                    >
                      Classify & Sentiment
                    </Button>
                  </div>
                </div>

                {aiError && (
                  <div className="text-[11px] text-red-300 bg-red-950/40 border border-red-500/20 rounded-lg p-2">
                    {aiError}
                  </div>
                )}

                {/* AI Classification & Sentiment Badges */}
                {(ticket.aiCategory || ticket.sentimentScore !== undefined && ticket.sentimentScore !== null) && (
                  <div className="flex items-center gap-2 text-xs flex-wrap pt-1 border-t border-white/5">
                    {ticket.aiCategory && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-300">
                        <span className="text-slate-500">AI Category:</span>
                        <Badge variant="brand" size="sm">
                          {ticket.aiCategory}
                        </Badge>
                      </div>
                    )}
                    {ticket.sentimentScore !== undefined && ticket.sentimentScore !== null && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-300">
                        <span className="text-slate-500">Customer Sentiment:</span>
                        <Badge
                          variant={
                            ticket.sentimentScore > 0.1
                              ? 'success'
                              : ticket.sentimentScore < -0.2
                              ? 'error'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {ticket.sentimentScore > 0.1
                            ? `Positive (+${ticket.sentimentScore})`
                            : ticket.sentimentScore < -0.2
                            ? `Frustrated (${ticket.sentimentScore})`
                            : `Neutral (${ticket.sentimentScore})`}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}

                {/* AI Summary Content */}
                {ticket.aiSummary && (
                  <div className="p-3 rounded-lg bg-slate-950/70 border border-brand-500/20 text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                    {ticket.aiSummary}
                  </div>
                )}
              </div>
            )}

            {/* Conversation Messages Thread */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* Root Ticket Description Message */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center justify-center font-bold text-xs">
                      {ticket.customer.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <span>{ticket.customer.fullName}</span>
                        <Badge variant="neutral" size="sm">
                          Requester
                        </Badge>
                      </div>
                      <span className="text-[10px] text-slate-400">{ticket.customer.email}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(ticket.createdAt)}</span>
                  </div>
                </div>
                <div className="text-xs text-slate-200 leading-relaxed pt-2 border-t border-white/5 whitespace-pre-wrap">
                  {ticket.description}
                </div>
              </div>

              {/* Comment Thread */}
              {comments.map((comment) => {
                const isAuthorStaff =
                  agents.some((ag) => ag.id === comment.authorId) ||
                  comment.author.email.includes('admin') ||
                  comment.author.email.includes('agent');

                return (
                  <div
                    key={comment.id}
                    className={`p-4 rounded-xl border transition-all ${
                      comment.isInternal
                        ? 'bg-amber-950/25 border-amber-500/40 text-amber-200'
                        : isAuthorStaff
                        ? 'bg-slate-900/90 border-brand-500/20 text-slate-200'
                        : 'bg-slate-900/40 border-white/5 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                            comment.isInternal
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-800 text-slate-300 border border-white/10'
                          }`}
                        >
                          {comment.author.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                            <span>{comment.author.fullName}</span>
                            {comment.isInternal ? (
                              <Badge variant="warning" size="sm" className="gap-1">
                                <Lock className="w-2.5 h-2.5" />
                                <span>Internal Note</span>
                              </Badge>
                            ) : comment.authorId === ticket.customerId ? (
                              <Badge variant="neutral" size="sm">
                                Customer
                              </Badge>
                            ) : (
                              <Badge variant="brand" size="sm">
                                Support Staff
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(comment.createdAt)}</span>
                      </div>
                    </div>

                    <div className="text-xs leading-relaxed whitespace-pre-wrap">
                      {comment.content}
                    </div>

                    {comment.isInternal && (
                      <div className="mt-2.5 pt-2 border-t border-amber-500/20 text-[10px] text-amber-400/80 flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        <span>Private team note — stripped from customer visibility</span>
                      </div>
                    )}
                  </div>
                );
              })}

              {comments.length === 0 && (
                <div className="py-8 text-center text-slate-400 space-y-1">
                  <MessageSquare className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  <p className="text-xs font-medium">No replies yet</p>
                  <p className="text-[11px] text-slate-500">
                    Submit the first response below to initiate conversation.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Reply Composer */}
            <div className="p-4 bg-slate-900/80 border-t border-white/10">
              <form onSubmit={handlePostReply} className="space-y-2.5">
                {/* For Staff: Toggle Public Reply vs Internal Note + AI Suggest Reply */}
                {isStaff && (
                  <div className="flex items-center justify-between pb-1 flex-wrap gap-2">
                    <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-white/5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setIsInternalNote(false)}
                        className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                          !isInternalNote
                            ? 'bg-brand-500 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Public Customer Reply
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsInternalNote(true)}
                        className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${
                          isInternalNote
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Lock className="w-3 h-3" />
                        <span>Internal Note</span>
                      </button>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={handleSuggestReply}
                      disabled={suggestingReply}
                      isLoading={suggestingReply}
                      leftIcon={<Sparkles className="w-3.5 h-3.5 text-brand-400" />}
                    >
                      Draft Grounded Reply (AI)
                    </Button>
                  </div>
                )}

                <div className="relative">
                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={
                      isInternalNote
                        ? 'Write internal analysis or notes for fellow agents...'
                        : 'Write your reply to the customer...'
                    }
                    className={`w-full bg-slate-900 border rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none resize-none leading-relaxed ${
                      isInternalNote
                        ? 'border-amber-500/40 focus:border-amber-400'
                        : 'border-slate-700 focus:border-brand-500'
                    }`}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <HelpCircle className="w-3 h-3 text-slate-500" />
                    <span>
                      Signed in as <strong className="text-slate-300">{user?.fullName}</strong>
                    </span>
                  </div>

                  <Button
                    type="submit"
                    variant={isInternalNote ? 'warning' : 'primary'}
                    size="sm"
                    disabled={!replyText.trim() || replyLoading}
                    isLoading={replyLoading}
                    leftIcon={<Send className="w-3.5 h-3.5" />}
                  >
                    {isInternalNote ? 'Add Internal Note' : 'Send Reply'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
