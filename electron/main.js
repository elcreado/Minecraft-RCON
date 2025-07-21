import { app, BrowserWindow, ipcMain } from 'electron';

import path from 'path';
import { fileURLToPath } from 'url';

import { log, onLog } from '../scripts/logger.js';

import { tiktokMain, disconnectTiktok } from '../scripts/tiktok/tiktokConnect.js';
import { twitchMain, disconnectTwitch } from '../scripts/Twitch/twitchConnect.js';

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

    onLog((msg, color) => windows.webContents.send('log', msg, color));

    windows.setMenuBarVisibility(null);  //disable application menu
}

app.whenReady().then(async () => {
    createWindow();
});

ipcMain.handle('start-tiktok-connection', async () => {
    const user = await loadSettings();
    const username = user.tiktokUsername || 'elcreado_gg'; // Default username if not set
    
    log(`Starting TikTok connection for user: ${username}`, 'var(--info-color)');

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
    const lastServerIp = lastSettings.serverIp || '192.168.0.6';

    log(lastServerIp);

    try {
        await disconnectTiktok();
        await disconnectTwitch();
        log('✅| Disconnected from TikTok and Twitch successfully.', 'var(--info-color)');
    } catch (error) {
        log(`Error disconnecting TikTok: ${error.message}`, 'var(--error-color)');
    }

    if (settings.tiktokUsername == "") {
        settings.tiktokUsername = lastTiktok;
    }

    if (settings.twitchUsername == "") {
        settings.twitchUsername = lastTwitch;
    }

    if (settings.rconIp == "") {
        settings.rconIp = lastServerIp;
    }

    const result = await saveSettings(settings);
    return result;
});

ipcMain.handle('disconnect-tiktok', async () => {
    try {
        await disconnectTiktok();
    } catch (error) {
        log(`Error disconnecting TikTok: ${error.message}`, 'var(--error-color)');
    }

    return { success: true, message: 'TikTok connection disconnected' };
});

ipcMain.handle('disconnect-twitch', async () => {
    try {
        await disconnectTwitch();
    } catch (error) {
        log(`Error disconnecting Twitch: ${error.message}`);
    }

    return { success: true, message: 'Twitch connection disconnected' };
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