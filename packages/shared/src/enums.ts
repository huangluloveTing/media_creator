export type ProjectStatus = 'draft' | 'generating' | 'ready_to_merge' | 'merging' | 'completed';

export type ShotSize = 'extreme-wide' | 'wide' | 'medium' | 'close-up' | 'extreme-close-up';

export type ShotAngle = 'eye-level' | 'low' | 'high' | 'dutch' | 'aerial';

export type ShotMovement = 'static' | 'pan' | 'tilt' | 'dolly' | 'zoom' | 'handheld';

export type ShotModel = 'seedance-2.0' | 'seedance-2.0-fast' | 'seedance-1.5-pro';

export type TransitionType = 'cut' | 'dissolve' | 'fade' | 'wipe' | 'none';

export type TaskStatus = 'draft' | 'queued' | 'generating' | 'completed' | 'failed';
