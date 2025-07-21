import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { log } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadSettings() {
    try {
        const settingsPath = path.join(__dirname, '../data/settings.json');
        const raw = await fs.readFile(settingsPath, 'utf-8');
        log('Settings loaded successfully', 'var(--success-color)');
        return JSON.parse(raw);
    } catch (error) {
        log(error, 'var(--error-color)');
        return {};
    }
}

async function saveSettings(settings) {
    try {
        const settingsPath = path.join(__dirname, '../data/settings.json');
        await fs.writeFile(settingsPath, JSON.stringify(settings, null, 4));
        log('Settings saved successfully', 'var(--success-color)');
    } catch (error) {
        log(error, 'var(--error-color)');
    }
}

export { loadSettings, saveSettings };