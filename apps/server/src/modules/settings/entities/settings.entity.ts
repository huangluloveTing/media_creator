import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('settings')
export class Setting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 })
  key: string;

  @Column({ type: 'text', default: '' })
  value: string;

  @Column({ length: 50, default: 'general' })
  provider: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
