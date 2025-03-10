import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { UploadType } from '../entities/upload.entity';

export class UploadFileDto {
  @IsEnum(UploadType)
  @IsOptional()
  type?: UploadType;

  @IsString()
  @IsOptional()
  relatedType?: string;

  @IsUUID()
  @IsOptional()
  relatedId?: string;
}
