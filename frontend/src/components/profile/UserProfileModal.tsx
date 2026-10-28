import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Lock,
  KeyRound,
  Building,
  LogOut,
  Save,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { updateProfileApi, changePasswordApi } from '../../services/auth.api.js';
import { Button } from '../ui/Button.js';
import { Badge } from '../ui/Badge.js';
import { AlertBanner } from '../ui/AlertBanner.js';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, accessToken, activeOrg, memberships, switchOrg, logout, refreshProfile } =
    useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'organizations'>('profile');

  // Edit profile state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setSavingProfile(true);
    setError(null);
    setProfileSuccess(false);

    try {
      await updateProfileApi(accessToken, {
        fullName: fullName.trim(),
        avatarUrl: avatarUrl.trim() || null,
      });
      await refreshProfile();
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      setError((err as Error).message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }

    setSavingPassword(true);
    setError(null);
    setPasswordSuccess(false);

    try {
      await changePasswordApi(accessToken, {
        currentPassword,
        newPassword,
      });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      setError((err as Error).message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl rounded-2xl glass-card border border-brand-500/30 p-6 shadow-2xl z-10 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-glow">
              {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">{user?.fullName}</h2>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex rounded-xl bg-slate-900 p-1 border border-white/5 text-xs">
          <button
            onClick={() => {
              setActiveTab('profile');
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'profile'
                ? 'bg-brand-600 text-white shadow-glow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Profile Info
          </button>
          <button
            onClick={() => {
              setActiveTab('security');
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'security'
                ? 'bg-brand-600 text-white shadow-glow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Password & Security
          </button>
          <button
            onClick={() => {
              setActiveTab('organizations');
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'organizations'
                ? 'bg-brand-600 text-white shadow-glow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Organizations ({memberships.length})
          </button>
        </div>

        {error && (
          <AlertBanner
            type="error"
            title="Operation Failed"
            message={error}
            onDismiss={() => setError(null)}
          />
        )}

        {profileSuccess && (
          <AlertBanner
            type="success"
            title="Profile Updated"
            message="Your account information has been successfully updated."
            onDismiss={() => setProfileSuccess(false)}
          />
        )}

        {passwordSuccess && (
          <AlertBanner
            type="success"
            title="Password Changed"
            message="Your password was successfully updated and existing sessions were refreshed."
            onDismiss={() => setPasswordSuccess(false)}
          />
        )}

        {/* Tab 1: Profile Information */}
        {activeTab === 'profile' && (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-400 cursor-not-allowed"
                />
              </div>
              <span className="text-[10px] text-slate-500">Email cannot be changed directly</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Avatar Image URL (Optional)</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={savingProfile}
                leftIcon={<Save className="w-3.5 h-3.5" />}
              >
                Save Profile Changes
              </Button>
            </div>
          </form>
        )}

        {/* Tab 2: Security & Password Change */}
        {activeTab === 'security' && (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Current Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">New Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters with uppercase and number"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Confirm New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={savingPassword}
                leftIcon={<Lock className="w-3.5 h-3.5" />}
              >
                Update Password
              </Button>
            </div>
          </form>
        )}

        {/* Tab 3: Organization Memberships */}
        {activeTab === 'organizations' && (
          <div className="space-y-3">
            <span className="text-xs font-medium text-slate-300 block">
              Organizations you are a verified member of:
            </span>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {memberships.map((m) => {
                const isActive = m.organizationId === activeOrg?.organizationId;
                return (
                  <div
                    key={m.organizationId}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      isActive
                        ? 'bg-brand-600/20 border-brand-500/40 text-white'
                        : 'bg-slate-900 border-white/5 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Building className="w-4 h-4 text-slate-400" />
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>{m.organizationName}</span>
                          {isActive && (
                            <Badge variant="success" size="sm">
                              Active
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {m.organizationSlug}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="brand" size="sm">
                        {m.role}
                      </Badge>
                      {!isActive && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            switchOrg(m.organizationId);
                            onClose();
                          }}
                        >
                          Switch
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-white/5 flex justify-between items-center">
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  logout();
                  onClose();
                }}
                leftIcon={<LogOut className="w-3.5 h-3.5" />}
              >
                Sign Out
              </Button>
              <Button size="sm" variant="secondary" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
