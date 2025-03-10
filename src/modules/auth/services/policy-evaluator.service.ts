import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Policy, PolicyEffect } from '../entities/policy.entity';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class PolicyEvaluatorService {
  constructor(
    @InjectRepository(Policy)
    private policyRepository: Repository<Policy>,
  ) {}

  async evaluatePolicy(
    user: User,
    action: string,
    resource: string,
    context: Record<string, any> = {},
  ): Promise<boolean> {
    // Lấy tất cả các policy liên quan đến resource và action
    const policies = await this.policyRepository.find();

    // Lọc các policy phù hợp với resource và action
    const applicablePolicies = policies.filter((policy) => {
      const resourceMatch =
        policy.resources.includes(resource) || policy.resources.includes('*');
      const actionMatch =
        policy.actions.includes(action) || policy.actions.includes('*');
      return resourceMatch && actionMatch;
    });

    if (applicablePolicies.length === 0) {
      return false; // Không có policy nào áp dụng
    }

    // Đánh giá từng policy
    for (const policy of applicablePolicies) {
      const matches = this.evaluateConditions(user, policy.conditions, context);

      if (matches) {
        // Nếu policy khớp, trả về kết quả dựa trên effect
        return policy.effect === PolicyEffect.ALLOW;
      }
    }

    return false; // Mặc định từ chối nếu không có policy nào khớp
  }

  private evaluateConditions(
    user: User,
    conditions: Record<string, any>,
    context: Record<string, any>,
  ): boolean {
    // Kết hợp user attributes và context để đánh giá
    const evaluationContext = {
      user: {
        id: user.id,
        email: user.email,
        roles: user.roles?.map((role) => role.name) || [],
        isVerifiedSeller: user.isVerifiedSeller,
        attributes: user.attributes || {},
        status: user.status,
      },
      context,
    };

    // Đánh giá các điều kiện
    try {
      return this.evaluateCondition(conditions, evaluationContext);
    } catch (error) {
      console.error('Policy evaluation error:', error);
      return false;
    }
  }

  private evaluateCondition(condition: any, context: any): boolean {
    // Xử lý các toán tử logic
    if (condition.and) {
      return condition.and.every((subCondition) =>
        this.evaluateCondition(subCondition, context),
      );
    }

    if (condition.or) {
      return condition.or.some((subCondition) =>
        this.evaluateCondition(subCondition, context),
      );
    }

    if (condition.not) {
      return !this.evaluateCondition(condition.not, context);
    }

    // Xử lý các toán tử so sánh
    if (condition.eq) {
      const [path, value] = condition.eq;
      return this.getValueByPath(context, path) === value;
    }

    if (condition.gt) {
      const [path, value] = condition.gt;
      return this.getValueByPath(context, path) > value;
    }

    if (condition.lt) {
      const [path, value] = condition.lt;
      return this.getValueByPath(context, path) < value;
    }

    if (condition.in) {
      const [path, values] = condition.in;
      return values.includes(this.getValueByPath(context, path));
    }

    if (condition.contains) {
      const [path, value] = condition.contains;
      const contextValue = this.getValueByPath(context, path);
      return Array.isArray(contextValue) && contextValue.includes(value);
    }

    return false;
  }

  private getValueByPath(obj: any, path: string): any {
    return path.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
  }
}
