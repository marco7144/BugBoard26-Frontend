import { API_BASE_URL } from '../config/api';
import { getLocalizedErrorMessage } from '../utils/errorTranslations';

/** 
 * Classe custom per gestire gli errori HTTP del backend.
 * Estende la classe standard Error aggiungendo lo status code HTTP e i dati JSON dell'errore.
 */
export class ApiError extends Error {
  status: number;
  errorCode?: string;
  details?: string[];
  data: unknown;

  constructor(
    message: string,
    status: number,
    data?: unknown,
    errorCode?: string,
    details?: string[]
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.errorCode = errorCode;
    this.details = details;
  }
}

/** 
 * Opzioni di richiesta che estendono RequestInit di fetch.
 * Permette di impostare requiresAuth: false per endpoint pubblici (es. login).
 */
interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

/** Chiave per salvare il token JWT in localStorage */
export const USER_TOKEN_STORAGE_KEY = 'bugboard_user_token';

/** Chiave per salvare i dati dell'utente (id, username, email, role) in localStorage */
export const USER_DETAILS_STORAGE_KEY = 'bugboard_user_details';

function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

function extractDetails(details: unknown): string[] | undefined {
  if (!Array.isArray(details)) {
    return undefined;
  }
  return details.map(String).filter((s) => s.trim() !== '');
}

class ApiClient {
  
  //URL di base del server backend
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthToken(): string | null {
    return localStorage.getItem(USER_TOKEN_STORAGE_KEY);
  }

  // Costruisce l'URL completo per fetch unendo baseUrl ed endpoint
  private buildUrl(endpoint: string): string {
    if (!this.baseUrl || endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }
    const base = this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`;
    const path = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return new URL(path, base).toString();
  }

  // Costruisce e configura gli Header della richiesta con Content-Type e Bearer token
  private buildHeaders(headers: HeadersInit = {}, requiresAuth = true): Headers {
    const requestHeaders = new Headers(headers);

    if (!requestHeaders.has('Content-Type')) {
      requestHeaders.set('Content-Type', 'application/json');
    }

    if (requiresAuth) {
      const token = this.getAuthToken();
      if (token) {
        requestHeaders.set('Authorization', 'Bearer ' + token);
      }
    }
    return requestHeaders;
  }

  // Estrae errorCode, messaggio e dettagli se il payload è un oggetto JSON conforme a ErrorResponseDto
  private extractErrorInfo(errorData: unknown): {
    errorCode?: string;
    message?: string;
    details?: string[];
  } {
    const directMessage = asNonEmptyString(errorData);
    if (directMessage) {
      return { message: directMessage };
    }

    if (typeof errorData !== 'object' || errorData === null) {
      return {};
    }

    const dataObj = errorData as Record<string, unknown>;
    return {
      errorCode: asNonEmptyString(dataObj.errorCode),
      message: asNonEmptyString(dataObj.message) ?? asNonEmptyString(dataObj.error),
      details: extractDetails(dataObj.details),
    };
  }

  // Estrae e normalizza i dati dell'errore dal corpo della risposta HTTP
  private async parseError(response: Response): Promise<ApiError> {
    const isJson = response.headers.get('content-type')?.includes('application/json');
    let errorData: unknown = null;
    try {
      errorData = isJson ? await response.json() : await response.text();
    } catch {
      // Ignora errori di parsing del body di errore
    }

    // Parsing difensivo: se il body è arrivato come stringa (es. Content-Type assente o non application/json), prova a parsarla come JSON
    if (typeof errorData === 'string' && errorData.trim().startsWith('{')) {
      try {
        errorData = JSON.parse(errorData);
      } catch {
        // Mantiene la stringa se non è JSON valido
      }
    }

    const errorInfo = this.extractErrorInfo(errorData);
    const localizedMessage = getLocalizedErrorMessage(
      response.status,
      errorInfo,
      response.statusText
    );

    return new ApiError(
      localizedMessage,
      response.status,
      errorData,
      errorInfo.errorCode,
      errorInfo.details
    );
  }

  // Gestisce lo stato di non autorizzazione: logout e notifica all'applicazione
  private handleUnauthorized(): void {
    localStorage.removeItem(USER_TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_DETAILS_STORAGE_KEY);
    window.dispatchEvent(new Event('auth:unauthorized'));
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { requiresAuth = true, headers = {}, ...restOptions } = options;
    const requestHeaders = this.buildHeaders(headers, requiresAuth);
    const fullUrl = this.buildUrl(endpoint);

    try {
      const response = await fetch(fullUrl, {
        headers: requestHeaders,
        ...restOptions,
      });

      if (response.status === 401) {
        this.handleUnauthorized();
      }
      /**
       * The **`ok`** read-only property of the Response interface contains a Boolean stating whether the response was successful (status in the range 200-299) or not.
       *
       * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Response/ok)
       */
      if (!response.ok) {
        throw await this.parseError(response);
      }
      
      // Status 204 (No Content): operazione riuscita ma senza body di risposta (es. DELETE)
      if (response.status === 204) {
        return null as unknown as T;
      }

      const isJson = response.headers.get('content-type')?.includes('application/json');
      if (isJson) {
        return (await response.json()) as T;
      }

      const text = await response.text();
      return (text ? (text as unknown as T) : null) as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError((error as Error).message || 'Errore di connessione con il server', 0);
    }
  }

  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { 
      ...options,
      method: 'GET' 
    });
  }

  post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { 
      ...options,
      method: 'DELETE' 
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
