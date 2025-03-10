import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PolicyEffect {
  ALLOW = 'allow',
  DENY = 'deny',
}

@Entity('policies')
export class Policy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({ type: 'jsonb' })
  conditions: Record<string, any>;

  @Column({
    type: 'enum',
    enum: PolicyEffect,
    default: PolicyEffect.ALLOW,
  })
  effect: PolicyEffect;

  @Column({ type: 'jsonb' })
  resources: string[];

  @Column({ type: 'jsonb' })
  actions: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
