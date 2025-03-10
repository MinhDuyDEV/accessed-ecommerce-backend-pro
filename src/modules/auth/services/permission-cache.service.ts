import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';

@Injectable()
export class PermissionCacheService {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async getUserPermissions(userId: string): Promise<string[]> {
    const cacheKey = `user_permissions:${userId}`;

    // Kiểm tra cache
    const cachedPermissions = await this.redisClient.get(cacheKey);
    if (cachedPermissions) {
      return JSON.parse(cachedPermissions);
    }

    // Lấy từ database bằng query trực tiếp thay vì qua UsersService
    const roles = await this.roleRepository
      .createQueryBuilder('role')
      .innerJoinAndSelect('role.permissions', 'permission')
      .innerJoin('role.users', 'user')
      .where('user.id = :userId', { userId })
      .getMany();

    const permissions = new Set<string>();

    for (const role of roles) {
      for (const permission of role.permissions || []) {
        permissions.add(permission.code);
      }
    }

    const permissionsArray = Array.from(permissions);

    // Lưu vào cache với TTL 1 giờ
    await this.redisClient.setex(
      cacheKey,
      3600,
      JSON.stringify(permissionsArray),
    );

    return permissionsArray;
  }

  async hasPermission(
    userId: string,
    requiredPermission: string,
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(requiredPermission);
  }

  async hasPermissions(
    userId: string,
    requiredPermissions: string[],
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return requiredPermissions.every((permission) =>
      permissions.includes(permission),
    );
  }

  async invalidateUserPermissions(userId: string): Promise<void> {
    const cacheKey = `user_permissions:${userId}`;
    await this.redisClient.del(cacheKey);
  }
}
