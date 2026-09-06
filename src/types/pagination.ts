/**
 * Struttura standard per le risposte paginate restituite dal Backend (PageResponseDto).
 */
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
