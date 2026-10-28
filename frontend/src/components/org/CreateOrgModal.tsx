import React, { useState } from 'react';
import { Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { Card, CardHeader, CardContent } from '../ui/Card.js';
import { Button } from '../ui/Button.js';
import { AlertBanner } from '../ui/AlertBanner.js';

interface CreateOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateOrgModal: React.FC<CreateOrgModalProps> = ({ isOpen, onClose }) => {
  const { createOrg } = useAuth();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    const autoSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(autoSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await createOrg(name, slug);
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-brand-500/30">
        <CardHeader
          title="Create New Organization"
          subtitle="Provision a separate multi-tenant organization"
          icon={<Building2 className="w-5 h-5 text-brand-400" />}
        />
        <CardContent>
          {error && (
            <AlertBanner
              type="error"
              title="Error"
              message={error}
              onDismiss={() => setError(null)}
              className="mb-4"
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Organization Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Acme Global Logistics"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">URL Slug (Unique)</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                placeholder="acme-global"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-brand-500"
              />
              <p className="text-[10px] text-slate-400">
                Lowercase alphanumeric characters and hyphens only.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={loading}>
                Create Organization
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
