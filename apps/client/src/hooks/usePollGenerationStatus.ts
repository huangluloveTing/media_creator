import { useEffect, useRef } from 'react';
import { useProject } from '../context/ProjectContext';
import { api } from '../api/client';

export function usePollGenerationStatus() {
  const { state, dispatch } = useProject();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!state.project) return;

    const hasActive = state.project.shots.some(
      (s) => s.generation?.status === 'queued' || s.generation?.status === 'generating',
    );

    if (hasActive) {
      intervalRef.current = setInterval(async () => {
        try {
          const full = await api.getProjectFull(state.project!.id);
          dispatch({ type: 'SET_PROJECT', payload: full });

          const stillActive = full.shots.some(
            (s) => s.generation?.status === 'queued' || s.generation?.status === 'generating',
          );
          if (!stillActive) {
            dispatch({ type: 'SET_GENERATING', payload: false });
          }
        } catch {
          // ignore polling errors
        }
      }, state.pollInterval);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [
    state.project?.id,
    state.project?.shots.some((s) => s.generation?.status === 'queued' || s.generation?.status === 'generating'),
    state.pollInterval,
    dispatch,
  ]);
}
