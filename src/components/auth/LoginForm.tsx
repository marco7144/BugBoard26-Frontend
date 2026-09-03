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

export interface LoginFormProps {
  /** Callback invocato all'invio del form con credenziali validate */
  onSubmit: (credentials: LoginCredentials) => void | Promise<void>;
  /** Callback facoltativo per azzerare l'errore globale alla digitazione */
  onClearError?: () => void;
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
  onClearError,
  isLoading = false,
  errorMessage = null,
  defaultEmail = '',
  defaultPassword = '',
}) => {
  // Stato campi form
  const [email, setEmail] = useState<string>(defaultEmail);
  const [password, setPassword] = useState<string>(defaultPassword);
  const [showPassword, setShowPassword] = useState<boolean>(false);

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
    <div className="w-full max-w-110 flex flex-col gap-5 p-7 sm:p-8 bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
      {/* Brand Header */}
      <div className="text-center flex flex-col items-center gap-1.5 mb-1">
        <div
          className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 mb-1 transition-transform duration-150 hover:scale-105"
          title="BugBoard26 Logo"
        >
          <Bug size={26} strokeWidth={2.4} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          BugBoard<span className="text-blue-600 dark:text-blue-500">26</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Accedi alla piattaforma di issue tracking
        </p>
      </div>

      {/* Banner Errore Globale / Backend */}
      {errorMessage && (
        <div
          className="flex items-start gap-2.5 p-3 rounded-lg text-[13px] leading-snug bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400"
          role="alert"
        >
          <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Form di Autenticazione */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {/* Campo Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-800 dark:text-slate-200" htmlFor="login-email">
            Email
          </label>
          <div className="relative flex items-center group">
            <span className="absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center justify-center transition-colors group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400">
              <Mail size={18} />
            </span>
            <input
              id="login-email"
              type="email"
              name="email"
              className={`w-full pl-9.5 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-[#161b22] border rounded-lg transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 ${
                validationErrors.email
                  ? 'border-red-500 bg-red-50/20 dark:bg-red-950/10 focus:border-red-500 focus:ring-red-500/20 text-red-900 dark:text-red-200'
                  : 'border-slate-300 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-blue-600/20'
              }`}
              placeholder="nome.cognome@bugboard26.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (validationErrors.email) {
                  setValidationErrors((prev) => ({ ...prev, email: undefined }));
                }
                if (onClearError) {
                  onClearError();
                }
              }}
              autoComplete="email"
              disabled={isLoading}
              required
            />
          </div>
          {validationErrors.email && (
            <span className="text-xs text-red-600 dark:text-red-400">
              {validationErrors.email}
            </span>
          )}
        </div>

        {/* Campo Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-800 dark:text-slate-200" htmlFor="login-password">
            Password
          </label>
          <div className="relative flex items-center group">
            <span className="absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center justify-center transition-colors group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400">
              <Lock size={18} />
            </span>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              className={`w-full pl-9.5 pr-10 py-2.5 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-[#161b22] border rounded-lg transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 ${
                validationErrors.password
                  ? 'border-red-500 bg-red-50/20 dark:bg-red-950/10 focus:border-red-500 focus:ring-red-500/20 text-red-900 dark:text-red-200'
                  : 'border-slate-300 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-blue-600/20'
              }`}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (validationErrors.password) {
                  setValidationErrors((prev) => ({ ...prev, password: undefined }));
                }
                if (onClearError) {
                  onClearError();
                }
              }}
              autoComplete="current-password"
              disabled={isLoading}
              required
            />
            <button
              type="button"
              className="absolute right-2.5 p-1 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded transition-colors focus:outline-none disabled:opacity-50"
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
            <span className="text-xs text-red-600 dark:text-red-400">
              {validationErrors.password}
            </span>
          )}
        </div>

        {/* Pulsante Submit */}
        <button
          type="submit"
          className="w-full inline-flex items-center justify-center gap-2 py-2.75 px-4.5 text-[15px] font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-blue-600/30 mt-1.5"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin shrink-0" />
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
