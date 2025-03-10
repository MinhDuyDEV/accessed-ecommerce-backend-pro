import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PolicyEvaluatorService } from '../services/policy-evaluator.service';
import { POLICY_KEY } from '../decorators/policy.decorator';

@Injectable()
export class PolicyGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private policyEvaluatorService: PolicyEvaluatorService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policyMetadata = this.reflector.getAllAndOverride<{
      action: string;
      resource: string;
    }>(POLICY_KEY, [context.getHandler(), context.getClass()]);

    if (!policyMetadata) {
      return true;
    }

    const { action, resource } = policyMetadata;
    const request = context.switchToHttp().getRequest();
    const { user } = request;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const policyContext = {
      params: request.params,
      query: request.query,
      body: request.body,
      ip: request.ip,
      method: request.method,
      path: request.path,
      timestamp: new Date(),
    };

    const isAllowed = await this.policyEvaluatorService.evaluatePolicy(
      user,
      action,
      resource,
      policyContext,
    );

    return isAllowed;
  }
}
