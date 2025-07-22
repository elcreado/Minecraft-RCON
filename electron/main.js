import { app, BrowserWindow, ipcMain } from 'electron';

import { spawn } from 'child_process';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { log, onLog } from '../scripts/logger.js';

import { tiktokMain, disconnectTiktok } from '../scripts/tiktok/tiktokConnect.js';
import { twitchMain, disconnectTwitch } from '../scripts/Twitch/twitchConnect.js';
import { stopServer } from '../scripts/Minecraft/serverManager.js';

import { loadSettings, saveSettings } from '../scripts/saveSettings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let windows;
let serverProcess = null;

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

ipcMain.handle('create-server', async () => {
    const presetJar = path.join(__dirname, '..', 'server', 'preset', 'server.jar');
    const mcServerDir = path.join(__dirname, '..', 'server', 'minecraft');

    fs.mkdirSync(mcServerDir, { recursive: true });

    const targetJar = path.join(mcServerDir, 'server.jar');
    if (!fs.existsSync(targetJar)) {
        fs.copyFileSync(presetJar, targetJar);
    }

    fs.writeFileSync(path.join(mcServerDir, 'eula.txt'), 'eula=true\n');

    return { success: true };
})

ipcMain.handle('start-server', async (event) => {
    if (serverProcess) {
        log('Server actually running..', 'var(--error-color)');
        return;
    }

    const mcServerDir = path.join(__dirname, '..', 'server', 'minecraft');
    const jar = path.join(mcServerDir, 'server.jar');

    serverProcess = spawn('java', [
        '-Xmx4024M',
        '-Xms4024M',
        '-jar',
        jar,
        'nogui'
    ], {
        cwd: mcServerDir,
        stdio: ['pipe', 'pipe', 'pipe']
    });

    const propertiesFile = path.join(mcServerDir, 'server.properties');
    let content = fs.readFileSync(propertiesFile, 'utf-8');

    content = content
        .replace(/^server-ip=.*$/m, 'server-ip=192.168.0.6')
        .replace(/^server-port=.*$/m, 'server-port=25565')
        .replace(/^enable-rcon.*$/m, 'enable-rcon=true')
        .replace(/^rcon.password=.*$/m, 'rcon.password=YocomoServidorMinecraft.');

    fs.writeFileSync(propertiesFile, content, 'utf-8');

    // Escucha logs y mándalos al renderer
    serverProcess.stdout.on('data', data => {
        log(data.toString(), 'var(--info-color)');
    });
    serverProcess.stderr.on('data', data => {
        log(data.toString(), 'var(--info-color)');
    });

    return { success: true, message: 'Rcon server STARTED SUCCESFULY!' };
});

ipcMain.handle('stop-server', async (event) => {
    const stopped = await stopServer(serverProcess);
    serverProcess = null;
    return { success: true, message: stopped};
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

app.on('before-quit', async (e) => {
    e.preventDefault();

    try {
        await stopServer(serverProcess);
    } catch (err) {
        console.error('Error closing the resources: ', err);
    }

    app.exit(0);
})

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