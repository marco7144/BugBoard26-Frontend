import { apiClient } from './apiClient';
import type { components } from '../types/api';

export type CommentRequestDto = components['schemas']['CommentRequestDto'];
export type CommentResponseDto = components['schemas']['CommentResponseDto'];

/**
 * Servizio per la gestione dei commenti sulle issue.
 * Incapsula le chiamate agli endpoint `/api/projects/{projectId}/issues/{issueId}/comments/*`.
 */
export const commentService = {
  /**
   * Recupera l'elenco cronologico di tutti i commenti associati a una determinata issue.
   * Endpoint protetto (`GET /api/projects/{projectId}/issues/{issueId}/comments`).
   *
   * @param projectId - ID del progetto
   * @param issueId - ID della issue
   * @returns Lista dei commenti con testo, data, autore e issue collegata
   */
  getComments(projectId: number, issueId: number): Promise<CommentResponseDto[]> {
    return apiClient.get<CommentResponseDto[]>(
      `/api/projects/${projectId}/issues/${issueId}/comments`
    );
  },

  /**
   * Invia un nuovo commento per una determinata issue.
   * Endpoint protetto (`POST /api/projects/{projectId}/issues/{issueId}/comments`).
   *
   * @param projectId - ID del progetto
   * @param issueId - ID della issue
   * @param request - Corpo del commento (body)
   * @returns Commento creato con autore e timestamp
   */
  addComment(
    projectId: number,
    issueId: number,
    request: CommentRequestDto
  ): Promise<CommentResponseDto> {
    return apiClient.post<CommentResponseDto>(
      `/api/projects/${projectId}/issues/${issueId}/comments`,
      request
    );
  },
};
