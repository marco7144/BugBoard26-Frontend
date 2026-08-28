import { apiClient } from './apiClient';
import type { components } from '../types/api';

export type UserResponseDto = components['schemas']['UserResponseDto'];

/**
 * Servizio per la gestione delle operazioni sugli utenti.
 * Incapsula le chiamate agli endpoint `/api/users/*`.
 */
export const userService = {
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
