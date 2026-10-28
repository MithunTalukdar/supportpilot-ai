import React, { useState } from 'react';
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { recoverAccountApi } from '../../services/auth.api.js';
import { Button } from '../ui/Button.js';
import { Card, CardContent } from '../ui/Card.js';
import { AlertBanner } from '../ui/AlertBanner.js';

interface AuthGatewayProps {
  onBackToLanding?: () => void;
  initialMode?: 'login' | 'register' | 'recover';
  initialRole?: 'OWNER' | 'AGENT' | 'CUSTOMER';
}

export const AuthGateway: React.FC<AuthGatewayProps> = ({
  onBackToLanding,
  initialMode = 'login',
  initialRole,
}) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'recover'>(initialMode);

  const getInitialEmail = () => {
    if (initialRole === 'OWNER') return 'owner@alpha.com';
    if (initialRole === 'AGENT') return 'agent@alpha.com';
    if (initialRole === 'CUSTOMER') return 'customer@alpha.com';
    return '';
  };

  const [email, setEmail] = useState<string>(getInitialEmail());
  const [password, setPassword] = useState<string>(initialRole ? 'DemoPassword123!' : '');
  const [fullName, setFullName] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);
  const [recoverySuccess, setRecoverySuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Password requirements check for registration
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRecoverySuccess(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        if (!fullName.trim()) {
          throw new Error('Full name is required');
        }
        if (!isPasswordValid) {
          throw new Error('Password does not satisfy security requirements (8+ chars, uppercase, number)');
        }
        await register(email, password, fullName);
      } else if (mode === 'login') {
        await login(email, password);
      } else if (mode === 'recover') {
        const res = await recoverAccountApi(email);
        setRecoverySuccess(res.message);
      }
    } catch (err) {
      setError((err as Error).message || 'Authentication operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoPreset = (demoEmail: string) => {
    setMode('login');
    setEmail(demoEmail);
    setPassword('DemoPassword123!');
    setError(null);
    setRecoverySuccess(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden font-sans">
      {/* Decorative gradient glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6">
        {/* Navigation back to landing */}
        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Landing Page</span>
          </button>
        )}

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 shadow-glow mb-2">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            SupportPilot <span className="gradient-text">AI</span>
          </h1>
          <p className="text-xs text-slate-400">
            Multi-Tenant Customer Support & RAG Automation Platform
          </p>
        </div>

        {/* Auth Form Card */}
        <Card className="border-white/10 shadow-2xl">
          <CardContent className="p-6 sm:p-8 space-y-5">
            {/* Tab switcher */}
            <div className="flex rounded-xl bg-slate-900/80 p-1 border border-white/5 text-xs">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setRecoverySuccess(null);
                }}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                  mode === 'login'
                    ? 'bg-brand-600 text-white shadow-glow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                  setRecoverySuccess(null);
                }}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                  mode === 'register'
                    ? 'bg-brand-600 text-white shadow-glow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('recover');
                  setError(null);
                  setRecoverySuccess(null);
                }}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                  mode === 'recover'
                    ? 'bg-brand-600 text-white shadow-glow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Recovery
              </button>
            </div>

            {error && (
              <AlertBanner
                type="error"
                title="Authentication Error"
                message={error}
                onDismiss={() => setError(null)}
              />
            )}

            {recoverySuccess && (
              <AlertBanner
                type="success"
                title="Recovery Instructions Dispatched"
                message={recoverySuccess}
                onDismiss={() => setRecoverySuccess(null)}
              />
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Sarah Connor"
                      className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>

              {mode !== 'recover' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-300">Password</label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => setMode('recover')}
                        className="text-[11px] text-brand-400 hover:text-brand-300 transition-colors"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Live Password Strength Indicator in Register mode */}
                  {mode === 'register' && (
                    <div className="pt-2 text-[10px] space-y-1 bg-slate-900/50 p-2.5 rounded-lg border border-white/5">
                      <span className="text-slate-400 font-semibold">Security Requirements:</span>
                      <div className="grid grid-cols-3 gap-1">
                        <span className={hasMinLength ? 'text-emerald-400' : 'text-slate-500'}>
                          ✓ 8+ chars
                        </span>
                        <span className={hasUppercase ? 'text-emerald-400' : 'text-slate-500'}>
                          ✓ 1 uppercase
                        </span>
                        <span className={hasNumber ? 'text-emerald-400' : 'text-slate-500'}>
                          ✓ 1 number
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                isLoading={loading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {mode === 'login'
                  ? 'Sign In to Workspace'
                  : mode === 'register'
                  ? 'Create New Account'
                  : 'Send Recovery Instructions'}
              </Button>
            </form>

            {/* Quick evaluation accounts */}
            <div className="pt-4 border-t border-white/5 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 block text-center">
                Instant Evaluation Demo Profiles:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full text-[10px] px-1"
                  onClick={() => handleDemoPreset('owner@alpha.com')}
                >
                  Owner
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full text-[10px] px-1"
                  onClick={() => handleDemoPreset('agent@alpha.com')}
                >
                  Agent
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full text-[10px] px-1"
                  onClick={() => handleDemoPreset('customer@alpha.com')}
                >
                  Customer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
