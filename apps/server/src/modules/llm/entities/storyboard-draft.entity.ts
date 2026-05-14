import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Project } from '../../project/entities/project.entity';

@Entity('storyboard_drafts')
@Index(['projectId', 'version'], { unique: true })
export class StoryboardDraft {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ type: 'int' })
  version: number;

  @Column({ type: 'text' })
  instruction: string;

  @Column({ name: 'storyboard_json', type: 'jsonb' })
  storyboardJson: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  summary: string | null;

  @Column({ name: 'diff_json', type: 'jsonb', nullable: true })
  diffJson: Record<string, unknown> | null;

  @Column({ name: 'character_profile_json', type: 'jsonb', nullable: true })
  characterProfileJson: Record<string, unknown> | null;

  @Column({ name: 'is_applied', type: 'boolean', default: false })
  isApplied: boolean;

  @Column({ name: 'applied_at', type: 'timestamptz', nullable: true })
  appliedAt: Date | null;

  @Column({ name: 'created_by', type: 'varchar', length: 128, default: 'system' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
