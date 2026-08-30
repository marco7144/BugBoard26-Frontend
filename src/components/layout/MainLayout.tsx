import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import './MainLayout.css';

interface MainLayoutProps {
  children?: React.ReactNode;
}

/**
 * Layout principale dell'applicazione per le schermate autenticate.
 * Assembla la Sidebar laterale a sinistra, la Top Header in alto e l'area di contenuto dinamica.
 */
export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="main-layout">
      <Sidebar />
      <div className="main-wrapper">
        <Header />
        <main className="main-content">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};
