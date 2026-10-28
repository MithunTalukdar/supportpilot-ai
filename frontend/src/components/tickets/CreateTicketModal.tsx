import React, { useState } from 'react';
import { PlusCircle, Tag, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { Card, CardHeader, CardContent } from '../ui/Card.js';
import { Button } from '../ui/Button.js';
import { AlertBanner } from '../ui/AlertBanner.js';
import { createTicketApi } from '../../services/ticket.api.js';
import { TicketItem, TicketPriority } from '../../types/ticket.js';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (ticket: TicketItem) => void;
}

const CATEGORY_OPTIONS = [
  'Technical Issue',
  'Billing & Subscriptions',
  'Account & Security',
  'Feature Request',
  'Integration / API',
  'General Inquiry',
];

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { accessToken, activeOrg } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
  const [tagsInput, setTagsInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!title.trim()) {
      errs.title = 'Subject is required';
    } else if (title.trim().length < 3) {
      errs.title = 'Subject must be at least 3 characters';
    } else if (title.trim().length > 200) {
      errs.title = 'Subject cannot exceed 200 characters';
    }

    if (!description.trim()) {
      errs.description = 'Description is required';
    } else if (description.trim().length < 5) {
      errs.description = 'Description must be at least 5 characters';
    }

    const finalCategory = category === 'Other' ? customCategory.trim() : category;
    if (!finalCategory) {
      errs.category = 'Category is required';
    }

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) return;
    if (!accessToken || !activeOrg) {
      setError('Active session and organization required');
      return;
    }

    setLoading(true);
    try {
      const finalCategory = category === 'Other' ? customCategory.trim() : category;
      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);

      const newTicket = await createTicketApi(accessToken, activeOrg.organizationId, {
        title: title.trim(),
        description: description.trim(),
        category: finalCategory,
        priority,
        tags: parsedTags,
      });

      // Reset form state
      setTitle('');
      setDescription('');
      setCategory(CATEGORY_OPTIONS[0]);
      setCustomCategory('');
      setPriority('MEDIUM');
      setTagsInput('');
      setValidationErrors({});

      onSuccess(newTicket);
      onClose();
    } catch (err: unknown) {
      const message = (err as Error).message || 'Failed to submit ticket';
      if (message.includes('Duplicate ticket')) {
        setError(
          'Duplicate Ticket Detected: A ticket with this exact subject was recently submitted. Please wait 60 seconds before retrying.'
        );
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="max-w-xl w-full border-brand-500/30 shadow-2xl my-8">
        <CardHeader
          title="Submit Support Ticket"
          subtitle={`Create a support ticket under ${activeOrg?.organizationName || 'Current Organization'}`}
          icon={<PlusCircle className="w-5 h-5 text-brand-400" />}
        />
        <CardContent>
          {error && (
            <AlertBanner
              type="error"
              title="Submission Error"
              message={error}
              onDismiss={() => setError(null)}
              className="mb-4"
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Subject / Issue Summary *</span>
                <span className="text-[10px] text-slate-500">{title.length}/200</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Cannot access billing invoice PDF"
                className={`w-full bg-slate-900 border rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none ${
                  validationErrors.title
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-slate-700 focus:border-brand-500'
                }`}
                maxLength={200}
              />
              {validationErrors.title && (
                <p className="text-[11px] text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {validationErrors.title}
                </p>
              )}
            </div>

            {/* Category and Priority Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="Other">Other (Custom Category)</option>
                </select>
                {category === 'Other' && (
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Specify custom category"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white mt-1.5 focus:outline-none focus:border-brand-500"
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TicketPriority)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="LOW">Low — Non-urgent question or minor request</option>
                  <option value="MEDIUM">Medium — Standard operational issue</option>
                  <option value="HIGH">High — Significant workflow impediment</option>
                  <option value="URGENT">Urgent — Outage or critical business blockage</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Description & Steps to Reproduce *</span>
                <span className="text-[10px] text-slate-500">{description.length}/5000</span>
              </label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide detailed context, error messages, or steps needed to understand your issue..."
                className={`w-full bg-slate-900 border rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none leading-relaxed resize-none ${
                  validationErrors.description
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-slate-700 focus:border-brand-500'
                }`}
                maxLength={5000}
              />
              {validationErrors.description && (
                <p className="text-[11px] text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {validationErrors.description}
                </p>
              )}
            </div>

            {/* Optional Tags */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Tags (Optional, comma-separated)</span>
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. billing, checkout, invoice"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Anti-Duplicate Notice */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-400 leading-relaxed">
                <span className="text-slate-200 font-medium">Duplicate Protection:</span> Our backend
                cryptographically validates submissions to avoid accidental double-clicks or repeated
                tickets within 60 seconds.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/5">
              <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={loading}
                leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
              >
                Create Ticket
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
