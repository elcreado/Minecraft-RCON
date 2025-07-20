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
        log('✅| [saveSettings.js] Settings loaded successfully');
        return JSON.parse(raw);
    } catch (error) {
        log('⚠️| [saveSettings.js] Failed to load settings.json', error);
        return {};
    }
}

async function saveSettings(settings) {
    try {
        const settingsPath = path.join(__dirname, '../data/settings.json');
        await fs.writeFile(settingsPath, JSON.stringify(settings, null, 4));
        log('✅| [saveSettings.js] Settings saved successfully');
    } catch (error) {
        log('⚠️| [saveSettings.js] Failed to save settings.json', error);
    }
}

export { loadSettings, saveSettings };