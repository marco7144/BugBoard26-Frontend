import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface MainLayoutProps {
  children?: React.ReactNode;
}

/**
 * Layout principale dell'applicazione per le schermate autenticate.
 * Assembla la Sidebar laterale a sinistra, la Top Header in alto e l'area di contenuto dinamica.
 */
export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#0b101b] text-slate-900 dark:text-slate-100 transition-colors">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col h-screen">
        <Header />
        <main className="flex-1 min-w-0 overflow-y-auto p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};
