import type { components } from '../types/api';

/** Tipo DTO dell'errore restituito dal backend da OpenAPI */
export type ErrorResponseDto = components['schemas']['ErrorResponseDto'];

/**
 * Codici di errore semantici ricavati automaticamente dallo schema OpenAPI (ErrorCode.java).
 */
export type BackendErrorCode = NonNullable<ErrorResponseDto['errorCode']>;

/**
 * Tabella di traduzione per i codici di errore semantici del backend (ErrorCode).
 * Disaccoppia la localizzazione della UI dalla logica di business del server (Single Responsibility).
 */
const ERROR_CODE_TRANSLATIONS: Record<BackendErrorCode, string> = {
  // Autenticazione & Permessi
  BAD_CREDENTIALS: 'Credenziali non valide. Verifica email e password.',
  TOKEN_EXPIRED: 'Sessione scaduta. Effettua nuovamente il login.',
  ACCESS_DENIED: 'Accesso negato: non disponi dei permessi necessari per questa operazione.',
  USER_NOT_FOUND: 'Utente non trovato.',

  // Risorse non trovate
  RESOURCE_NOT_FOUND: 'La risorsa richiesta non è stata trovata.',
  PROJECT_NOT_FOUND: 'Progetto non trovato.',
  ISSUE_NOT_FOUND: 'Issue non trovata.',
  LABEL_NOT_FOUND: 'Etichetta non trovata.',

  // Conflitti & Risorse duplicate
  EMAIL_ALREADY_IN_USE: "L'indirizzo email specificato è già associato a un altro account.",
  USERNAME_ALREADY_IN_USE: 'Questo nome utente è già in uso.',
  PROJECT_NAME_ALREADY_EXISTS: 'Un progetto con questo nome esiste già.',
  LABEL_ALREADY_EXISTS: "Un'etichetta con questo nome esiste già.",
  USER_ALREADY_PARTICIPANT: 'Questo utente partecipa già al progetto selezionato.',
  DUPLICATE_RESOURCE: 'Questa risorsa o identificativo è già presente nel sistema.',

  // Regole di Dominio & Vincoli di Business
  MAX_LABELS_EXCEEDED: 'Non è possibile associare più di 10 etichette a una issue.',
  ISSUE_NOT_IN_PROJECT: 'La issue specificata non appartiene al progetto indicato.',
  USER_NOT_IN_PROJECT: "L'utente specificato non è un partecipante del progetto.",
  NOT_PROJECT_CREATOR: 'Solo il creatore del progetto è autorizzato a eseguire questa operazione.',
  INVALID_STATE_TRANSITION: 'Transizione di stato non consentita per questa issue.',
  DATA_INTEGRITY_VIOLATION: 'I dati inseriti violano i vincoli di integrità del sistema (es. valore duplicato o testo troppo lungo).',

  // Validazione dati & Errori generici
  VALIDATION_ERROR: 'I dati inviati non sono validi o non rispettano i vincoli richiesti.',
  BAD_REQUEST: 'Richiesta non valida. Verifica i dati inseriti.',
  INTERNAL_SERVER_ERROR: 'Si è verificato un errore interno sul server. Riprova più tardi.',
};

/**
 * Messaggi descrittivi di fallback per i codici di stato HTTP standard.
 */
export function getDefaultErrorMessage(status: number): string {
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

/**
 * Risolve e traduce il messaggio di errore in italiano per la UI.
 */
export function getLocalizedErrorMessage(
  status: number,
  errorInfo: Partial<ErrorResponseDto> | { errorCode?: string; message?: string; details?: string[] } = {},
  statusText?: string
): string {
  const { errorCode, message, details } = errorInfo;

  // 1. Risoluzione prioritaria tramite codice semantico ErrorCode
  if (errorCode) {
    const translation = ERROR_CODE_TRANSLATIONS[errorCode as BackendErrorCode];
    if (translation) {
      if (errorCode === 'VALIDATION_ERROR' && details && details.length > 0) {
        return `Dati non validi: ${details.join(', ')}`;
      }
      return translation;
    }
  }

  // 2. Dettagli di validazione disponibili senza codice esplicito
  if (details && details.length > 0) {
    return `Dati non validi: ${details.join(', ')}`;
  }

  // 3. Fallback su messaggio del server o statusText generico HTTP
  if (message) {
    const lower = message.toLowerCase();
    if (
      [
        'bad request',
        'not found',
        'conflict',
        'unauthorized',
        'forbidden',
        'internal server error',
      ].includes(lower)
    ) {
      return getDefaultErrorMessage(status);
    }
    return message;
  }

  return statusText?.trim() || getDefaultErrorMessage(status);
}
