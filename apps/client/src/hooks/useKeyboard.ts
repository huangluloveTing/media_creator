import { useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { api } from '../api/client';

export function useKeyboard() {
  const { state, dispatch } = useProject();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      // Delete: remove selected shot
      if (e.key === 'Backspace' || e.key === 'Delete') {
        if (state.selectedElementType === 'shot' && state.selectedElementId) {
          e.preventDefault();
          handleDelete();
        }
      }

      // Escape: deselect
      if (e.key === 'Escape') {
        dispatch({ type: 'DESELECT' });
      }
    };

    const handleDelete = async () => {
      if (!state.project || !state.selectedElementId) return;
      try {
        await api.deleteShot(state.selectedElementId);
        const full = await api.getProjectFull(state.project.id);
        dispatch({ type: 'SET_PROJECT', payload: full });
        dispatch({ type: 'DESELECT' });
      } catch (err: any) {
        alert(`Delete failed: ${err.message}`);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state.selectedElementId, state.selectedElementType, state.project, dispatch]);
}
