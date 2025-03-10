import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Policy } from '../auth/entities/policy.entity';
import { PolicyGuard } from '../auth/guards/policy.guard';
import { PolicyEvaluatorService } from '../auth/services/policy-evaluator.service';
import { PermissionCacheService } from '../auth/services/permission-cache.service';
import { Role } from '../auth/entities/role.entity';
import { Permission } from '../auth/entities/permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Policy, Role, Permission])],
  providers: [PolicyEvaluatorService, PolicyGuard, PermissionCacheService],
  exports: [PolicyEvaluatorService, PolicyGuard, PermissionCacheService],
})
export class SharedModule {}
