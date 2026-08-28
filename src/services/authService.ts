import { apiClient } from './apiClient';
import type { components } from '../types/api';

export type AuthenticationRequestDto = components['schemas']['AuthenticationRequestDto'];
export type AuthenticationResponseDto = components['schemas']['AuthenticationResponseDto'];
export type UserRequestDto = components['schemas']['UserRequestDto'];

/**
 * Servizio per la gestione dell'autenticazione e della registrazione utenti.
 * Incapsula le chiamate agli endpoint `/api/v1/auth/*`.
 */
export const authService = {
  /**
   * Effettua il login inviando le credenziali dell'utente (email e password).
   * Endpoint pubblico: non richiede token Bearer (`requiresAuth: false`).
   *
   * @param request - Credenziali di accesso (email e password)
   * @returns Token JWT di autenticazione emesso dal backend
   */
  login(request: AuthenticationRequestDto): Promise<AuthenticationResponseDto> {
    return apiClient.post<AuthenticationResponseDto>(
      '/api/v1/auth/authenticate',
      request,
      { requiresAuth: false }
    );
  },

  /**
   * Registra un nuovo utente nel sistema.
   * Endpoint protetto riservato agli amministratori (`ADMIN`).
   *
   * @param request - Dati del nuovo utente (username, email, password, type)
   * @returns Dati di risposta con il token JWT associato al nuovo utente
   */
  createUser(request: UserRequestDto): Promise<AuthenticationResponseDto> {
    return apiClient.post<AuthenticationResponseDto>(
      '/api/v1/auth/createuser',
      request
    );
  },
};
