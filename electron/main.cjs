const { app, BrowserWindow } = require('electron');
const path = require('node:path');

// Verifica se siamo in fase di sviluppo 
const isDev = !app.isPackaged;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: 'BugBoard26',
    icon: path.join(__dirname, '../src/assets/icon.ico'),
    autoHideMenuBar: true,       
    backgroundMaterial: 'mica',  // Effetto satinato nativo Windows 11 
    webPreferences: {
      nodeIntegration: false,    // Sicurezza: non esporre API Node al frontend
      contextIsolation: true,   // Isolamento sicuro del contesto
    },
  });


  if (isDev) {
    // In sviluppo: carica il server Vite locale
    mainWindow.loadURL('http://localhost:5173');
  } else {
    // In produzione: carica l'index.html compilato nella cartella dist
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});
