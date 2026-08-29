import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { ApiError } from '../services/apiClient';
import type { LoginCredentials } from '../types/auth';
import './LoginPage.css';

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
    <div className="login-page-container">
      {/* Selettore Tema in alto a destra */}
      <div className="login-page-topbar">
        <ThemeToggle />
      </div>

      {/* Area Contenuto & Form di Accesso */}
      <main className="login-page-content">
        <LoginForm
          onSubmit={handleLogin}
          onClearError={() => setErrorMessage(null)}
          isLoading={isLoading}
          errorMessage={errorMessage}
        />
        <footer className="login-page-footer">
          BugBoard26 - Piattaforma di Issue Tracking
        </footer>
      </main>
    </div>
  );
};
