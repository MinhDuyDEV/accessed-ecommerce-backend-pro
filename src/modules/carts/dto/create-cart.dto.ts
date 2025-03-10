import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCartDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;
}
