import { app, BrowserWindow, ipcMain } from 'electron';

import path from 'path';
import { fileURLToPath } from 'url';

import { log, onLog } from '../scripts/logger.js';
import { __init } from '../index.js';

import { tiktokMain } from '../scripts/tiktok/tiktokConnect.js';
import { twitchMain } from '../scripts/Twitch/twitchConnect.js';

import { loadSettings, saveSettings } from '../scripts/saveSettings.js';

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

app.whenReady().then(async () => {
    createWindow();
    await __init();
    log('✅| Application started successfully.');
});

ipcMain.handle('start-tiktok-connection', async () => {
    const user = await loadSettings();
    const username = user.tiktokUser || 'elcreado_gg'; // Default username if not set
    
    log(`Starting TikTok connection for user: ${username}`);

    const result = await tiktokMain(username);
    return result;
});

ipcMain.handle('start-twitch-connection', async () => {
    const result = await twitchMain();
    return result;
});

ipcMain.handle('save-settings', async (event, settings) => {
    const lastSettings = await loadSettings();
    const lastTiktok = lastSettings.tiktokUsername || 'elcreado_gg'; // Default username if not set
    const lastTwitch = lastSettings.twitchUsername || 'elcreado_gg'; // Default username if not set

    if (settings.tiktokUsername == "") {
        settings.tiktokUsername = lastTiktok;
    }

    if (settings.twitchUsername == "") {
        settings.twitchUsername = lastTwitch;
    }

    const result = await saveSettings(settings);
    return result;
});

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