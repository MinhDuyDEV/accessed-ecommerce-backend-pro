import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { refresh_token_public_key } from '../../../common/utils/keys.util';
import { RefreshTokenService } from '../services/refresh-token.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private refreshTokenService: RefreshTokenService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: refresh_token_public_key,
      algorithms: ['RS256'],
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    const refreshToken = req.headers.authorization.split(' ')[1];

    try {
      const token = await this.refreshTokenService.validateRefreshToken(
        payload.sub,
        refreshToken,
      );

      return token.user;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
