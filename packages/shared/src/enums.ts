export type ProjectStatus = 'draft' | 'generating' | 'ready_to_merge' | 'merging' | 'completed';

export type ShotSize = 'extreme-wide' | 'wide' | 'medium' | 'close-up' | 'extreme-close-up';

export type ShotAngle = 'eye-level' | 'low' | 'high' | 'dutch' | 'aerial';

export type ShotMovement = 'static' | 'pan' | 'tilt' | 'dolly' | 'zoom' | 'handheld';

export type ShotModel = 'doubao-seedance-2-0-fast-260128' | 'doubao-seedance-2-0-260128';

export type TransitionType = 'cut' | 'dissolve' | 'fade' | 'wipe' | 'none';

export type TaskStatus = 'draft' | 'queued' | 'generating' | 'completed' | 'failed';
