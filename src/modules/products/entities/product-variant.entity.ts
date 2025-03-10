import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('product_variants')
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  compareAtPrice: number;

  @Column({ default: 0 })
  quantity: number;

  @Column({ nullable: true })
  sku: string;

  @Column({ nullable: true })
  barcode: string;

  @Column({ type: 'jsonb' })
  options: { name: string; value: string }[];

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ default: 0 })
  weight: number;

  @Column({ nullable: true })
  weightUnit: string;

  @Column({ default: 0 })
  length: number;

  @Column({ default: 0 })
  width: number;

  @Column({ default: 0 })
  height: number;

  @Column({ nullable: true })
  dimensionUnit: string;

  @ManyToOne(() => Product, (product) => product.variants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'product_id' })
  productId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
