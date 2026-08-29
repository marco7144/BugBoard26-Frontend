import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { projectService, type ProjectResponseDto } from '../services/projectService';

export const SELECTED_PROJECT_ID_STORAGE_KEY = 'bugboard_selected_project_id';

export interface ProjectContextType {
  selectedProject: ProjectResponseDto | null;
  projects: ProjectResponseDto[];
  isLoading: boolean;
  error: string | null;
  selectProject: (project: ProjectResponseDto | null) => void;
  selectProjectById: (projectId: number) => void;
  fetchProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<ProjectResponseDto[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const selectProject = useCallback((project: ProjectResponseDto | null) => {
    setSelectedProject(project);
    if (project?.id !== undefined) {
      localStorage.setItem(SELECTED_PROJECT_ID_STORAGE_KEY, String(project.id));
    } else {
      localStorage.removeItem(SELECTED_PROJECT_ID_STORAGE_KEY);
    }
  }, []);

  const selectProjectById = useCallback(
    (projectId: number) => {
      const found = projects.find((p) => p.id === projectId);
      if (found) {
        selectProject(found);
      }
    },
    [projects, selectProject]
  );

  const applyProjectList = useCallback((projectList: ProjectResponseDto[]) => {
    setProjects(projectList);

    if (projectList.length === 0) {
      setSelectedProject(null);
      localStorage.removeItem(SELECTED_PROJECT_ID_STORAGE_KEY);
      return;
    }

    const storedIdStr = localStorage.getItem(SELECTED_PROJECT_ID_STORAGE_KEY);
    const storedId = storedIdStr ? Number(storedIdStr) : null;

    // 1. Prova a ripristinare il progetto salvato in localStorage
    if (storedId !== null) {
      const matched = projectList.find((p) => p.id === storedId);
      if (matched) {
        setSelectedProject(matched);
        return;
      }
    }

    // 2. Se il progetto attualmente selezionato è ancora nella lista, aggiornalo con i dati freschi
    setSelectedProject((prev) => {
      if (prev?.id !== undefined) {
        const matched = projectList.find((p) => p.id === prev.id);
        if (matched) {
          return matched;
        }
      }
      // 3. Altrimenti seleziona il primo progetto della lista
      const first = projectList[0];
      if (first?.id !== undefined) {
        localStorage.setItem(SELECTED_PROJECT_ID_STORAGE_KEY, String(first.id));
      }
      return first;
    });
  }, []);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await projectService.getProjects();
      const projectList = Array.isArray(data) ? data : [];
      applyProjectList(projectList);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore durante il recupero dei progetti';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [applyProjectList]);

  // Carica i progetti all'avvio o al login
  useEffect(() => {
    let isMounted = true;

    if (isAuthenticated) {
      projectService
        .getProjects()
        .then((data) => {
          if (!isMounted) return;
          const projectList = Array.isArray(data) ? data : [];
          applyProjectList(projectList);
        })
        .catch((err) => {
          if (!isMounted) return;
          const message = err instanceof Error ? err.message : 'Errore durante il recupero dei progetti';
          setError(message);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, applyProjectList]);

  // Reset dello stato al logout
  useEffect(() => {
    if (!isAuthenticated) {
      const storedIdStr = localStorage.getItem(SELECTED_PROJECT_ID_STORAGE_KEY);
      if (storedIdStr) {
        localStorage.removeItem(SELECTED_PROJECT_ID_STORAGE_KEY);
      }
    }
  }, [isAuthenticated]);

  const value = useMemo<ProjectContextType>(
    () => ({
      selectedProject: isAuthenticated ? selectedProject : null,
      projects: isAuthenticated ? projects : [],
      isLoading,
      error,
      selectProject,
      selectProjectById,
      fetchProjects,
    }),
    [isAuthenticated, selectedProject, projects, isLoading, error, selectProject, selectProjectById, fetchProjects]
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProject deve essere utilizzato all'interno di un ProjectProvider");
  }
  return context;
};
