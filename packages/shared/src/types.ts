import type {
  ProjectStatus,
  ShotSize,
  ShotAngle,
  ShotMovement,
  ShotModel,
  TransitionType,
  TaskStatus,
} from './enums';

export type PrepNodeType = 'character' | 'world_setting' | 'story_outline';
export type PrepNodeStatus = 'drafting' | 'confirmed';

export interface CharacterProfile {
  name: string;
  appearance: string[];
  outfit: string[];
  traits: string[];
  immutable: string[];
}

export interface CharacterData {
  characters: CharacterProfile[];
}

export interface WorldSettingData {
  era: string;
  location: string;
  atmosphere: string[];
  rules: string[];
  visualStyle: string;
}

export interface StoryOutlineData {
  premise: string;
  plotBeats: string[];
  tone: string;
  targetShotCount: number;
}

export type PrepNodeData = CharacterData | WorldSettingData | StoryOutlineData;

export interface PrepNode {
  id: string;
  type: PrepNodeType;
  status: PrepNodeStatus;
  order: number;
  data: PrepNodeData;
}

export interface Project {
  id: string;
  title: string;
  resolution: string;
  fps: number;
  defaultTransitionType: TransitionType;
  defaultTransitionDuration: number;
  globalStylePrompt: string;
  outputDir: string;
  bgmVolume: number;
  originalVolume: number;
  bgmPath: string | null;
  finalVideoKey: string | null;
  characterProfileJson: Record<string, unknown> | null;
  prepNodes: PrepNode[];
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Shot {
  id: string;
  projectId: string;
  order: number;
  prompt: string;
  shotSize: ShotSize;
  angle: ShotAngle;
  movement: ShotMovement;
  duration: number;
  requiredElements: string[];
  forbiddenElements: string[];
  characterRef: string | null;
  sceneRef: string | null;
  model: ShotModel;
  aspectRatio: string;
  resolution: string;
  createdAt: string;
  updatedAt: string;
  generation: GenerationTask | null;
}

export interface EdgeData {
  id: string;
  sourceShotId: string | null;
  targetShotId: string | null;
  transitionType: TransitionType;
  transitionDuration: number;
  subtitleText: string | null;
  position: number;
}

export interface GenerationTask {
  id: string;
  taskId: string | null;
  status: TaskStatus;
  progress: number;
  videoUrl: string | null;
  localPath: string | null;
  lastFramePath: string | null;
  errorMessage: string | null;
}

export interface ProjectFull extends Project {
  shots: Shot[];
  edges: EdgeData[];
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  provider: string;
  updatedAt: string;
}
