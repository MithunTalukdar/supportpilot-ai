import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { oauthCallbackApi } from '../services/auth.api.js';
import { LoadingSpinner } from '../components/ui/LoadingSpinner.js';
import { AlertBanner } from '../components/ui/AlertBanner.js';
import { Button } from '../components/ui/Button.js';
import { SupportPilotLogo } from '../components/common/SupportPilotLogo.js';
import { CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';

interface OAuthCallbackPageProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const OAuthCallbackPage: React.FC<OAuthCallbackPageProps> = ({ onSuccess, onCancel }) => {
  const { setSession } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [providerName, setProviderName] = useState<string>('OAuth Provider');

  useEffect(() => {
    let isMounted = true;

    async function handleExchange() {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const errorParam = searchParams.get('error') || searchParams.get('error_description');
        if (errorParam) {
          throw new Error(decodeURIComponent(errorParam));
        }

        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const providerParam = (searchParams.get('provider') || state || 'google').toLowerCase();
        const detectedProvider = providerParam.includes('github') ? 'github' : 'google';

        if (isMounted) {
          setProviderName(detectedProvider === 'github' ? 'GitHub' : 'Google');
        }

        if (!code) {
          throw new Error('Authorization code was not received from the provider callback.');
        }

        // Send authorization code to backend
        const result = await oauthCallbackApi({
          provider: detectedProvider,
          code,
        });

        if (!isMounted) return;

        // Establish session in AuthContext
        setSession({
          user: result.user,
          accessToken: result.accessToken,
          memberships: result.memberships,
        });

        setStatus('success');

        // Clean up URL query parameters so the code is not re-processed
        try {
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch {
          // ignore in sandboxed environments
        }

        // Brief delay for visual transition before navigating to dashboard
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          }
        }, 600);
      } catch (err) {
        if (!isMounted) return;
        setStatus('error');
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'An unexpected error occurred during OAuth authentication. Please try again.'
        );
      }
    }

    handleExchange();

    return () => {
      isMounted = false;
    };
  }, [setSession, onSuccess]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-navy-950 bg-radial-glow bg-grid-pattern relative overflow-hidden font-sans">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        <div className="rounded-3xl glass-card border border-violet-500/25 p-8 text-center space-y-6 shadow-glow-card">
          <div className="flex justify-center">
            <SupportPilotLogo size="lg" />
          </div>

          {status === 'processing' && (
            <div className="space-y-4 py-4">
              <LoadingSpinner size="lg" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  Authenticating with {providerName}
                </h3>
                <p className="text-xs text-slate-400">
                  Verifying identity tokens and establishing authorized session credentials...
                </p>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-violet-400 pt-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Zero-Trust Token Exchange</span>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4 py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Authentication Successful!</h3>
                <p className="text-xs text-slate-400">
                  Successfully logged in via {providerName}. Redirecting to your workspace...
                </p>
              </div>
              {onSuccess && (
                <Button
                  variant="primary"
                  size="md"
                  className="w-full mt-2"
                  onClick={onSuccess}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Enter Workspace
                </Button>
              )}
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4 text-left">
              <AlertBanner
                type="error"
                title={`${providerName} Authentication Failed`}
                message={errorMessage || 'An error occurred during authentication.'}
              />
              <Button
                variant="secondary"
                size="md"
                className="w-full"
                onClick={() => {
                  if (onCancel) {
                    onCancel();
                  } else {
                    window.location.href = '/';
                  }
                }}
              >
                Return to Sign In
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
