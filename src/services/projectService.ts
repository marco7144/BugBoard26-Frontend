import { apiClient } from './apiClient';
import type { components } from '../types/api';

export type ProjectRequestDto = components['schemas']['ProjectRequestDto'];
export type ProjectResponseDto = components['schemas']['ProjectResponseDto'];
export type UserResponseDto = components['schemas']['UserResponseDto'];

/**
 * Servizio per la gestione dei progetti e dei partecipanti.
 * Incapsula le chiamate agli endpoint `/api/projects/*`.
 */
export const projectService = {
  /**
   * Recupera l'elenco di tutti i progetti registrati nel sistema.
   * Endpoint protetto (`GET /api/projects/getprojects`).
   *
   * @returns Lista di tutti i progetti con ID, nome, creator e icona
   */
  getProjects(): Promise<ProjectResponseDto[]> {
    return apiClient.get<ProjectResponseDto[]>('/api/projects/getprojects');
  },

  /**
   * Crea un nuovo progetto nel sistema.
   * Endpoint riservato agli amministratori (`POST /api/projects/createproject`).
   *
   * @param request - Dati del progetto da creare (nome e icona)
   * @returns Progetto creato con i relativi dettagli
   */
  createProject(request: ProjectRequestDto): Promise<ProjectResponseDto> {
    return apiClient.post<ProjectResponseDto>(
      '/api/projects/createproject',
      request
    );
  },

  /**
   * Recupera la lista dei partecipanti associati a un determinato progetto.
   * Endpoint protetto (`GET /api/projects/{projectId}/participants`).
   *
   * @param projectId - ID univoco del progetto
   * @returns Lista degli utenti che partecipano al progetto
   */
  getParticipants(projectId: number): Promise<UserResponseDto[]> {
    return apiClient.get<UserResponseDto[]>(
      `/api/projects/${projectId}/participants`
    );
  },

  /**
   * Aggiunge un utente come partecipante a un progetto esistente.
   * Endpoint riservato all'amministratore creatore del progetto (`POST /api/projects/{projectId}/participants`).
   *
   * @param projectId - ID univoco del progetto
   * @param userId - ID univoco dell'utente da associare
   * @returns Progetto aggiornato con i nuovi partecipanti
   */
  addParticipant(projectId: number, userId: number): Promise<ProjectResponseDto> {
    return apiClient.post<ProjectResponseDto>(
      `/api/projects/${projectId}/participants`,
      userId
    );
  },
};
