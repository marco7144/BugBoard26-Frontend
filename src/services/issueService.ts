import { apiClient } from './apiClient';
import type { components } from '../types/api';

export type IssueRequestDto = components['schemas']['IssueRequestDto'];
export type IssueResponseDto = components['schemas']['IssueResponseDto'];
export type IssuePriority = NonNullable<IssueResponseDto['priority']>;
export type IssueState = NonNullable<IssueResponseDto['state']>;
export type IssueType = NonNullable<IssueResponseDto['type']>;

export type SortDirection = 'asc' | 'desc';

/**
 * Parametri di query opzionali per il filtraggio e l'ordinamento delle issue.
 */
export interface IssueFilterParams {
  type?: IssueType;
  state?: IssueState;
  priority?: IssuePriority;
  assignedToId?: number;
  labelId?: number;
  sortBy?: string;
  sortDir?: SortDirection;
}

/**
 * Converte l'oggetto dei parametri di filtro in una query string URL formattata.
 */
function buildIssueQueryParams(params?: IssueFilterParams): string {
  if (!params) {
    return '';
  }

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Servizio per la gestione delle issue, dei filtri, delle transizioni di stato e delle assegnazioni.
 * Incapsula le chiamate agli endpoint `/api/projects/{projectId}/issues/*`.
 */
export const issueService = {
  /**
   * Recupera l'elenco delle issue di un progetto con supporto a filtri e ordinamento.
   * Endpoint protetto (`GET /api/projects/{projectId}/issues`).
   *
   * @param projectId - ID del progetto
   * @param params - Parametri facoltativi di filtro (tipo, stato, priorità, assegnatario, label) e ordinamento
   * @returns Lista delle issue filtrate e ordinate
   */
  getIssues(projectId: number, params?: IssueFilterParams): Promise<IssueResponseDto[]> {
    const query = buildIssueQueryParams(params);
    const endpoint = `/api/projects/${projectId}/issues${query}`;
    return apiClient.get<IssueResponseDto[]>(endpoint);
  },

  /**
   * Recupera una singola issue dato l'ID del progetto e l'ID della issue.
   *
   * @param projectId - ID del progetto
   * @param issueId - ID della issue
   * @returns Issue corrispondente o undefined se non trovata
   */
  async getIssueById(projectId: number, issueId: number): Promise<IssueResponseDto | undefined> {
    const issues = await this.getIssues(projectId);
    return issues.find((issue) => issue.id === issueId);
  },

  /**
   * Crea una nuova issue all'interno di un progetto.
   * Endpoint protetto (`POST /api/projects/{projectId}/issues/createissue`).
   *
   * @param projectId - ID del progetto
   * @param request - Dati della nuova issue (titolo, descrizione, priorità, tipo, immagine, labelIds)
   * @returns Issue creata
   */
  createIssue(projectId: number, request: IssueRequestDto): Promise<IssueResponseDto> {
    return apiClient.post<IssueResponseDto>(
      `/api/projects/${projectId}/issues/createissue`,
      request
    );
  },

  /**
   * Modifica i dettagli di una issue esistente (titolo, descrizione, priorità, tipo).
   * Endpoint protetto (`PUT /api/projects/{projectId}/issues/{issueId}`).
   *
   * @param projectId - ID del progetto
   * @param issueId - ID della issue
   * @param request - Dati aggiornati della issue
   * @returns Issue modificata
   */
  updateIssue(projectId: number, issueId: number, request: IssueRequestDto): Promise<IssueResponseDto> {
    return apiClient.put<IssueResponseDto>(
      `/api/projects/${projectId}/issues/${issueId}`,
      request
    );
  },

  /**
   * Promuove lo stato della issue verso il passo successivo (es. TO-DO -> INPROGRESS -> CLOSED).
   * Endpoint protetto basato su State pattern (`PATCH /api/projects/{projectId}/issues/{issueId}/promote`).
   *
   * @param projectId - ID del progetto
   * @param issueId - ID della issue
   * @returns Issue con lo stato aggiornato
   */
  promoteIssue(projectId: number, issueId: number): Promise<IssueResponseDto> {
    return apiClient.patch<IssueResponseDto>(
      `/api/projects/${projectId}/issues/${issueId}/promote`
    );
  },

  /**
   * Retrocede lo stato della issue verso il passo precedente (es. CLOSED -> INPROGRESS -> TO-DO).
   * Endpoint protetto basato su State pattern (`PATCH /api/projects/{projectId}/issues/{issueId}/demote`).
   *
   * @param projectId - ID del progetto
   * @param issueId - ID della issue
   * @returns Issue con lo stato aggiornato
   */
  demoteIssue(projectId: number, issueId: number): Promise<IssueResponseDto> {
    return apiClient.patch<IssueResponseDto>(
      `/api/projects/${projectId}/issues/${issueId}/demote`
    );
  },

  /**
   * Assegna la issue a un partecipante del progetto.
   * Endpoint protetto riservato agli amministratori (`PATCH /api/projects/{projectId}/issues/{issueId}/assign/{userId}`).
   *
   * @param projectId - ID del progetto
   * @param issueId - ID della issue
   * @param userId - ID dell'utente partecipante a cui assegnare la issue
   * @returns Issue aggiornata con il nuovo assegnatario
   */
  assignIssue(projectId: number, issueId: number, userId: number): Promise<IssueResponseDto> {
    return apiClient.patch<IssueResponseDto>(
      `/api/projects/${projectId}/issues/${issueId}/assign/${userId}`
    );
  },

  /**
   * Associa un'etichetta alla issue.
   * Endpoint protetto (`POST /api/projects/{projectId}/issues/{issueId}/labels/{labelId}`).
   *
   * @param projectId - ID del progetto
   * @param issueId - ID della issue
   * @param labelId - ID dell'etichetta da aggiungere
   * @returns Issue con l'etichetta associata
   */
  addLabelToIssue(projectId: number, issueId: number, labelId: number): Promise<IssueResponseDto> {
    return apiClient.post<IssueResponseDto>(
      `/api/projects/${projectId}/issues/${issueId}/labels/${labelId}`
    );
  },

  /**
   * Rimuove un'etichetta dalla issue.
   * Endpoint protetto (`DELETE /api/projects/{projectId}/issues/{issueId}/labels/{labelId}`).
   *
   * @param projectId - ID del progetto
   * @param issueId - ID della issue
   * @param labelId - ID dell'etichetta da rimuovere
   * @returns Issue senza l'etichetta specificata
   */
  removeLabelFromIssue(projectId: number, issueId: number, labelId: number): Promise<IssueResponseDto> {
    return apiClient.delete<IssueResponseDto>(
      `/api/projects/${projectId}/issues/${issueId}/labels/${labelId}`
    );
  },

  /**
   * Imposta in blocco l'insieme delle etichette per una issue.
   * Endpoint protetto (`PUT /api/projects/{projectId}/issues/{issueId}/labels`).
   *
   * @param projectId - ID del progetto
   * @param issueId - ID della issue
   * @param labelIds - Array di ID delle etichette da impostare
   * @returns Issue con le etichette aggiornate
   */
  setIssueLabels(projectId: number, issueId: number, labelIds: number[]): Promise<IssueResponseDto> {
    return apiClient.put<IssueResponseDto>(
      `/api/projects/${projectId}/issues/${issueId}/labels`,
      labelIds
    );
  },
};
