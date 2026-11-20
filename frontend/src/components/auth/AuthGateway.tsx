import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { recoverAccountApi, getOAuthUrlApi, getOAuthStartUrl } from '../../services/auth.api.js';
import { Button } from '../ui/Button.js';
import { AlertBanner } from '../ui/AlertBanner.js';
import { LoadingSpinner } from '../ui/LoadingSpinner.js';
import { SupportPilotLogo } from '../common/SupportPilotLogo.js';

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
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  const [error, setError] = useState<string | null>(null);
  const [recoverySuccess, setRecoverySuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null);

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setError(null);
    setRecoverySuccess(null);
    setOauthLoading(provider);

    try {
      const result = await getOAuthUrlApi(provider);
      window.location.href = result.url;
    } catch {
      // Direct navigation fallback to API redirect endpoint
      window.location.href = getOAuthStartUrl(provider);
    }
  };

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
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-navy-950 bg-radial-glow bg-grid-pattern relative overflow-hidden font-sans selection:bg-violet-600 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl w-full relative z-10 space-y-4">
        {/* Navigation back to landing */}
        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Landing Page</span>
          </button>
        )}

        {/* Split Card Design matching center mockup in design reference */}
        <div className="rounded-3xl glass-card-interactive border border-violet-500/25 shadow-glow-card overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left Panel: Branding & Value Props */}
          <div className="lg:col-span-5 p-8 sm:p-10 bg-gradient-to-br from-navy-900/90 via-navy-850 to-indigo-950/40 border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col justify-between relative overflow-hidden">
            {/* Ambient violet energy waves */}
            <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-violet-600/20 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-6 relative z-10">
              <SupportPilotLogo size="lg" />

              <div className="space-y-2 pt-4">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Welcome Back!</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sign in to continue your journey with SupportPilot and access your intelligent support command center.
                </p>
              </div>

              {/* Three Bullets from Reference Image */}
              <div className="space-y-3.5 pt-2">
                <div className="flex items-center gap-3 text-xs text-slate-200">
                  <div className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span>Access your dashboard</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-200">
                  <div className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span>Manage support tickets</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-200">
                  <div className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span>Get insights &amp; analytics</span>
                </div>
              </div>
            </div>

            {/* Bottom Security Assurance */}
            <div className="pt-8 border-t border-white/5 relative z-10 flex items-center gap-2 text-[11px] text-slate-400">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>SOC2 compliant • PostgreSQL pgvector</span>
            </div>
          </div>

          {/* Right Panel: Authentication Form */}
          <div className="lg:col-span-7 p-8 sm:p-10 space-y-6 bg-navy-950/60">
            {/* Mode Switcher Tabs */}
            <div className="flex rounded-2xl bg-navy-900 p-1 border border-white/5 text-xs">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setRecoverySuccess(null);
                }}
                className={`flex-1 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-glow'
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
                className={`flex-1 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-glow'
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
                className={`flex-1 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                  mode === 'recover'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-glow'
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
                  <label className="text-xs font-semibold text-slate-300">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Sarah Connor"
                      className="w-full bg-navy-900 border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-navy-900 border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>
              </div>

              {mode !== 'recover' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">Password</label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => setMode('recover')}
                        className="text-[11px] text-violet-400 hover:text-violet-300 transition-colors cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-navy-900 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Remember Me Checkbox (from mockup) */}
                  {mode === 'login' && (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="rememberMe"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-white/20 bg-navy-900 text-violet-600 focus:ring-0 cursor-pointer"
                      />
                      <label htmlFor="rememberMe" className="text-xs text-slate-400 cursor-pointer select-none">
                        Remember me
                      </label>
                    </div>
                  )}

                  {/* Registration Security Requirements Checklist */}
                  {mode === 'register' && (
                    <div className="pt-2 text-[10px] space-y-1 bg-navy-900/60 p-3 rounded-xl border border-white/5">
                      <span className="text-slate-400 font-semibold">Security Requirements:</span>
                      <div className="grid grid-cols-3 gap-1">
                        <span className={hasMinLength ? 'text-emerald-400 font-medium' : 'text-slate-500'}>
                          ✓ 8+ chars
                        </span>
                        <span className={hasUppercase ? 'text-emerald-400 font-medium' : 'text-slate-500'}>
                          ✓ 1 uppercase
                        </span>
                        <span className={hasNumber ? 'text-emerald-400 font-medium' : 'text-slate-500'}>
                          ✓ 1 number
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-3 shadow-glow-violet"
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

            {/* Social Auth Buttons (Google & GitHub from Reference Mockup) */}
            {mode !== 'recover' && (
              <div className="space-y-3 pt-2">
                <div className="relative flex items-center justify-center">
                  <div className="border-t border-white/10 w-full" />
                  <span className="bg-navy-950 px-3 text-[11px] text-slate-500 uppercase font-medium absolute">
                    or continue with
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    disabled={loading || oauthLoading !== null}
                    onClick={() => handleOAuthLogin('google')}
                    aria-label="Continue with Google"
                    className="p-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 border border-white/10 flex items-center justify-center gap-2 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {oauthLoading === 'google' ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                        />
                      </svg>
                    )}
                    <span>Google</span>
                  </button>

                  <button
                    type="button"
                    disabled={loading || oauthLoading !== null}
                    onClick={() => handleOAuthLogin('github')}
                    aria-label="Continue with GitHub"
                    className="p-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 border border-white/10 flex items-center justify-center gap-2 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {oauthLoading === 'github' ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                    )}
                    <span>GitHub</span>
                  </button>
                </div>
              </div>
            )}

            {/* Switch Mode Footer Link */}
            <div className="text-center text-xs text-slate-400 pt-1">
              {mode === 'login' ? (
                <div>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError(null);
                    }}
                    className="text-violet-400 hover:text-violet-300 font-semibold cursor-pointer"
                  >
                    Create one
                  </button>
                </div>
              ) : mode === 'register' ? (
                <div>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError(null);
                    }}
                    className="text-violet-400 hover:text-violet-300 font-semibold cursor-pointer"
                  >
                    Sign in
                  </button>
                </div>
              ) : (
                <div>
                  Remember your credentials?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError(null);
                    }}
                    className="text-violet-400 hover:text-violet-300 font-semibold cursor-pointer"
                  >
                    Back to sign in
                  </button>
                </div>
              )}
            </div>

            {/* Quick Demo Evaluation Profiles Bar (Preserves test assertions) */}
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
          </div>
        </div>
      </div>
    </div>
  );
};
