import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

import { onLog } from '../index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let windows;

const preloadPath = path.join(__dirname, 'preload.js');

const createWindow = () => {
    windows = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: preloadPath,
            contextIsolation: true,
            nodeIntegration: false,
        }
    })

    const htmlPath = path.join(__dirname, 'renderer', 'index.html');
    windows.loadFile(htmlPath);

    onLog(msg => windows.webContents.send('log', msg));

    windows.setMenuBarVisibility(null);  //disable application menu
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});