import { apiClient } from './apiClient';
import type { components } from '../types/api';
import type { PageResponse } from '../types/pagination';

export type UserResponseDto = components['schemas']['UserResponseDto'];

export interface UserQueryParams {
  page?: number;
  size?: number;
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

/**
 * Servizio per la gestione delle operazioni sugli utenti.
 * Incapsula le chiamate agli endpoint `/api/users/*`.
 */
export const userService = {
  /**
   * Recupera la pagina degli utenti con parametri di ricerca e paginazione opzionali.
   * Endpoint protetto (`GET /api/users`).
   */
  getUsersPaged(params?: UserQueryParams): Promise<PageResponse<UserResponseDto>> {
    const q = new URLSearchParams();
    if (params?.page !== undefined) q.set('page', String(params.page));
    if (params?.size !== undefined) q.set('size', String(params.size));
    if (params?.search) q.set('search', params.search);
    if (params?.sortBy) q.set('sortBy', params.sortBy);
    if (params?.sortDir) q.set('sortDir', params.sortDir);

    const queryStr = q.toString();
    const endpoint = queryStr ? `/api/users?${queryStr}` : '/api/users';
    return apiClient.get<PageResponse<UserResponseDto>>(endpoint);
  },

  /**
   * Recupera la lista di tutti gli utenti registrati nel sistema.
   * Endpoint protetto che richiede un token JWT valido (`Authorization: Bearer <token>`).
   *
   * @returns Lista di tutti gli utenti con ID, username, email e tipologia/ruolo
   */
  getAllUsers(): Promise<UserResponseDto[]> {
    return apiClient.get<UserResponseDto[]>('/api/users/getusers');
  },
};
