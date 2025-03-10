import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum UploadType {
  PRODUCT_IMAGE = 'product_image',
  SHOP_LOGO = 'shop_logo',
  SHOP_BANNER = 'shop_banner',
  CATEGORY_IMAGE = 'category_image',
  USER_AVATAR = 'user_avatar',
  GENERAL = 'general',
}

@Entity('uploads')
export class Upload {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column()
  size: number;

  @Column()
  key: string;

  @Column()
  url: string;

  @Column({
    type: 'enum',
    enum: UploadType,
    default: UploadType.GENERAL,
  })
  type: UploadType;

  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  relatedId: string;

  @Column({ nullable: true })
  relatedType: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
