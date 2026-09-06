import { apiClient } from './apiClient';
import type { components } from '../types/api';
import type { PageResponse } from '../types/pagination';

export type IssueRequestDto = components['schemas']['IssueRequestDto'];
export type IssueResponseDto = components['schemas']['IssueResponseDto'];
export type IssuePriority = NonNullable<IssueResponseDto['priority']>;
export type IssueState = NonNullable<IssueResponseDto['state']>;
export type IssueType = NonNullable<IssueResponseDto['type']>;

export type SortDirection = 'asc' | 'desc';

export type IssueSummaryDto = components['schemas']['IssueSummaryDto'];

/**
 * Parametri di query opzionali per il filtraggio, la ricerca e l'ordinamento delle issue.
 */
export interface IssueFilterParams {
  type?: IssueType;
  state?: IssueState;
  priority?: IssuePriority;
  assignedToId?: number;
  labelId?: number;
  search?: string;
  page?: number;
  size?: number;
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
   * Recupera la pagina delle issue di un progetto con supporto a filtri, ricerca e ordinamento.
   * Endpoint protetto (`GET /api/projects/{projectId}/issues`).
   *
   * @param projectId - ID del progetto
   * @param params - Parametri facoltativi di filtro (tipo, stato, priorità, assegnatario, label), ricerca e ordinamento
   * @returns Pagina delle issue filtrate e ordinate con metadati
   */
  getIssues(projectId: number, params?: IssueFilterParams): Promise<PageResponse<IssueResponseDto>> {
    const query = buildIssueQueryParams(params);
    const endpoint = `/api/projects/${projectId}/issues${query}`;
    return apiClient.get<PageResponse<IssueResponseDto>>(endpoint);
  },

  /**
   * Recupera il riepilogo delle metriche aggregate (KPI) delle issue per il progetto.
   * Endpoint protetto (`GET /api/projects/{projectId}/issues/summary`).
   *
   * @param projectId - ID del progetto
   * @returns Oggetto con totale ticket, aperti, bug e chiusi
   */
  getIssueSummary(projectId: number): Promise<IssueSummaryDto> {
    return apiClient.get<IssueSummaryDto>(`/api/projects/${projectId}/issues/summary`);
  },

  /**
   * Recupera una singola issue dato l'ID del progetto e l'ID della issue.
   * Endpoint protetto (`GET /api/projects/{projectId}/issues/{issueId}`).
   *
   * @param projectId - ID del progetto
   * @param issueId - ID della issue
   * @returns Issue corrispondente
   */
  getIssueById(projectId: number, issueId: number): Promise<IssueResponseDto> {
    return apiClient.get<IssueResponseDto>(`/api/projects/${projectId}/issues/${issueId}`);
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
