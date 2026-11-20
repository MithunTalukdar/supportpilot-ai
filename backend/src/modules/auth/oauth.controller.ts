import { Request, Response } from 'express';
import { CookieOptions } from 'express';
import { oauthService } from './oauth.service.js';
import { HttpStatus } from '../../constants/http-status.js';
import { BadRequestError } from '../../errors/app-error.js';
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

export class OAuthController {
  public async getUrl(req: Request, res: Response): Promise<void> {
    const provider = req.params.provider;
    const state = typeof req.query.state === 'string' ? req.query.state : undefined;

    const result = oauthService.getAuthorizationUrl(provider, state);

    res.status(HttpStatus.OK).json({
      success: true,
      data: result,
    });
  }

  public async redirect(req: Request, res: Response): Promise<void> {
    const provider = req.params.provider;
    const state = typeof req.query.state === 'string' ? req.query.state : undefined;

    const result = oauthService.getAuthorizationUrl(provider, state);

    res.redirect(result.url);
  }

  public async callback(req: Request, res: Response): Promise<void> {
    const { provider, code } = req.body;

    if (!provider || typeof provider !== 'string') {
      throw new BadRequestError('OAuth provider is required');
    }

    if (!code || typeof code !== 'string') {
      throw new BadRequestError('OAuth authorization code is required');
    }

    const result = await oauthService.handleOAuthCallback(provider, code);

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
}

export const oauthController = new OAuthController();
