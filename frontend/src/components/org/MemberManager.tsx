import React, { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus, Shield, Trash2, Edit2, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { OrgMemberDetail, OrgRole } from '../../types/auth.js';
import { listMembersApi, addMemberApi, updateRoleApi, removeMemberApi } from '../../services/auth.api.js';
import { Card, CardHeader, CardContent } from '../ui/Card.js';
import { Badge } from '../ui/Badge.js';
import { Button } from '../ui/Button.js';
import { LoadingSpinner } from '../ui/LoadingSpinner.js';
import { AlertBanner } from '../ui/AlertBanner.js';

export const MemberManager: React.FC = () => {
  const { accessToken, activeOrg, role } = useAuth();
  const [members, setMembers] = useState<OrgMemberDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<OrgRole>('AGENT');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Edit role modal state
  const [editingMember, setEditingMember] = useState<OrgMemberDetail | null>(null);
  const [newRole, setNewRole] = useState<OrgRole>('AGENT');

  const isOwner = role === 'OWNER';

  const loadMembers = useCallback(async () => {
    if (!accessToken || !activeOrg) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listMembersApi(accessToken, activeOrg.organizationId);
      setMembers(data);
    } catch (err) {
      setError((err as Error).message || 'Failed to load organization members');
    } finally {
      setLoading(false);
    }
  }, [accessToken, activeOrg]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !activeOrg) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await addMemberApi(accessToken, activeOrg.organizationId, {
        email: inviteEmail,
        role: inviteRole,
      });
      setSuccessMsg(`Successfully invited ${inviteEmail} as ${inviteRole}`);
      setInviteEmail('');
      setShowInviteModal(false);
      loadMembers();
    } catch (err) {
      setError((err as Error).message || 'Failed to invite member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!accessToken || !activeOrg || !editingMember) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await updateRoleApi(accessToken, activeOrg.organizationId, editingMember.userId, newRole);
      setSuccessMsg(`Updated ${editingMember.fullName}'s role to ${newRole}`);
      setEditingMember(null);
      loadMembers();
    } catch (err) {
      setError((err as Error).message || 'Failed to update member role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (member: OrgMemberDetail) => {
    if (!accessToken || !activeOrg) return;
    if (!confirm(`Are you sure you want to remove ${member.fullName} from ${activeOrg.organizationName}?`)) {
      return;
    }

    try {
      await removeMemberApi(accessToken, activeOrg.organizationId, member.userId);
      setSuccessMsg(`Removed ${member.fullName} from organization`);
      loadMembers();
    } catch (err) {
      setError((err as Error).message || 'Failed to remove member');
    }
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {error && <AlertBanner type="error" title="Error" message={error} onDismiss={() => setError(null)} />}
      {successMsg && (
        <AlertBanner type="success" title="Success" message={successMsg} onDismiss={() => setSuccessMsg(null)} />
      )}

      {/* Role permission info banner */}
      {!isOwner && (
        <AlertBanner
          type="info"
          title="Role Notice"
          message={`You are viewing this organization as a ${role}. Member invitations and role modifications are restricted to Organization Owners.`}
        />
      )}

      {/* Main Members Card */}
      <Card>
        <CardHeader
          title="Organization Members & Roles"
          subtitle={`Active roster for ${activeOrg?.organizationName || 'your organization'}`}
          icon={<Users className="w-5 h-5" />}
          action={
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={loadMembers}
                isLoading={loading}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Refresh
              </Button>
              {isOwner && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setShowInviteModal(true)}
                  leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                >
                  Invite Member
                </Button>
              )}
            </div>
          }
        />
        <CardContent className="p-0">
          {loading && members.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <LoadingSpinner size="md" />
              <p className="text-xs text-slate-400">Loading verified membership roster...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/60 border-b border-white/5 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-5">User</th>
                    <th className="py-3 px-5">Email</th>
                    <th className="py-3 px-5">Assigned Role</th>
                    <th className="py-3 px-5">Joined Date</th>
                    {isOwner && <th className="py-3 px-5 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {members.map((m) => (
                    <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center font-bold text-white text-[10px]">
                            {m.fullName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-slate-100">{m.fullName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-slate-400 font-mono text-[11px]">{m.email}</td>
                      <td className="py-3 px-5">
                        <Badge
                          variant={
                            m.role === 'OWNER' ? 'brand' : m.role === 'AGENT' ? 'info' : 'neutral'
                          }
                          size="sm"
                        >
                          {m.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-5 text-slate-400">
                        {new Date(m.joinedAt).toLocaleDateString()}
                      </td>
                      {isOwner && (
                        <td className="py-3 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingMember(m);
                                setNewRole(m.role);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                              title="Change Role"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRemove(m)}
                              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Remove Member"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-brand-500/30">
            <CardHeader
              title="Add Organization Member"
              subtitle="Invite a registered user and assign their access role"
              icon={<UserPlus className="w-5 h-5 text-brand-400" />}
            />
            <CardContent>
              <form onSubmit={handleInvite} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Registered User Email</label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="agent@company.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Role & Access Level</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as OrgRole)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 cursor-pointer"
                  >
                    <option value="AGENT">Support Agent (Full ticket & KB access)</option>
                    <option value="CUSTOMER">Customer (Scoped strictly to own tickets)</option>
                    <option value="OWNER">Owner (Full administrative control)</option>
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 text-[11px] text-slate-400 flex items-start gap-2">
                  <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    Role authorization is enforced on the server for every subsequent request.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowInviteModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" isLoading={isSubmitting}>
                    Add Member
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Change Role Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-brand-500/30">
            <CardHeader
              title={`Update Role for ${editingMember.fullName}`}
              subtitle={editingMember.email}
              icon={<Shield className="w-5 h-5 text-brand-400" />}
            />
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">New Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as OrgRole)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 cursor-pointer"
                >
                  <option value="AGENT">SUPPORT AGENT</option>
                  <option value="CUSTOMER">CUSTOMER</option>
                  <option value="OWNER">ORGANIZATION OWNER</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditingMember(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleUpdateRole}
                  isLoading={isSubmitting}
                >
                  Save Role Change
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
