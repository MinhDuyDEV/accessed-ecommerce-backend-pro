import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsObject,
  IsArray,
} from 'class-validator';
import { PolicyEffect } from '../../entities/policy.entity';

export class CreatePolicyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsObject()
  @IsNotEmpty()
  conditions: Record<string, any>;

  @IsEnum(PolicyEffect)
  @IsNotEmpty()
  effect: PolicyEffect;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  resources: string[];

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  actions: string[];
}
