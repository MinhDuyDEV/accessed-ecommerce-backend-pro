import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers
import { AuthController } from './controllers/auth.controller';
import { RoleController } from './controllers/role.controller';
import { PermissionController } from './controllers/permission.controller';
import { PolicyController } from './controllers/policy.controller';

// Services
import { AuthService } from './services/auth.service';
import { RoleService } from './services/role.service';
import { PermissionService } from './services/permission.service';
import { PolicyService } from './services/policy.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { Policy } from './entities/policy.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { RolesGuard } from './guards/roles.guard';
import { PolicyGuard } from './guards/policy.guard';
import { UsersModule } from '../users/users.module';
import { PermissionsGuard } from './guards/permission.guard';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, Permission, Policy, RefreshToken]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    UsersModule,
    SharedModule,
  ],
  controllers: [
    AuthController,
    RoleController,
    PermissionController,
    PolicyController,
  ],
  providers: [
    AuthService,
    RoleService,
    PermissionService,
    PolicyService,
    RefreshTokenService,
    JwtStrategy,
    JwtRefreshStrategy,
    JwtAuthGuard,
    JwtRefreshGuard,
    RolesGuard,
    PermissionsGuard,
    PolicyGuard,
  ],
  exports: [
    AuthService,
    RoleService,
    PermissionService,
    PolicyService,
    RefreshTokenService,
    JwtAuthGuard,
    JwtRefreshGuard,
    RolesGuard,
    PermissionsGuard,
    PolicyGuard,
  ],
})
export class AuthModule {}
