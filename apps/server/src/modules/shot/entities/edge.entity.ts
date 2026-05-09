import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import type { TransitionType } from '@media-creator/shared';
import { Project } from '../../project/entities/project.entity';

@Entity('edges')
export class Edge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @ManyToOne(() => Project, (project) => project.edges, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ nullable: true, name: 'source_shot_id', type: 'varchar' })
  sourceShotId: string | null;

  @Column({ nullable: true, name: 'target_shot_id', type: 'varchar' })
  targetShotId: string | null;

  @Column({ length: 50, default: 'dissolve' })
  transitionType: TransitionType;

  @Column({ type: 'float', default: 0.5 })
  transitionDuration: number;

  @Column({ type: 'text', nullable: true, name: 'subtitle_text' })
  subtitleText: string;

  @Column({ type: 'int' })
  position: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
