import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/modules/users/services/users.service';
import { RefreshTokenService } from './refresh-token.service';
import { Role } from '../entities/role.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { TokensDto } from '../dto/auth/tokens.dto';
import { LoginDto } from '../dto/auth/login.dto';
import { RegisterDto } from '../dto/auth/register.dto';
import { access_token_private_key } from 'src/common/utils';
import { Request } from 'express';
import { PermissionCacheService } from './permission-cache.service';
import { CartsService } from 'src/modules/carts/carts.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private refreshTokenService: RefreshTokenService,
    private permissionCacheService: PermissionCacheService,
    private cartsService: CartsService,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    try {
      const user = await this.usersService.findByEmail(email);
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (isPasswordValid) {
        return user;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  async login(loginDto: LoginDto, req: Request): Promise<TokensDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Merge giỏ hàng nếu có sessionId
    if (loginDto.sessionId) {
      await this.cartsService.mergeCartsOnLogin(loginDto.sessionId, user.id);
    }

    return this.generateTokens(user, req);
  }

  async register(registerDto: RegisterDto): Promise<User> {
    try {
      // Tạo user mới
      const user = await this.usersService.create(registerDto);

      // Gán role mặc định (customer)
      const customerRole = await this.roleRepository.findOne({
        where: { name: 'customer' },
      });

      if (customerRole) {
        user.roles = [customerRole];
        await this.usersService.save(user);
      }

      return user;
    } catch (error) {
      if (error.message.includes('already exists')) {
        throw new BadRequestException('Email already registered');
      }
      throw error;
    }
  }

  async refreshTokens(
    userId: string,
    refreshToken: string,
    req: Request,
  ): Promise<TokensDto> {
    try {
      const token = await this.refreshTokenService.validateRefreshToken(
        userId,
        refreshToken,
      );
      return this.generateTokens(token.user, req);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    await this.refreshTokenService.revokeAllUserRefreshTokens(userId);
  }

  private async generateTokens(user: User, req: Request): Promise<TokensDto> {
    // Lấy user với roles để đưa vào token
    const userWithRoles = await this.usersService.findOneWithRoles(user.id);

    // Tạo danh sách roles cho token
    const roles = userWithRoles.roles.map((role) => role.name);

    // Tạo danh sách permissions và lưu vào Redis
    const permissions = new Set<string>();
    for (const role of userWithRoles.roles) {
      for (const permission of role.permissions || []) {
        permissions.add(permission.code);
      }
    }

    // Lưu permissions vào Redis
    // Trước tiên, xóa cache cũ nếu có
    await this.permissionCacheService.invalidateUserPermissions(user.id);

    // Lưu permissions mới vào Redis bằng cách gọi getUserPermissions
    await this.permissionCacheService.getUserPermissions(user.id);

    // Token chỉ chứa thông tin cần thiết (không chứa permissions)
    const payload = {
      sub: user.id,
      email: user.email,
      roles, // Vẫn giữ roles vì thường ít hơn permissions
      isVerifiedSeller: user.isVerifiedSeller,
    };

    const expiresIn = this.configService.get<string>('jwt.access.expiresIn');
    const expiresInSeconds = this.parseExpiresIn(expiresIn);

    const accessToken = await this.jwtService.signAsync(payload, {
      privateKey: access_token_private_key,
      algorithm: 'RS256',
      expiresIn,
    });

    const refreshTokenData = await this.refreshTokenService.createRefreshToken(
      user,
      req,
    );

    return {
      accessToken,
      refreshToken: refreshTokenData.token,
      expiresIn: expiresInSeconds,
      refreshExpiresIn: refreshTokenData.expiresIn,
    };
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
        return 15 * 60;
    }
  }
}
