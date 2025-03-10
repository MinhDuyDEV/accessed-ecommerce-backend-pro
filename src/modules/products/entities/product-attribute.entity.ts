import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('product_attributes')
export class ProductAttribute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'jsonb' })
  values: string[];

  @Column({ default: false })
  isVariant: boolean;

  @Column({ default: false })
  isRequired: boolean;

  @Column({ default: false })
  isVisible: boolean;

  @Column({ default: 0 })
  order: number;

  @ManyToOne(() => Product, (product) => product.attributes, {
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
}
