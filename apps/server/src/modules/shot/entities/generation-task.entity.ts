import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import type { TaskStatus } from '@media-creator/shared';
import { Shot } from './shot.entity';

@Entity('generation_tasks')
export class GenerationTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'shot_id' })
  shotId: string;

  @OneToOne(() => Shot, (shot) => shot.generationTask, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shot_id' })
  shot: Shot;

  @Column({ nullable: true, name: 'task_id', length: 255 })
  taskId: string;

  @Column({ length: 30, default: 'draft' })
  status: TaskStatus;

  @Column({ default: 0 })
  progress: number;

  @Column({ nullable: true, type: 'text', name: 'video_url' })
  videoUrl: string;

  @Column({ nullable: true, length: 500, name: 'local_path' })
  localPath: string;

  @Column({ nullable: true, length: 500, name: 'last_frame_path' })
  lastFramePath: string;

  @Column({ nullable: true, type: 'text', name: 'error_message' })
  errorMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
