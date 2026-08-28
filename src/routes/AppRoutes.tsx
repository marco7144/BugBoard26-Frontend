import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { AdminUsersPage } from '../pages/AdminUsersPage';
import { IssueDetailPage } from '../pages/IssueDetailPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Rotta pubblica per l'accesso */}
      <Route path="/login" element={<LoginPage />} />

      {/* Rotte protette per utenti autenticati */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectId/issues/:issueId"
        element={
          <ProtectedRoute>
            <IssueDetailPage />
          </ProtectedRoute>
        }
      />

      {/* Rotta riservata esclusivamente agli amministratori */}
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminUsersPage />
          </ProtectedRoute>
        }
      />

      {/* Fallback per percorsi non riconosciuti */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
