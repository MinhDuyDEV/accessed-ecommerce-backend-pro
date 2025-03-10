import { Module } from '@nestjs/common';
import { PolicyEvaluatorService } from '../auth/services/policy-evaluator.service';
import { PolicyGuard } from '../auth/guards/policy.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Policy } from '../auth/entities/policy.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Policy])],
  providers: [PolicyEvaluatorService, PolicyGuard],
  exports: [PolicyEvaluatorService, PolicyGuard],
})
export class SharedModule {}
