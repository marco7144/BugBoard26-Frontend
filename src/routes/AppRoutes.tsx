import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { MainLayout } from '../components/layout/MainLayout';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { AdminUsersPage } from '../pages/AdminUsersPage';
import { IssueDetailPage } from '../pages/IssueDetailPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Rotta pubblica per l'accesso */}
      <Route path="/login" element={<LoginPage />} />

      {/* Rotte protette incapsulate nel MainLayout */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/projects/:projectId/issues/:issueId" element={<IssueDetailPage />} />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback per percorsi non riconosciuti */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
