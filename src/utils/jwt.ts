export interface JwtPayload {
  /** Email dell'utente registrato nel backend (subject del token) */
  sub: string;
  /** ID numerico dell'utente */
  userId: number;
  /** Username dell'utente */
  username: string;
  /** Ruolo dell'utente emesso dal backend ('ADMIN' | 'USER') */
  role: string;
  /** Timestamp di emissione del token (in secondi) */
  iat: number;
  /** Timestamp di scadenza del token (in secondi) */
  exp: number;
}

/**
 * Decodifica in modo sicuro il payload di un token JWT
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    const base64UrlPayload = parts[1];
    const base64 = base64UrlPayload.replaceAll('-', '+').replaceAll('_', '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + (c.codePointAt(0) ?? 0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload) as JwtPayload;
  } catch (error) {
    console.error('Errore durante la decodifica del token JWT:', error);
    return null;
  }
}

/**
 * Controlla se il token JWT è scaduto
 */
export function isJwtExpired(token: string): boolean {
  const payload = decodeJwt(token);
  // Se il token è corrotto (payload null) o privo di scadenza, consideralo scaduto/invalido (Fail-Safe)
  if (!payload?.exp) {
    return true;
  }
  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
}
