import { SignConfig, TikTokLiveConnection, WebcastEvent, ControlEvent, ControlAction } from 'tiktok-live-connector';
import dotenv from 'dotenv';

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

import { log } from '../logger.js';
import { handleReward } from '../Minecraft/rconRewards.js';
import { connect } from 'http2';

dotenv.config({ path: './config.env' });

const { SING_API_KEY, TIKTOK_USERNAME } = process.env;

let likeCounts = 0;

let tiktokRewards = {
    likesTrigger: 50,
    gifts: {}
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadTiktokRewards() {
    try {
        const rewardsPath = path.join(__dirname, '../../data/tiktok-rewards.json');

        const raw = await fs.readFile(rewardsPath, 'utf-8');
        tiktokRewards = JSON.parse(raw);
        log('✅| [tiktokConnect.js] Tiktok rewards loaded successfully.');
    } catch {
        log('⚠️| [tiktokConnect.js] Failed to load tiktok-rewards.json');
    }
};

await loadTiktokRewards();

async function TiktokGiftRewards(giftId) {
    const key = String(giftId);
    const reward = tiktokRewards.gifts[key];
    if (!reward) return console.warn(`No hay recompensas para el ID ${key}`);

    log("El regalo recibido es = ", key);

    await handleReward(reward.action);
};

//Conexion con Tiktok

SignConfig.apiKey = SING_API_KEY;

const actions = {
    spawnCreeper: 'creeper',
    spawnZombie: 'zombie',
    giveAndEquipDiamondArmor: 'diamond_armor',
    spawnDragon: 'dragon',
    spawnLighting: 'lightning',
    teleportRandomNearby: 'teleport',
    spawnWhiter: 'wither',
    spawnDomesticDog: 'lobo-domesticado'
};

let connection = null
let connected = false;

export async function tiktokConnection(username) {
    if (connected == true) {
        try {
            log('⚠️| Tiktok connection already exists. Disconnecting first...');
            await disconnectTiktok();
        } catch (error) {
            log(`⚠️| Error disconnecting TikTok: ${error.message}`);
            return;
        }
    }

    connection = new TikTokLiveConnection(username, {
        signApiKey: SING_API_KEY,
        //sessionId: `a77c539bf5296d8f4acc4554984d536c`,
        //ttTargetIdc: `useast1a`,
        //authenticateWs: true,
        enableExtendedGiftInfo: true,
        fetchRoomInfoOnConnect: true,
        requestPollingIntervalMs: 2000,
        disableEulerFallbacks: false,
        webClientHeaders: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
            //'cookie': 'sessionid=a77c539bf5296d8f4acc4554984d536c; tt_target_id=useast1a'
        },
        wsClientHeaders: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
        },
        disableEulerFallbacks: false
    });

    connection.on('webcast_raw', raw => {
        if (raw.messageType === 'WebcastInRoomBannerMessage') return;
        connection._decodeAndEmit(raw);
    });

    connection.connect().then(state => {
        console.info(`Connected to roomId ${state.roomId}`);
        connected = true;
    }).catch(err => {
        console.error('Failed to connect', err);
    });

    connection.on(WebcastEvent.CHAT, data => {
        log(`${data.user.uniqueId} writes: ${data.comment}`, 'var(--tiktok-chat-color)');
    });

    connection.on(WebcastEvent.GIFT, async data => {
        log(`${data.user.uniqueId} sends ${data.giftId}`, 'var(--tiktok-chat-color)');

        try {
            await TiktokGiftRewards(data.giftId);
        } catch (error) {
            log(`⚠️| Error to process TikTok gift: ${error.message}`);
        }
    });

    connection.on(WebcastEvent.LIKE, async data => {
        likeCounts += data.likeCount;

        if (likeCounts >= 50) {
            await handleReward(actions.spawnZombie);
            likeCounts = 0;
        };

        console.log(`Se ah dado like`);
        console.log(likeCounts);
    });


};

export async function disconnectTiktok() {
    console.log(connection.isConnected);
    if (connection.isConnected == true || connection) {
        try {
            await connection.disconnect();
            connected = null;
            log('✅| Tiktok connection closed successfully.');
        } catch (error) {
            log(`⚠️| Error disconnecting TikTok: ${error.message}`);
        }
    }
}

export async function tiktokMain(username) {
    try {
        await tiktokConnection(username);
        return { success: true, message: 'TikTok connection started' };
    } catch (error) {
        log(`⚠️| Error al conectar con TikTok: ${error.message}`);
        return { success: false, message: `Error: ${error.message}` };
    }
}