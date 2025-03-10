import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Get,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/auth/register.dto';
import { LoginDto } from '../dto/auth/login.dto';
import { JwtRefreshGuard } from '../guards/jwt-refresh.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { User } from 'src/modules/users/entities/user.entity';
import { RefreshTokenDto } from '../dto/auth/refresh-token.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    return this.authService.login(loginDto, req);
  }

  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refreshTokens(
    @CurrentUser() user: User,
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() req: Request,
  ) {
    return this.authService.refreshTokens(
      user.id,
      refreshTokenDto.refreshToken,
      req,
    );
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@CurrentUser() user: User) {
    return this.authService.logout(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@CurrentUser() user: User) {
    return user;
  }
}
