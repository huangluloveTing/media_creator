import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react';
import type { ProjectFull } from '../types';

interface ProjectState {
  project: ProjectFull | null;
  selectedElementId: string | null;
  selectedElementType: 'shot' | 'edge' | 'start' | 'merge' | 'character' | null;
  isGenerating: boolean;
  pollInterval: number;
}

type Action =
  | { type: 'SET_PROJECT'; payload: ProjectFull }
  | { type: 'UPDATE_PROJECT'; payload: Partial<ProjectFull> }
  | { type: 'SELECT_ELEMENT'; payload: { id: string; type: ProjectState['selectedElementType'] } }
  | { type: 'DESELECT' }
  | { type: 'SET_GENERATING'; payload: boolean }
  | { type: 'SET_POLL_INTERVAL'; payload: number };

function reducer(state: ProjectState, action: Action): ProjectState {
  switch (action.type) {
    case 'SET_PROJECT':
      return { ...state, project: action.payload };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        project: state.project ? { ...state.project, ...action.payload } : null,
      };
    case 'SELECT_ELEMENT':
      return {
        ...state,
        selectedElementId: action.payload.id,
        selectedElementType: action.payload.type,
      };
    case 'DESELECT':
      return { ...state, selectedElementId: null, selectedElementType: null };
    case 'SET_GENERATING':
      return { ...state, isGenerating: action.payload };
    case 'SET_POLL_INTERVAL':
      return { ...state, pollInterval: action.payload };
    default:
      return state;
  }
}

const initialState: ProjectState = {
  project: null,
  selectedElementId: null,
  selectedElementType: null,
  isGenerating: false,
  pollInterval: 3000,
};

const ProjectContext = createContext<{
  state: ProjectState;
  dispatch: Dispatch<Action>;
}>({ state: initialState, dispatch: () => {} });

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <ProjectContext.Provider value={{ state, dispatch }}>{children}</ProjectContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProject() {
  return useContext(ProjectContext);
}
