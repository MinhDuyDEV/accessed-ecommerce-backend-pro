import { SetMetadata } from '@nestjs/common';

export const POLICY_KEY = 'policy';
export const Policy = (action: string, resource: string) =>
  SetMetadata(POLICY_KEY, { action, resource });
