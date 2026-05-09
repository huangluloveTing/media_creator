import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import type { ProjectStatus } from '@media-creator/shared';
import { Shot } from '../../shot/entities/shot.entity';
import { Edge } from '../../shot/entities/edge.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ length: 20, default: '1920x1080' })
  resolution: string;

  @Column({ default: 24 })
  fps: number;

  @Column({ length: 50, default: 'dissolve' })
  defaultTransitionType: string;

  @Column({ type: 'float', default: 0.5 })
  defaultTransitionDuration: number;

  @Column({ type: 'text', default: '' })
  globalStylePrompt: string;

  @Column({ length: 500, default: './output' })
  outputDir: string;

  @Column({ type: 'float', default: 0.3, name: 'bgm_volume' })
  bgmVolume: number;

  @Column({ type: 'float', default: 1.0, name: 'original_volume' })
  originalVolume: number;

  @Column({ length: 500, nullable: true, name: 'bgm_path' })
  bgmPath: string;

  @Column({
    length: 30,
    default: 'draft',
  })
  status: ProjectStatus;

  @OneToMany(() => Shot, (shot) => shot.project, { cascade: true })
  shots: Shot[];

  @OneToMany(() => Edge, (edge) => edge.project, { cascade: true })
  edges: Edge[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
