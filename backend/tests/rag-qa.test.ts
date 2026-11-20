import { describe, it, expect } from 'vitest';
import { devFallbackStore } from '../src/repositories/dev-fallback.store.js';
import { DeterministicLocalCompletionProvider } from '../src/ai/completion.provider.js';

describe('RAG Copilot Knowledge Retrieval & Question Answering Accuracy', () => {
  const provider = new DeterministicLocalCompletionProvider();
  const orgId = devFallbackStore.defaultOrg.id;

  it('retrieves Customer Refund Policy document when user asks about refund policy window', () => {
    const results = devFallbackStore.searchDocuments(orgId, 'What is your standard refund policy window?');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].documentTitle).toBe('Customer Refund and Cancellation Policy.txt');
    expect(results[0].content).toContain('standard 30-day money-back guarantee');
    expect(results[0].similarity).toBeGreaterThanOrEqual(0.75);
  });

  it('retrieves Support SLA Guidelines when user asks about urgent ticket response times', () => {
    const results = devFallbackStore.searchDocuments(orgId, 'What is your SLA response time for urgent tickets?');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].documentTitle).toBe('Support SLA Guidelines & Incident Response.pdf');
    expect(results[0].content).toContain('1-hour first response SLA');
  });

  it('retrieves Multi-Tenant Security document when user asks about pgvector and data isolation', () => {
    const results = devFallbackStore.searchDocuments(orgId, 'How does SupportPilot isolate multi-tenant data in pgvector?');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].documentTitle).toBe('Multi-Tenant Enterprise Security Architecture.pdf');
    expect(results[0].content).toContain('PostgreSQL Row Level Security (RLS)');
  });

  it('returns empty results when question is completely ungrounded and irrelevant', () => {
    const results = devFallbackStore.searchDocuments(orgId, 'How do I pilot an alien spaceship to Mars?');
    expect(results.length).toBe(0);
  });

  it('synthesizes accurate refund window answer citing [1]', async () => {
    const prompt = `KNOWLEDGE_BASE_CONTEXT:
[Document 1: Customer Refund and Cancellation Policy.txt]
SupportPilot offers a standard 30-day money-back guarantee for all annual and monthly subscriptions. If you are unsatisfied within the first 30 days of purchase or renewal, you may request a full refund to your original payment method.

USER_QUERY:
What is your standard refund policy window?`;

    const res = await provider.complete(prompt);
    expect(res.content).toContain('Customer Refund and Cancellation Policy.txt');
    expect(res.content).toContain('30-day');
    expect(res.content).toContain('[1]');
    expect(res.content).not.toContain('Operational Handbook');
  });

  it('synthesizes accurate SLA answer citing [1]', async () => {
    const prompt = `KNOWLEDGE_BASE_CONTEXT:
[Document 1: Support SLA Guidelines & Incident Response.pdf]
Our customer support Service Level Agreement (SLA) guarantees initial response times based on ticket priority: Urgent priority tickets have a 1-hour first response SLA with 24/7 on-call engineering dispatch.

USER_QUERY:
What is your SLA for urgent tickets?`;

    const res = await provider.complete(prompt);
    expect(res.content).toContain('Support SLA Guidelines & Incident Response.pdf');
    expect(res.content).toContain('1-hour first response SLA');
    expect(res.content).toContain('[1]');
  });

  it('triggers safe anti-hallucination fallback when ungrounded prompt is given', async () => {
    const prompt = `KNOWLEDGE_BASE_CONTEXT:
NO_RELEVANT_DOCUMENTS_FOUND

USER_QUERY:
How do I build a spaceship to Mars?`;

    const res = await provider.complete(prompt);
    expect(res.content).toContain('could not find sufficient information');
  });
});
