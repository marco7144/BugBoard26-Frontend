import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';
import App from './App';

const isElectron =
  window.location.protocol === 'file:' ||
  navigator.userAgent.toLowerCase().includes('electron');

const Router = isElectron ? HashRouter : BrowserRouter;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <AuthProvider>
        <ProjectProvider>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </ProjectProvider>
      </AuthProvider>
    </Router>
  </StrictMode>,
);
