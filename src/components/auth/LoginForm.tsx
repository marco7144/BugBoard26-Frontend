import React, { useState } from 'react';
import {
  Bug,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import type { LoginCredentials } from '../../types/auth';
import './LoginForm.css';

export interface LoginFormProps {
  /** Callback invocato all'invio del form con credenziali validate */
  onSubmit: (credentials: LoginCredentials) => void | Promise<void>;
  /** Indica se la richiesta di autenticazione è in elaborazione */
  isLoading?: boolean;
  /** Messaggio di errore restituito dal server o dalla logica esterna */
  errorMessage?: string | null;
  /** Valore iniziale facoltativo per il campo email */
  defaultEmail?: string;
  /** Valore iniziale facoltativo per il campo password */
  defaultPassword?: string;
}

/** Regex lineare per validazione client-side del formato email */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Componente presentational per il form di accesso/login a BugBoard26.
 * Gestisce l'input controllato, la validazione client-side e il toggle visibilità password.
 */
export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  isLoading = false,
  errorMessage = null,
  defaultEmail = '',
  defaultPassword = '',
}) => {
  // Stato campi form
  const [email, setEmail] = useState<string>(defaultEmail);
  const [password, setPassword] = useState<string>(defaultPassword);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // Stato validazione locale
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  /** Validazione locale dei campi al submit o blur */
  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errors.email = 'Inserisci il tuo indirizzo email.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = 'Inserisci un formato email valido (es. utente@dominio.com).';
    }

    if (!password) {
      errors.password = 'Inserisci la password.';
    } else if (password.length < 6) {
      errors.password = 'La password deve contenere almeno 6 caratteri.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /** Gestore invio form */
  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;

    if (validateForm()) {
      onSubmit({
        email: email.trim(),
        password,
      });
    }
  };

  return (
    <div className="card login-card-wrapper">
      {/* Brand Header */}
      <div className="login-header">
        <div className="login-logo-badge" title="BugBoard26 Logo">
          <Bug size={26} strokeWidth={2.4} />
        </div>
        <h1 className="login-title">
          BugBoard<span>26</span>
        </h1>
        <p className="login-subtitle">Accedi alla piattaforma di issue tracking</p>
      </div>

      {/* Banner Errore Globale / Backend */}
      {errorMessage && (
        <div className="login-alert-error" role="alert">
          <AlertCircle size={18} className="login-alert-icon" />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Form di Autenticazione */}
      <form onSubmit={handleSubmit} noValidate>
        {/* Campo Email */}
        <div className="form-group">
          <label className="form-label" htmlFor="login-email">
            Email
          </label>
          <div className="input-icon-wrapper">
            <span className="input-icon-left">
              <Mail size={18} />
            </span>
            <input
              id="login-email"
              type="email"
              name="email"
              className={`form-input input-has-icon-left ${validationErrors.email ? 'input-invalid' : ''}`}
              placeholder="nome.cognome@bugboard26.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (validationErrors.email) {
                  setValidationErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              autoComplete="email"
              disabled={isLoading}
              required
            />
          </div>
          {validationErrors.email && (
            <span className="form-error">
              {validationErrors.email}
            </span>
          )}
        </div>

        {/* Campo Password */}
        <div className="form-group">
          <label className="form-label" htmlFor="login-password">
            Password
          </label>
          <div className="input-icon-wrapper">
            <span className="input-icon-left">
              <Lock size={18} />
            </span>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              className={`form-input input-has-icon-left input-has-toggle-right ${validationErrors.password ? 'input-invalid' : ''}`}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (validationErrors.password) {
                  setValidationErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              autoComplete="current-password"
              disabled={isLoading}
              required
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? 'Nascondi password' : 'Mostra password'}
              aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
              tabIndex={-1}
              disabled={isLoading}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {validationErrors.password && (
            <span className="form-error">
              {validationErrors.password}
            </span>
          )}
        </div>

        {/* Opzione Ricordami */}
        <div className="login-options-row">
          <label className="login-checkbox-label">
            <input
              type="checkbox"
              className="login-checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
            />
            <span>Ricordami</span>
          </label>
        </div>

        {/* Pulsante Submit */}
        <button
          type="submit"
          className="btn btn-primary login-submit-btn"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="login-spinner" />
              <span>Autenticazione in corso...</span>
            </>
          ) : (
            <>
              <LogIn size={18} />
              <span>Accedi</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
