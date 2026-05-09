import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import type { ShotSize, ShotAngle, ShotMovement, ShotModel } from '@media-creator/shared';
import { Project } from '../../project/entities/project.entity';
import { GenerationTask } from './generation-task.entity';

@Entity('shots')
export class Shot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @ManyToOne(() => Project, (project) => project.shots, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ type: 'int' })
  order: number;

  @Column({ type: 'text', default: '' })
  prompt: string;

  @Column({ length: 50, default: 'medium' })
  shotSize: ShotSize;

  @Column({ length: 50, default: 'eye-level' })
  angle: ShotAngle;

  @Column({ length: 50, default: 'static' })
  movement: ShotMovement;

  @Column({ type: 'float', default: 5 })
  duration: number;

  @Column({ type: 'text', array: true, default: '{}' })
  requiredElements: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  forbiddenElements: string[];

  @Column({ nullable: true, length: 500, name: 'character_ref' })
  characterRef: string;

  @Column({ nullable: true, length: 500, name: 'scene_ref' })
  sceneRef: string;

  @Column({ length: 50, default: 'seedance-2.0' })
  model: ShotModel;

  @Column({ length: 10, default: '16:9', name: 'aspect_ratio' })
  aspectRatio: string;

  @Column({ length: 10, default: '1080p' })
  resolution: string;

  @OneToOne(() => GenerationTask, (task) => task.shot, { cascade: true })
  generationTask: GenerationTask;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
