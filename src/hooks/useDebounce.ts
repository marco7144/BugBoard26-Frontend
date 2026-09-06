import { useState, useEffect } from 'react';

/**
 * Custom Hook per ritardare la propagazione di un valore finché
 * l'utente non smette di digitare per un determinato intervallo di tempo (delayMs).
 *
 * Previene race conditions e chiamate HTTP ridondanti verso il backend.
 */
export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
