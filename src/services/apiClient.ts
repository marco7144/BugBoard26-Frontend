import { API_BASE_URL } from '../config/api';

/** 
 * Classe custom per gestire gli errori HTTP del backend.
 * Estende la classe standard Error aggiungendo lo status code HTTP e i dati JSON dell'errore.
 */
export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
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

  // Mappa dei messaggi di fallback descrittivi per ciascun codice di stato HTTP
  private getDefaultErrorMessage(status: number): string {
    switch (status) {
      case 400:
        return 'Richiesta non valida. Verifica i dati inseriti.';
      case 401:
        return 'Sessione scaduta o non valida. Effettua nuovamente il login.';
      case 403:
        return 'Accesso negato: non disponi dei permessi necessari per questa operazione.';
      case 404:
        return 'La risorsa richiesta non è stata trovata.';
      case 409:
        return 'Operazione non valida: la risorsa esiste già o crea un conflitto.';
      case 500:
      case 502:
      case 503:
        return 'Si è verificato un errore temporaneo sul server. Riprova più tardi.';
      default:
        return `Errore nella comunicazione con il server (codice ${status}).`;
    }
  }

  // Estrae una descrizione testuale dal payload di errore restituito dal backend
  private extractErrorMessageFromData(errorData: unknown): string {
    if (typeof errorData === 'string' && errorData.trim() !== '') {
      return errorData;
    }
    if (Array.isArray(errorData) && errorData.length > 0) {
      return errorData.map(String).join(', ');
    }
    if (typeof errorData === 'object' && errorData !== null) {
      const dataObj = errorData as Record<string, unknown>;
      if (typeof dataObj.message === 'string' && dataObj.message.trim() !== '') {
        return dataObj.message;
      }
      if (typeof dataObj.error === 'string' && dataObj.error.trim() !== '') {
        return dataObj.error;
      }
    }
    return '';
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

    const customMessage = this.extractErrorMessageFromData(errorData);
    const fallbackMessage = response.statusText?.trim() || this.getDefaultErrorMessage(response.status);
    const errorMessage = customMessage || fallbackMessage;

    return new ApiError(errorMessage, response.status, errorData);
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
