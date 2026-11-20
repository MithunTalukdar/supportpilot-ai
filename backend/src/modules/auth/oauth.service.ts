import { randomUUID } from 'node:crypto';
import { prisma } from '../../repositories/prisma.js';
import { hashPassword } from '../../utils/password.util.js';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt.util.js';
import { BadRequestError, UnauthorizedError, AppError } from '../../errors/app-error.js';
import { HttpStatus } from '../../constants/http-status.js';
import { logger } from '../../logging/logger.js';
import { devFallbackStore, isDbUnavailableError } from '../../repositories/dev-fallback.store.js';
import { env } from '../../config/env.js';
import { OrgRole } from '@prisma/client';

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type OAuthProvider = 'google' | 'github';

export interface OAuthUserProfile {
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  provider: OAuthProvider;
}

export class OAuthService {
  private getRedirectBase(): string {
    return env.OAUTH_REDIRECT_BASE_URL || env.FRONTEND_URL || 'http://localhost:5173';
  }

  public getCallbackUrl(): string {
    const base = this.getRedirectBase().replace(/\/$/, '');
    return `${base}/oauth/callback`;
  }

  public getAuthorizationUrl(
    provider: string,
    state?: string
  ): { url: string; isSimulation: boolean } {
    const normProvider = provider.toLowerCase() as OAuthProvider;
    const callbackUrl = this.getCallbackUrl();
    const effectiveState = state || normProvider;

    if (normProvider === 'google') {
      const clientId = env.GOOGLE_CLIENT_ID?.trim();
      if (!clientId) {
        // Dev Simulation Fallback
        const simCode = `dev-simulated-google-${Date.now()}`;
        const simUrl = `${callbackUrl}?provider=google&code=${simCode}&state=${encodeURIComponent(effectiveState)}`;
        return { url: simUrl, isSimulation: true };
      }

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: callbackUrl,
        response_type: 'code',
        scope: 'openid email profile',
        state: effectiveState,
        access_type: 'offline',
        prompt: 'consent',
      });
      return {
        url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
        isSimulation: false,
      };
    }

    if (normProvider === 'github') {
      const clientId = env.GITHUB_CLIENT_ID?.trim();
      if (!clientId) {
        // Dev Simulation Fallback
        const simCode = `dev-simulated-github-${Date.now()}`;
        const simUrl = `${callbackUrl}?provider=github&code=${simCode}&state=${encodeURIComponent(effectiveState)}`;
        return { url: simUrl, isSimulation: true };
      }

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: callbackUrl,
        scope: 'read:user user:email',
        state: effectiveState,
      });
      return {
        url: `https://github.com/login/oauth/authorize?${params.toString()}`,
        isSimulation: false,
      };
    }

    throw new BadRequestError(`Unsupported OAuth provider '${provider}'. Only 'google' and 'github' are supported.`);
  }

  private async fetchGoogleProfile(code: string): Promise<OAuthUserProfile> {
    const clientId = env.GOOGLE_CLIENT_ID?.trim();
    const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim();
    const callbackUrl = this.getCallbackUrl();

    if (!clientId || !clientSecret) {
      throw new BadRequestError('Google OAuth is not configured on the server (missing client ID or secret)');
    }

    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      logger.error({ status: tokenRes.status, body: errText }, 'Google token exchange failed');
      throw new UnauthorizedError('Failed to exchange authorization code with Google');
    }

    const tokenData = (await tokenRes.json()) as { access_token?: string };
    if (!tokenData.access_token) {
      throw new UnauthorizedError('No access token returned by Google OAuth');
    }

    // Fetch user profile
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      throw new UnauthorizedError('Failed to fetch user profile from Google');
    }

    const userData = (await userRes.json()) as {
      email?: string;
      name?: string;
      picture?: string;
    };

    if (!userData.email) {
      throw new BadRequestError('Google account did not provide an email address');
    }

    return {
      email: userData.email,
      fullName: userData.name || userData.email.split('@')[0],
      avatarUrl: userData.picture || null,
      provider: 'google',
    };
  }

  private async fetchGithubProfile(code: string): Promise<OAuthUserProfile> {
    const clientId = env.GITHUB_CLIENT_ID?.trim();
    const clientSecret = env.GITHUB_CLIENT_SECRET?.trim();
    const callbackUrl = this.getCallbackUrl();

    if (!clientId || !clientSecret) {
      throw new BadRequestError('GitHub OAuth is not configured on the server (missing client ID or secret)');
    }

    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: callbackUrl,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      logger.error({ status: tokenRes.status, body: errText }, 'GitHub token exchange failed');
      throw new UnauthorizedError('Failed to exchange authorization code with GitHub');
    }

    const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string; error_description?: string };
    if (!tokenData.access_token) {
      throw new UnauthorizedError(tokenData.error_description || 'No access token returned by GitHub OAuth');
    }

    // Fetch user profile
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': 'SupportPilot-AI',
      },
    });

    if (!userRes.ok) {
      throw new UnauthorizedError('Failed to fetch user profile from GitHub');
    }

    const userData = (await userRes.json()) as {
      login: string;
      name?: string;
      email?: string | null;
      avatar_url?: string;
    };

    let userEmail = userData.email;

    // If email is private on GitHub, fetch user emails endpoint
    if (!userEmail) {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'User-Agent': 'SupportPilot-AI',
        },
      });

      if (emailsRes.ok) {
        const emails = (await emailsRes.json()) as Array<{
          email: string;
          primary: boolean;
          verified: boolean;
        }>;
        const primaryEmail = emails.find((e) => e.primary && e.verified) || emails[0];
        if (primaryEmail) {
          userEmail = primaryEmail.email;
        }
      }
    }

    if (!userEmail) {
      userEmail = `${userData.login}@users.noreply.github.com`;
    }

    return {
      email: userEmail,
      fullName: userData.name || userData.login,
      avatarUrl: userData.avatar_url || null,
      provider: 'github',
    };
  }

  public async handleOAuthCallback(provider: string, code: string) {
    const normProvider = provider.toLowerCase() as OAuthProvider;
    if (normProvider !== 'google' && normProvider !== 'github') {
      throw new BadRequestError(`Unsupported OAuth provider '${provider}'`);
    }

    let profile: OAuthUserProfile;

    // Check if simulation code or missing credentials triggers dev simulation
    const isSimulated =
      code.startsWith('dev-simulated-') ||
      (normProvider === 'google' && !env.GOOGLE_CLIENT_ID) ||
      (normProvider === 'github' && !env.GITHUB_CLIENT_ID);

    if (isSimulated) {
      logger.info({ provider: normProvider }, '⚡ Executing OAuth via Instant Dev Simulation fallback');
      if (normProvider === 'google') {
        profile = {
          email: 'google.user@supportpilot.io',
          fullName: 'Google Demo User',
          avatarUrl: 'https://lh3.googleusercontent.com/a/default-user',
          provider: 'google',
        };
      } else {
        profile = {
          email: 'github.developer@supportpilot.io',
          fullName: 'GitHub Demo Developer',
          avatarUrl: 'https://avatars.githubusercontent.com/u/9919?v=4',
          provider: 'github',
        };
      }
    } else {
      if (normProvider === 'google') {
        profile = await this.fetchGoogleProfile(code);
      } else {
        profile = await this.fetchGithubProfile(code);
      }
    }

    // Persist or authenticate user
    try {
      let user = await prisma.user.findUnique({
        where: { email: profile.email.toLowerCase() },
        include: {
          memberships: {
            include: {
              organization: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        const randomPassword = randomUUID();
        const passwordHash = await hashPassword(randomPassword);
        const baseSlug =
          profile.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 'workspace';
        const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

        const createdUser = await prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              email: profile.email.toLowerCase(),
              fullName: profile.fullName,
              avatarUrl: profile.avatarUrl,
              passwordHash,
            },
          });

          const newOrg = await tx.organization.create({
            data: {
              name: `${profile.fullName}'s Workspace`,
              slug: uniqueSlug,
            },
          });

          await tx.organizationMember.create({
            data: {
              organizationId: newOrg.id,
              userId: newUser.id,
              role: OrgRole.OWNER,
            },
          });

          return tx.user.findUnique({
            where: { id: newUser.id },
            include: {
              memberships: {
                include: {
                  organization: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          });
        });

        user = createdUser;
      } else if (profile.avatarUrl && !user.avatarUrl) {
        await prisma.user.update({
          where: { id: user.id },
          data: { avatarUrl: profile.avatarUrl },
        });
      }

      if (!user) {
        throw new AppError('Failed to initialize user session', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      if (!user.isActive) {
        throw new UnauthorizedError('Account is deactivated. Please contact an administrator.');
      }

      const accessToken = generateAccessToken({ userId: user.id, email: user.email });
      const { token: rawRefreshToken, hash: tokenHash } = generateRefreshToken();

      const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      const memberships = user.memberships.map((m) => ({
        organizationId: m.organization.id,
        organizationName: m.organization.name,
        organizationSlug: m.organization.slug,
        role: m.role,
      }));

      logger.info({ userId: user.id, provider: normProvider }, 'OAuth authentication successful');

      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
        },
        memberships,
        accessToken,
        rawRefreshToken,
      };
    } catch (err) {
      if (process.env.NODE_ENV !== 'production' && isDbUnavailableError(err)) {
        logger.warn(
          { email: profile.email, provider: normProvider },
          '⚠️ [DEV FALLBACK] Database server is offline on port 5432. Authenticating OAuth user via in-memory development store.'
        );
        const devUser = devFallbackStore.getOrCreateUser(profile.email, profile.fullName);
        if (profile.avatarUrl) {
          devUser.avatarUrl = profile.avatarUrl;
        }
        return devFallbackStore.authenticate(profile.email);
      }
      throw err;
    }
  }
}

export const oauthService = new OAuthService();
