import { apiClient } from './apiClient';
import type { components } from '../types/api';

export type LabelRequestDto = components['schemas']['LabelRequestDto'];
export type LabelResponseDto = components['schemas']['LabelResponseDto'];

/**
 * Servizio per la gestione globale delle etichette (labels).
 * Incapsula le chiamate agli endpoint `/api/labels/*`.
 */
export const labelService = {
  /**
   * Recupera tutte le etichette registrate a livello globale.
   * Endpoint protetto (`GET /api/labels`).
   *
   * @returns Lista delle etichette con ID, nome e colore HEX
   */
  getAllLabels(): Promise<LabelResponseDto[]> {
    return apiClient.get<LabelResponseDto[]>('/api/labels');
  },

  /**
   * Recupera una singola etichetta tramite il suo ID.
   * Endpoint protetto (`GET /api/labels/{id}`).
   *
   * @param id - ID dell'etichetta
   * @returns Dettagli dell'etichetta
   */
  getLabelById(id: number): Promise<LabelResponseDto> {
    return apiClient.get<LabelResponseDto>(`/api/labels/${id}`);
  },

  /**
   * Crea una nuova etichetta globale.
   * Endpoint protetto (`POST /api/labels`).
   *
   * @param request - Dati della nuova etichetta (nome e colore HEX)
   * @returns Etichetta creata
   */
  createLabel(request: LabelRequestDto): Promise<LabelResponseDto> {
    return apiClient.post<LabelResponseDto>('/api/labels', request);
  },

  /**
   * Modifica un'etichetta esistente.
   * Endpoint riservato agli amministratori (`PUT /api/labels/{id}`).
   *
   * @param id - ID dell'etichetta da modificare
   * @param request - Nuovi dati per l'etichetta
   * @returns Etichetta aggiornata
   */
  updateLabel(id: number, request: LabelRequestDto): Promise<LabelResponseDto> {
    return apiClient.put<LabelResponseDto>(`/api/labels/${id}`, request);
  },

  /**
   * Elimina un'etichetta dal sistema.
   * Endpoint riservato agli amministratori (`DELETE /api/labels/{id}`).
   *
   * @param id - ID dell'etichetta da eliminare
   */
  deleteLabel(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/labels/${id}`);
  },
};
