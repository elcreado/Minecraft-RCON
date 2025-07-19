import { spawn } from 'child_process';
import dotenv from 'dotenv';

import { tiktokConnection } from './scripts/Tiktok/tiktokConnect.js';
import { twitchConnection } from './scripts/Twitch/twitchConnect.js';
import { log, onLog } from './scripts/logger.js';

//Configuracion

dotenv.config({ path: './config.env' });

let tiktokRewards = {
    likesTrigger: 50,
    gifts: {}
};

async function loadTiktokRewards() {
    try {
        const raw = await fs.readFile('./data/tiktok-rewards.json', 'utf-8');
        tiktokRewards = JSON.parse(raw);
        log('✅| Tiktok rewards loaded successfully.');
    } catch {
        log('⚠️| Failed to load tiktok-rewards.json');
    }
};

await loadTiktokRewards();

export async function __init() {
    try {
        await tiktokConnection();
        log('✅| [Index.js] Configuracion cargada correctamente.');
    } catch (err) {
        log('⚠️| [Index.js] Error al cargar la configuracion de TikTok: ' + err.message);
    }

    try {
        await twitchConnection();
        log('✅| [Index.js] Conexión a Twitch establecida correctamente.');
    } catch (err) {
        log('⚠️| [Index.js] Error al cargar la configuracion de Twitch: ' + err.message);
    }
}

