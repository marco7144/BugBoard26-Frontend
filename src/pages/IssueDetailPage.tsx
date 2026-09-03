import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Clock,
  FolderKanban,
  AlertCircle,
  Loader2,
  Maximize2,
  X,
} from 'lucide-react';
import { issueService, type IssueResponseDto } from '../services/issueService';
import { commentService, type CommentResponseDto } from '../services/commentService';
import { projectService, type UserResponseDto } from '../services/projectService';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { StatusBadge, PriorityBadge, TypeBadge } from '../components/common/Badge';
import { LabelBadge } from '../components/labels/LabelBadge';
import { IssueStateActions } from '../components/issues/IssueStateActions';
import { AssigneeSelector } from '../components/issues/AssigneeSelector';
import { IssueEditModal, checkIssueEditPermissions } from '../components/issues/IssueEditModal';
import { CommentList } from '../components/comments/CommentList';
import { CommentInput } from '../components/comments/CommentInput';

/**
 * Formatta una data ISO in stringa giorno/mese/anno ore:minuti (KISS).
 */
function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '---';
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime())
    ? dateStr
    : d.toLocaleString('it-IT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
}

/**
 * Verifica se un identificativo numerico è valido.
 */
function isValidId(id: number): boolean {
  return Number.isInteger(id) && id > 0;
}

/**
 * Carica in parallelo issue, commenti e partecipanti di un progetto.
 */
async function fetchIssuePageData(projectId: number, issueId: number) {
  const [issueData, commentsData, partsData] = await Promise.all([
    issueService.getIssueById(projectId, issueId),
    commentService.getComments(projectId, issueId).catch(() => []),
    projectService.getParticipants(projectId).catch(() => []),
  ]);

  return {
    issue: issueData,
    comments: Array.isArray(commentsData) ? commentsData : [],
    participants: Array.isArray(partsData) ? partsData : [],
  };
}

/**
 * Converte una stringa immagine (data URL o Base64) in formato utilizzabile per il tag img.
 */
function formatImageSrc(image?: string | null): string | null {
  if (!image) {
    return null;
  }
  if (image.startsWith('data:')) {
    return image;
  }
  return `data:image/png;base64,${image}`;
}

/**
 * Pagina Completa Dettaglio Issue (Step 25 - Requisiti F4, F5, F9, F10).
 *
 * Visualizza e gestisce tutti gli aspetti del singolo ticket:
 * - Testata con breadcrumb, ID #ISS-xxx e azioni di stato (State Pattern)
 * - Titolo, badges, descrizione completa e allegato screenshot con Lightbox
 * - Modifica dati con IssueEditModal (F9)
 * - Assegnatario con AssigneeSelector (F4)
 * - Thread commenti e invio con CommentList & CommentInput (F5)
 * - Etichette con LabelBadge (F10)
 *
 * Stilata interamente con utility Tailwind CSS v4 pixel-perfect.
 */
