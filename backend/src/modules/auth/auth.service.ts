import { prisma } from '../../repositories/prisma.js';
import { hashPassword, verifyPassword } from '../../utils/password.util.js';
import { generateAccessToken, generateRefreshToken, hashToken } from '../../utils/jwt.util.js';
import { ConflictError, UnauthorizedError, NotFoundError } from '../../errors/app-error.js';
import { logger } from '../../logging/logger.js';
import { devFallbackStore, isDbUnavailableError } from '../../repositories/dev-fallback.store.js';

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface RegisterDto {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export class AuthService {
  public async register(dto: RegisterDto) {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: dto.email },
        select: { id: true },
      });

      if (existingUser) {
        throw new ConflictError('An account with this email address already exists');
      }

      const passwordHash = await hashPassword(dto.password);

      const user = await prisma.user.create({
        data: {
          email: dto.email,
          passwordHash,
          fullName: dto.fullName,
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
          createdAt: true,
        },
      });

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

      logger.info({ userId: user.id, email: user.email }, 'User registered successfully');

      return {
        user,
        accessToken,
        rawRefreshToken,
      };
    } catch (err) {
      if (process.env.NODE_ENV !== 'production' && isDbUnavailableError(err)) {
        logger.warn(
          { email: dto.email },
          '⚠️ [DEV FALLBACK] Database server is offline on port 5432. Registering account via in-memory development store.'
        );
        devFallbackStore.getOrCreateUser(dto.email, dto.fullName);
        const auth = devFallbackStore.authenticate(dto.email);
        return {
          user: auth.user,
          accessToken: auth.accessToken,
          rawRefreshToken: auth.rawRefreshToken,
        };
      }
      throw err;
    }
  }

  public async login(dto: LoginDto) {
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email: dto.email },
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
    } catch (err) {
      if (process.env.NODE_ENV !== 'production' && isDbUnavailableError(err)) {
        logger.warn(
          { email: dto.email },
          '⚠️ [DEV FALLBACK] Database server is offline on port 5432. Authenticating via in-memory development store.'
        );
        return devFallbackStore.authenticate(dto.email);
      }
      throw err;
    }

    // Return generic auth error if user does not exist
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await verifyPassword(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
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

    logger.info({ userId: user.id }, 'User logged in successfully');

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
  }

  public async refresh(refreshTokenString: string) {
    if (!refreshTokenString || typeof refreshTokenString !== 'string') {
      throw new UnauthorizedError('Refresh token required');
    }

    const tokenHash = hashToken(refreshTokenString);

    let tokenRecord;
    try {
      tokenRecord = await prisma.refreshToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      });
    } catch (err) {
      if (process.env.NODE_ENV !== 'production' && isDbUnavailableError(err)) {
        const devUser = devFallbackStore.findUserById('10000000-0000-4000-8000-000000000001') || devFallbackStore.getOrCreateUser('owner@alpha.com');
        return {
          accessToken: generateAccessToken({ userId: devUser.id, email: devUser.email }),
          newRawRefreshToken: generateRefreshToken().token,
        };
      }
      throw err;
    }

    if (!tokenRecord) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Token Replay Attack Detection: If an already revoked token is used, invalidate all sessions!
    if (tokenRecord.isRevoked) {
      logger.warn(
        { userId: tokenRecord.userId },
        'SECURITY ALERT: Revoked refresh token reuse detected! Invalidating all active tokens for user.'
      );
      await prisma.refreshToken.updateMany({
        where: { userId: tokenRecord.userId },
        data: { isRevoked: true },
      });
      throw new UnauthorizedError('Security violation detected: Refresh token reuse. All sessions have been terminated.');
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token has expired. Please log in again.');
    }

    if (!tokenRecord.user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    // Invalidate current refresh token (one-time use rotation)
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { isRevoked: true },
    });

    // Issue new rotated pair
    const accessToken = generateAccessToken({
      userId: tokenRecord.user.id,
      email: tokenRecord.user.email,
    });
    const { token: newRawRefreshToken, hash: newTokenHash } = generateRefreshToken();

    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
    await prisma.refreshToken.create({
      data: {
        userId: tokenRecord.user.id,
        tokenHash: newTokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      newRawRefreshToken,
    };
  }

  public async logout(refreshTokenString?: string): Promise<void> {
    if (refreshTokenString) {
      try {
        const tokenHash = hashToken(refreshTokenString);
        await prisma.refreshToken.updateMany({
          where: { tokenHash },
          data: { isRevoked: true },
        });
      } catch (err) {
        if (!isDbUnavailableError(err)) throw err;
      }
    }
  }

  public async getProfile(userId: string) {
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
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
    } catch (err) {
      if (process.env.NODE_ENV !== 'production' && isDbUnavailableError(err)) {
        const devUser = devFallbackStore.findUserById(userId) || devFallbackStore.getOrCreateUser('owner@alpha.com');
        return {
          user: {
            id: devUser.id,
            email: devUser.email,
            fullName: devUser.fullName,
            avatarUrl: devUser.avatarUrl,
            createdAt: devUser.createdAt,
          },
          memberships: [
            {
              organizationId: devFallbackStore.defaultOrg.id,
              organizationName: devFallbackStore.defaultOrg.name,
              organizationSlug: devFallbackStore.defaultOrg.slug,
              role: devUser.role,
            },
          ],
        };
      }
      throw err;
    }

    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      memberships: user.memberships.map((m) => ({
        organizationId: m.organization.id,
        organizationName: m.organization.name,
        organizationSlug: m.organization.slug,
        role: m.role,
      })),
    };
  }

  public async recoverAccount(email: string): Promise<{ message: string }> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (user) {
      logger.info({ userId: user.id, email: user.email }, 'Password recovery initiated');
      // In production, dispatch signed reset email token
    }

    return {
      message: 'If an account exists with this email, password recovery instructions have been sent.',
    };
  }

  public async updateProfile(
    userId: string,
    data: { fullName?: string; avatarUrl?: string | null }
  ) {
    const updateData: { fullName?: string; avatarUrl?: string | null } = {};
    if (data.fullName !== undefined) updateData.fullName = data.fullName.trim();
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    return updatedUser;
  }

  public async changePassword(
    userId: string,
    dto: { currentPassword: string; newPassword: string }
  ): Promise<{ message: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isValid = await verifyPassword(dto.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const newHash = await hashPassword(dto.newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    // Revoke all existing refresh tokens for security
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });

    logger.info({ userId }, 'User password successfully changed and sessions revoked');

    return {
      message: 'Password successfully changed. Please log in with your new credentials.',
    };
  }
}

export const authService = new AuthService();
