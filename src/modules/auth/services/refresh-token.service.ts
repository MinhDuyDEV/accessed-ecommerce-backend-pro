import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { User } from '../../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { refresh_token_private_key } from '../../../common/utils/keys.util';

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async createRefreshToken(
    user: User,
    req: Request,
  ): Promise<{ token: string; expiresAt: Date; expiresIn: number }> {
    // Tạo token string
    const expiresIn = this.configService.get<string>('jwt.refresh.expiresIn');
    const expiresInSeconds = this.parseExpiresIn(expiresIn);

    const tokenPayload = {
      sub: user.id,
      email: user.email,
    };

    const token = await this.jwtService.signAsync(tokenPayload, {
      privateKey: refresh_token_private_key,
      algorithm: 'RS256',
      expiresIn,
    });

    // Tính thời gian hết hạn
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresInSeconds);

    // Lưu token vào database
    const refreshToken = this.refreshTokenRepository.create({
      user,
      userId: user.id,
      token, // Sẽ được hash trong BeforeInsert
      expiresAt,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    await this.refreshTokenRepository.save(refreshToken);

    return { token, expiresAt, expiresIn: expiresInSeconds };
  }

  async validateRefreshToken(
    userId: string,
    token: string,
  ): Promise<RefreshToken> {
    // Tìm tất cả refresh tokens của user
    const refreshTokens = await this.refreshTokenRepository.find({
      where: { userId, isRevoked: false },
      relations: ['user', 'user.roles', 'user.roles.permissions'],
    });

    // Kiểm tra từng token
    for (const refreshToken of refreshTokens) {
      // Kiểm tra token có hết hạn không
      if (refreshToken.isExpired()) {
        await this.refreshTokenRepository.update(refreshToken.id, {
          isRevoked: true,
        });
        continue;
      }

      // So sánh token
      const isValid = await refreshToken.compareToken(token);
      if (isValid) {
        return refreshToken;
      }
    }

    throw new UnauthorizedException('Invalid refresh token');
  }

  async revokeRefreshToken(id: string): Promise<void> {
    await this.refreshTokenRepository.update(id, { isRevoked: true });
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
  }

  async deleteExpiredTokens(): Promise<void> {
    const now = new Date();
    await this.refreshTokenRepository.delete({
      expiresAt: LessThan(now),
    });
  }

  private parseExpiresIn(expiresIn: string): number {
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1), 10);

    switch (unit) {
      case 'd':
        return value * 24 * 60 * 60;
      case 'h':
        return value * 60 * 60;
      case 'm':
        return value * 60;
      case 's':
        return value;
      default:
        return 7 * 24 * 60 * 60;
    }
  }
}
