import { Request, Response } from 'express';
import { CookieOptions } from 'express';
import { authService } from './auth.service.js';
import { HttpStatus } from '../../constants/http-status.js';
import { env } from '../../config/env.js';

const REFRESH_COOKIE_NAME = 'refreshToken';
const isProduction = env.NODE_ENV === 'production';
const sameSiteSetting = (env.COOKIE_SAME_SITE || (isProduction ? 'strict' : 'lax')) as 'strict' | 'lax' | 'none';
const secureSetting = env.COOKIE_SECURE !== undefined ? env.COOKIE_SECURE : isProduction;

const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: secureSetting,
  sameSite: sameSiteSetting,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api',
  ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
};

export class AuthController {
  public async register(req: Request, res: Response): Promise<void> {
    const result = await authService.register(req.body);

    res.cookie(REFRESH_COOKIE_NAME, result.rawRefreshToken, refreshCookieOptions);

    res.status(HttpStatus.CREATED).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  }

  public async login(req: Request, res: Response): Promise<void> {
    const result = await authService.login(req.body);

    res.cookie(REFRESH_COOKIE_NAME, result.rawRefreshToken, refreshCookieOptions);

    res.status(HttpStatus.OK).json({
      success: true,
      data: {
        user: result.user,
        memberships: result.memberships,
        accessToken: result.accessToken,
      },
    });
  }

  public async refresh(req: Request, res: Response): Promise<void> {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
    const result = await authService.refresh(refreshToken);

    res.cookie(REFRESH_COOKIE_NAME, result.newRawRefreshToken, refreshCookieOptions);

    res.status(HttpStatus.OK).json({
      success: true,
      data: {
        accessToken: result.accessToken,
      },
    });
  }

  public async logout(req: Request, res: Response): Promise<void> {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
    await authService.logout(refreshToken);

    res.clearCookie(REFRESH_COOKIE_NAME, {
      ...refreshCookieOptions,
      maxAge: 0,
    });

    res.status(HttpStatus.OK).json({
      success: true,
      data: {
        message: 'Successfully logged out',
      },
    });
  }

  public async getMe(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const profile = await authService.getProfile(userId);

    res.status(HttpStatus.OK).json({
      success: true,
      data: profile,
    });
  }

  public async recover(req: Request, res: Response): Promise<void> {
    const result = await authService.recoverAccount(req.body.email);

    res.status(HttpStatus.OK).json({
      success: true,
      data: result,
    });
  }

  public async updateProfile(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const updated = await authService.updateProfile(userId, req.body);

    res.status(HttpStatus.OK).json({
      success: true,
      data: updated,
      message: 'Profile updated successfully',
    });
  }

  public async changePassword(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const result = await authService.changePassword(userId, req.body);

    res.status(HttpStatus.OK).json({
      success: true,
      data: result,
    });
  }
}

export const authController = new AuthController();
