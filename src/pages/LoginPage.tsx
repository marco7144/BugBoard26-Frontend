import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { ApiError } from '../services/apiClient';
import type { LoginCredentials } from '../types/auth';

/**
 * Pagina di Login (/login).
 * Ospita il form di autenticazione, il toggle per il tema Light/Dark,
 * invoca authService.login(), aggiorna AuthContext e reindirizza alla Dashboard.
 */
export const LoginPage: React.FC = () => {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Stato di caricamento durante la chiamata asincrona di autenticazione (disabilita form e mostra spinner)
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Messaggio di errore restituito dal backend o da problemi di rete
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Se l'utente è già autenticato, reindirizza direttamente alla home
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  /** Gestisce l'invio delle credenziali e l'autenticazione con il backend */
  const handleLogin = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await authService.login({
        email: credentials.email,
        password: credentials.password,
      });

      if (response?.token) {
        login(response.token);

        // Reindirizza alla rotta protetta precedentemente tentata o alla home
        const originState = location.state as { from?: { pathname?: string } } | undefined;
        const targetPath = originState?.from?.pathname || '/';
        navigate(targetPath, { replace: true });
      } else {
        setErrorMessage('Risposta di autenticazione non valida dal server.');
      }
    } catch (err: unknown) {
      if (
        err instanceof ApiError &&
        (err.status === 401 || err.status === 403 || err.status === 404)
      ) {
        setErrorMessage('Credenziali non valide. Verifica email e password.');
      } else if (err instanceof ApiError && err.status === 0) {
        setErrorMessage('Impossibile connettersi al server.');
      } else {
        const message =
          err instanceof Error
            ? err.message
            : 'Si è verificato un errore durante l\'accesso.';
        setErrorMessage(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-start sm:justify-center items-center relative p-5 sm:p-8 bg-slate-50 dark:bg-[#0b101b] transition-colors">
      {/* Selettore Tema in alto a destra */}
      <div className="static sm:absolute sm:top-5 sm:right-6 mb-4 sm:mb-0 self-end flex items-center gap-3 z-10">
        <ThemeToggle />
      </div>

      {/* Area Contenuto & Form di Accesso */}
      <main className="w-full max-w-110 flex flex-col items-center gap-4 z-1">
        <LoginForm
          onSubmit={handleLogin}
          onClearError={() => setErrorMessage(null)}
          isLoading={isLoading}
          errorMessage={errorMessage}
        />
        <footer className="text-center text-xs text-slate-400 dark:text-slate-500 mt-2">
          BugBoard26 - Piattaforma di Issue Tracking
        </footer>
      </main>
    </div>
  );
};
