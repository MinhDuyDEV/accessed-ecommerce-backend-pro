import { UploadType } from '../entities/upload.entity';

export class UploadResponseDto {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  key: string;
  url: string;
  type: UploadType;
  userId?: string;
  relatedId?: string;
  relatedType?: string;
  createdAt: Date;
}