export const IssueDetailPage: React.FC = () => {
  const { projectId: rawProjectId, issueId: rawIssueId } = useParams<{
    projectId: string;
    issueId: string;
  }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { selectedProject, selectProjectById } = useProject();

  const projectId = Number(rawProjectId);
  const issueId = Number(rawIssueId);

  // Stati principali
  const [issue, setIssue] = useState<IssueResponseDto | null>(null);
  const [comments, setComments] = useState<CommentResponseDto[]>([]);
  const [participants, setParticipants] = useState<UserResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCommentsLoading, setIsCommentsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Stati modali e lightbox
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);

  // Caricamento dati iniziali
  useEffect(() => {
    let isMounted = true;

    if (!isValidId(projectId) || !isValidId(issueId)) {
      setError('Identificativo progetto o issue non valido.');
      setIsLoading(false);
      return () => {
        isMounted = false;
      };
    }

    if (selectedProject?.id !== projectId) {
      selectProjectById(projectId);
    }

    setIsLoading(true);
    setIsCommentsLoading(true);
    setError(null);

    const loadData = async () => {
      try {
        const data = await fetchIssuePageData(projectId, issueId);
        if (!isMounted) return;

        if (!data.issue) {
          setError(`La issue #${issueId} non è stata trovata nel progetto selezionato.`);
          return;
        }

        setIssue(data.issue);
        setComments(data.comments);
        setParticipants(data.participants);
      } catch (err: unknown) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Errore nel caricamento del ticket.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsCommentsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [projectId, issueId, selectProjectById, selectedProject]);

  // Handler per aggiornamento issue da IssueEditModal, IssueStateActions o AssigneeSelector
  const handleIssueUpdated = (updated: IssueResponseDto) => {
    setIssue(updated);
  };

  // Handler per aggiunta commento da CommentInput
  const handleCommentAdded = (newComment: CommentResponseDto) => {
    setComments((prev) => [...prev, newComment]);
  };

  // Stato di caricamento
  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 flex flex-col gap-6">
        <div className="flex flex-col items-center justify-center min-h-95 gap-4 text-center bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-xl p-8 sm:p-12 shadow-xs">
          <Loader2 size={36} className="animate-spin text-blue-600 dark:text-blue-400" aria-hidden="true" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Caricamento dettagli issue in corso...</p>
        </div>
      </div>
    );
  }

  // Stato di errore o ticket non trovato
  if (error || !issue) {
    return (
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 flex flex-col gap-6">
        <div className="flex flex-col items-center justify-center min-h-95 gap-4 text-center bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-xl p-8 sm:p-12 shadow-xs">
          <AlertCircle size={40} className="text-red-500" aria-hidden="true" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 m-0">Ticket non trovato</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 m-0">{error || 'Impossibile visualizzare la issue richiesta.'}</p>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg cursor-pointer shadow-xs transition-all"
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={16} />
            <span>Torna alla Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  const editPermissions = checkIssueEditPermissions(issue, user?.id, isAdmin);
  const imageSrc = formatImageSrc(issue.image);
  const creatorInitial = issue.creatorUsername ? issue.creatorUsername.charAt(0).toUpperCase() : 'U';

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 flex flex-col gap-6">
      {/* 1. Top Bar & Breadcrumbs */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-700 rounded-lg hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-150 shadow-xs cursor-pointer"
            onClick={() => navigate('/')}
            title="Torna alla lista delle issue"
          >
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </button>
          <span className="font-mono text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
            #ISS-{issue.id}
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Pulsante Modifica Ticket (F9) */}
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-700 rounded-lg hover:not-disabled:border-blue-500 hover:not-disabled:text-blue-600 hover:not-disabled:bg-blue-50 dark:hover:not-disabled:bg-blue-950/30 transition-all duration-150 shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={() => setIsEditModalOpen(true)}
            disabled={!editPermissions.canEdit}
            title={editPermissions.reason || 'Modifica dettagli del ticket'}
          >
            <Pencil size={15} />
            <span>Modifica</span>
          </button>

          {/* Controlli di Transizione di Stato (State Pattern - F9) */}
          <IssueStateActions
            issue={issue}
            projectId={projectId}
            onStateChanged={handleIssueUpdated}
          />
        </div>
      </div>

      {/* 2. Griglia Principale a 2 Colonne */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Colonna Sinistra (Main Content) */}
        <div className="flex flex-col gap-6">
          {/* Card Intestazione & Titolo */}
          <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <TypeBadge type={issue.type} size="md" />
              <PriorityBadge priority={issue.priority} size="md" />
              <StatusBadge status={issue.state} size="md" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 leading-snug wrap-break-word m-0">
              {issue.title || 'Senza titolo'}
            </h1>

            {/* Descrizione */}
            <div>
              <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 mt-0">
                Descrizione
              </h2>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap wrap-break-word m-0">
                {issue.description && issue.description.trim().length > 0
                  ? issue.description
                  : 'Nessuna descrizione fornita per questo ticket.'}
              </p>
            </div>

            {/* Allegato Immagine (se presente) */}
            {imageSrc && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 mt-0">
                  Allegato Screenshot
                </h2>
                <button
                  type="button"
                  className="relative inline-block max-w-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer bg-slate-50 dark:bg-slate-800/40 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md p-0 text-left"
                  onClick={() => setIsLightboxOpen(true)}
                  title="Clicca per ingrandire l'immagine"
                >
                  <img src={imageSrc} alt="Screenshot allegato alla issue" className="block max-w-full max-h-80 object-cover" />
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-[#161b22] border-t border-slate-200 dark:border-slate-700">
                    <Maximize2 size={13} />
                    <span>Ingrandisci screenshot</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Sezione Commenti & Attività (F5) */}
          <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col gap-4">
            <CommentList comments={comments} isLoading={isCommentsLoading} />
            <CommentInput
              projectId={projectId}
              issueId={issueId}
              onCommentAdded={handleCommentAdded}
            />
          </div>
        </div>

        {/* Colonna Destra (Sidebar Metadati) */}
        <aside className="flex flex-col gap-5" aria-label="Metadati Ticket">
          {/* Selettore Assegnatario (F4) */}
          <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <AssigneeSelector
              issue={issue}
              projectId={projectId}
              participants={participants}
              onAssigneeChanged={handleIssueUpdated}
            />
          </div>

          {/* Dettagli Generali */}
          <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col gap-4">
            <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0 mt-0">
              Informazioni Ticket
            </h2>
            <div className="flex flex-col gap-4">
              {/* Progetto */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Progetto
                </span>
                <div className="flex items-center gap-2">
                  <FolderKanban size={16} className="text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {selectedProject?.name || `Progetto #${projectId}`}
                  </span>
                </div>
              </div>

              {/* Creatore */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Creato Da
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-xs font-semibold flex items-center justify-center border border-blue-200 dark:border-blue-900/50" aria-hidden="true">
                    {creatorInitial}
                  </div>
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {issue.creatorUsername || 'Utente sconosciuto'}
                  </span>
                </div>
              </div>

              {/* Data di Creazione */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Data Creazione
                </span>
                <div className="flex items-center gap-2">
                  <Clock size={15} className="text-slate-400 dark:text-slate-500" />
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{formatDate(issue.creationDate)}</span>
                </div>
              </div>

              {/* Etichette / Labels (F10) */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Etichette
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {issue.labels && issue.labels.length > 0 ? (
                    issue.labels.map((label) => (
                      <LabelBadge key={label.id ?? label.name} label={label} size="md" />
                    ))
                  ) : (
                    <span className="text-[13px] text-slate-400 dark:text-slate-500 italic">Nessuna etichetta</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* 3. Modale Modifica Dati Issue (F9) */}
      <IssueEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        issue={issue}
        projectId={projectId}
        onSuccess={handleIssueUpdated}
      />

      {/* 4. Lightbox Immagine Ingrandita (KISS) */}
      {isLightboxOpen && imageSrc && (
        <dialog
          className="fixed inset-0 w-full h-full max-w-none max-h-none m-0 p-6 bg-black/80 backdrop-blur-xs flex items-center justify-center z-9999 border-0"
          open
          aria-modal="true"
          aria-label="Screenshot Ingrandito"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsLightboxOpen(false);
            }
          }}
        >
          <button
            type="button"
            className="fixed inset-0 w-full h-full bg-transparent border-0 cursor-default"
            aria-label="Chiudi visualizzazione ingrandita"
            onClick={() => setIsLightboxOpen(false)}
          />
          <div className="relative z-10 max-w-[90vw] max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              className="absolute -top-10 right-0 text-white hover:text-slate-200 bg-transparent border-0 cursor-pointer flex items-center gap-1.5 text-sm font-medium"
              onClick={() => setIsLightboxOpen(false)}
            >
              <X size={18} />
              <span>Chiudi</span>
            </button>
            <img
              src={imageSrc}
              alt="Screenshot a schermo intero"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </dialog>
      )}
    </div>
  );
};
