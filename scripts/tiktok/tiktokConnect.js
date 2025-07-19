import { SignConfig, TikTokLiveConnection, WebcastEvent, ControlEvent, ControlAction } from 'tiktok-live-connector';
import dotenv from 'dotenv';

import {log} from '../logger.js';

dotenv.config({ path: './config.env' });

const { SING_API_KEY, TIKTOK_USERNAME, RCON_HOST, RCON_PORT, RCON_PASSWORD } = process.env;

async function TiktokGiftRewards(giftId) {
    const key = String(giftId);
    const reward = tiktokRewards.gifts[key];
    if (!reward) return console.warn(`No hay recompensas para el ID ${key}`);

    console.log("El regalo recibido es = ", key);


    const fn = actions[reward.action];
    await fn(RCON_HOST, RCON_PORT, RCON_PASSWORD);
};

//Conexion con Tiktok

SignConfig.apiKey = SING_API_KEY;
const tiktokUsername = TIKTOK_USERNAME;

let likeCounts = 0;

export async function tiktokConnection() {
    const connection = new TikTokLiveConnection(tiktokUsername, {
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
    }).catch(err => {
        console.error('Failed to connect', err);
    });

    connection.on(WebcastEvent.CHAT, data => {
        console.log(`${data.user.uniqueId} (userId:${data.user.uniqueId}) writes: ${data.comment}`);
    });

    connection.on(WebcastEvent.GIFT, async data => {
        console.log(`${data.user.uniqueId} (userId:${data.user.userId}) sends ${data.giftId}`);
        await TiktokGiftRewards(data.giftId);
    });

    connection.on(WebcastEvent.LIKE, async data => {
        likeCounts += data.likeCount;

        if (likeCounts >= 50) {
            await spawnZombie(RCON_HOST, RCON_PORT, RCON_PASSWORD);
            likeCounts = 0;
        };

        console.log(`Se ah dado like`);
        console.log(likeCounts);
    });
};
