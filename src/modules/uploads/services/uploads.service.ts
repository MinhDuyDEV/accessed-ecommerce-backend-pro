import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import { v4 as uuid } from 'uuid';
import { Upload, UploadType } from '../entities/upload.entity';
import { UploadFileDto } from '../dto/upload-file.dto';

@Injectable()
export class UploadsService {
  private s3: S3;

  constructor(
    @InjectRepository(Upload)
    private readonly uploadRepository: Repository<Upload>,
    private readonly configService: ConfigService,
  ) {
    this.s3 = new S3({
      accessKeyId: this.configService.get('aws.s3.accessKeyId'),
      secretAccessKey: this.configService.get('aws.s3.secretAccessKey'),
      region: this.configService.get('aws.s3.region'),
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    uploadFileDto?: UploadFileDto,
  ): Promise<Upload> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Validate file type
    this.validateFileType(file.mimetype, uploadFileDto?.type);

    // Validate file size
    this.validateFileSize(file.size, uploadFileDto?.type);

    // Generate unique key for S3
    const fileExtension = file.originalname.split('.').pop();
    const key = `${uploadFileDto?.type || 'general'}/${uuid()}.${fileExtension}`;

    // Upload to S3
    const uploadResult = await this.s3
      .upload({
        Bucket: this.configService.get('aws.s3.bucket'),
        Body: file.buffer,
        Key: key,
        ContentType: file.mimetype,
        ACL: 'public-read',
      })
      .promise();

    // Create upload record in database
    const upload = this.uploadRepository.create({
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      key,
      url: uploadResult.Location,
      type: uploadFileDto?.type || UploadType.GENERAL,
      userId,
      relatedId: uploadFileDto?.relatedId,
      relatedType: uploadFileDto?.relatedType,
    });

    return this.uploadRepository.save(upload);
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    userId: string,
    uploadFileDto?: UploadFileDto,
  ): Promise<Upload[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('Files are required');
    }

    const uploadPromises = files.map((file) =>
      this.uploadFile(file, userId, uploadFileDto),
    );

    return Promise.all(uploadPromises);
  }

  async findAll(userId?: string): Promise<Upload[]> {
    const query = this.uploadRepository.createQueryBuilder('upload');

    if (userId) {
      query.where('upload.userId = :userId', { userId });
    }

    return query.orderBy('upload.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Upload> {
    const upload = await this.uploadRepository.findOne({
      where: { id },
    });

    if (!upload) {
      throw new NotFoundException(`Upload with ID ${id} not found`);
    }

    return upload;
  }

  async findByRelated(
    relatedId: string,
    relatedType: string,
  ): Promise<Upload[]> {
    return this.uploadRepository.find({
      where: { relatedId, relatedType },
      order: { createdAt: 'DESC' },
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const upload = await this.findOne(id);

    // Check if user owns the upload
    if (upload.userId && upload.userId !== userId) {
      throw new BadRequestException(
        'You do not have permission to delete this upload',
      );
    }

    // Delete from S3
    await this.s3
      .deleteObject({
        Bucket: this.configService.get('aws.s3.bucket'),
        Key: upload.key,
      })
      .promise();

    // Delete from database
    await this.uploadRepository.remove(upload);
  }

  private validateFileType(mimeType: string, type?: UploadType): void {
    const allowedImageTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    // For product images, only allow image types
    if (
      type === UploadType.PRODUCT_IMAGE &&
      !allowedImageTypes.includes(mimeType)
    ) {
      throw new BadRequestException(
        'Only image files are allowed for product images',
      );
    }

    // For shop logo and banner, only allow image types
    if (
      (type === UploadType.SHOP_LOGO || type === UploadType.SHOP_BANNER) &&
      !allowedImageTypes.includes(mimeType)
    ) {
      throw new BadRequestException(
        'Only image files are allowed for shop logo and banner',
      );
    }

    // For category image, only allow image types
    if (
      type === UploadType.CATEGORY_IMAGE &&
      !allowedImageTypes.includes(mimeType)
    ) {
      throw new BadRequestException(
        'Only image files are allowed for category image',
      );
    }

    // For user avatar, only allow image types
    if (
      type === UploadType.USER_AVATAR &&
      !allowedImageTypes.includes(mimeType)
    ) {
      throw new BadRequestException(
        'Only image files are allowed for user avatar',
      );
    }
  }

  private validateFileSize(size: number, type?: UploadType): void {
    const MB = 1024 * 1024;

    // For product images, limit to 5MB
    if (type === UploadType.PRODUCT_IMAGE && size > 5 * MB) {
      throw new BadRequestException('Product images cannot exceed 5MB');
    }

    // For shop logo, limit to 2MB
    if (type === UploadType.SHOP_LOGO && size > 2 * MB) {
      throw new BadRequestException('Shop logo cannot exceed 2MB');
    }

    // For shop banner, limit to 5MB
    if (type === UploadType.SHOP_BANNER && size > 5 * MB) {
      throw new BadRequestException('Shop banner cannot exceed 5MB');
    }

    // For category image, limit to 2MB
    if (type === UploadType.CATEGORY_IMAGE && size > 2 * MB) {
      throw new BadRequestException('Category image cannot exceed 2MB');
    }

    // For user avatar, limit to 2MB
    if (type === UploadType.USER_AVATAR && size > 2 * MB) {
      throw new BadRequestException('User avatar cannot exceed 2MB');
    }

    // General limit for all files is 10MB
    if (size > 10 * MB) {
      throw new BadRequestException('Files cannot exceed 10MB');
    }
  }
}
