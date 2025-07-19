import { spawn } from 'child_process';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import { Rcon } from 'rcon-client';

import { SignConfig, TikTokLiveConnection, WebcastEvent, ControlEvent, ControlAction } from 'tiktok-live-connector';

import { RefreshingAuthProvider } from '@twurple/auth';
import { ApiClient } from '@twurple/api';
import { EventSubWsListener } from '@twurple/eventsub-ws';

import EventEmitter from 'events';

//Configuracion

dotenv.config({ path: './config.env' });

const emitter = new EventEmitter();
let logCallbacksn = [];
let pendingLogs = [];

let twitchListener;

const {
    SING_API_KEY,
    TIKTOK_USERNAME,
    RCON_HOST,
    RCON_PORT,
    RCON_PASSWORD,
    TWITCH_CLIENT_ID,
    TWITCH_CLIENT_SECRET,
    TWITCH_BROADCASTER_LOGIN,
    TWITCH_USER_TOKEN
} = process.env;

let tiktokRewards = {
    likesTrigger: 50,
    gifts: {}
};

const actions = {
    spawnCreeper: spawnCreeper,
    spawnZombie: spawnZombie,
    giveAndEquipDiamondArmor: giveAndEquipDiamondArmor,
    spawnDragon: spawnDragon,
    spawnLighting: spawnLighting,
    teleportRandomNearby: teleportRandomNearby,
    spawnWhiter: spawnWhiter,
    spawnDomesticDog: spawnDomesticDog
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

export function onLog(callback) {
    logCallbacksn.push(callback);
    pendingLogs.forEach(msg => callback(msg));
    pendingLogs = [];
}

function log(msg)  {
    const formattedMsg = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logCallbacksn.forEach(callback => callback(formattedMsg));
    if (logCallbacksn.length === 0) {
        pendingLogs.push(formattedMsg);
    }
    console.log(formattedMsg);
}

log('🔄| [Index.js] Cargando configuracion...');

//Conexion con Tiktok

SignConfig.apiKey = SING_API_KEY;
const tiktokUsername = TIKTOK_USERNAME;

let likeCounts = 0;

async function TiktokGiftRewards(giftId) {
    const key = String(giftId);
    const reward = tiktokRewards.gifts[key];
    if (!reward) return console.warn(`No hay recompensas para el ID ${key}`);

    console.log("El regalo recibido es = ", key);


    const fn = actions[reward.action];
    await fn(RCON_HOST, RCON_PORT, RCON_PASSWORD);
};

async function tiktokConnection() {
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

//Conexion con Twitch

async function handleReward(title) {
    console.log(`Iniciando `);

    const t = title.toLowerCase();
    const args = [process.env.RCON_HOST, process.env.RCON_PORT, process.env.RCON_PASSWORD];
    if (t.includes('creeper')) await spawnCreeper(...args);
    if (t.includes('zombie')) await spawnZombie(...args);
    if (t.includes('teleport')) await teleportRandomNearby(...args);
    if (t.includes('full-diamond')) await giveAndEquipDiamondArmor(...args);
    if (t.includes('rayo')) await spawnLighting(...args);
    if (t.includes('lobo-domesticado')) await spawnDomesticDog(...args);
    if (t.includes('whiter')) await spawnWhiter(...args);
    if (t.includes('dragon')) await spawnDragon(...args);
}

async function twitchConnection() {
    const authProvider = new RefreshingAuthProvider({
        clientId: TWITCH_CLIENT_ID,
        clientSecret: TWITCH_CLIENT_SECRET,
        // Cada vez que se refresquen tokens, los guardamos
        onRefresh: async (userId, newTokenData) => {
            await fs.writeFile(`./data/tokens/tokens.${userId}.json`, JSON.stringify(newTokenData, null, 4), 'utf-8');
            log(`🔄 Tokens actualizados para ${userId}`);
        }
    });

    // Lee tu archivo de tokens existente (asegúrate de que esté en este formato)
    const tokenData = JSON.parse(await fs.readFile('./data/tokens/tokens.json', 'utf-8'));

    await authProvider.addUserForToken(tokenData, ['channel:read:redemptions']);

    // Crea el cliente de la API de Twitch
    const api = new ApiClient({ authProvider });
    const user = await api.users.getUserByName(TWITCH_BROADCASTER_LOGIN);
    if (!user) {
        throw new Error(`Usuario de Twitch "${TWITCH_BROADCASTER_LOGIN}" no encontrado`);
    }
    log(`▶️ Twitch conectado como: ${user.displayName}`);


    // Inicia el listener de EventSub por WebSockets
    twitchListener = new EventSubWsListener({ authProvider, apiClient: api });
    await twitchListener.start();
    console.log('✅ Twitch EventSub WS iniciado');

    twitchListener.onChannelRedemptionAdd(user.id, event => {
        (async () => {
            try {
                const username = event.userDisplayName;
                const title = event.rewardTitle;

                // 1) Conéctate por RCON
                const r = await Rcon.connect({
                    host: process.env.RCON_HOST,
                    port: Number(process.env.RCON_PORT),
                    password: process.env.RCON_PASSWORD
                });

                // 2) Envía un mensaje al chat
                const msg = [
                    { text: '[Recompensa] ', color: 'gold' },
                    { text: username, color: 'yellow' },
                    { text: ' redimió ', color: 'white' },
                    { text: title, color: 'aqua' }
                ];
                await r.send(`/tellraw @a ${JSON.stringify(msg)}`);

                // 3) Ejecuta la recompensa (spawn, teleport, etc)
                await handleReward(title);

                r.end();
            } catch (err) {
                console.error('Error en reward:', err);
            }
        })();
    });
};

async function spawnZombie(host, port, password) {
    const r = await Rcon.connect({ host, port: Number(port), password });
    await r.send('/execute at @p run summon minecraft:zombie ~1 ~1 ~');
    await r.send('/execute at @p run summon minecraft:zombie ~-1 ~1 ~');
    r.end(); console.log('✅ Zombies');
}
async function spawnCreeper(host, port, password) {
    const r = await Rcon.connect({ host, port: Number(port), password });
    await r.send('/execute at @p run summon minecraft:creeper ~ ~1 ~');
    r.end(); console.log('✅ Creeper');
}

async function giveAndEquipDiamondArmor(host, port, password) {
    const r = await Rcon.connect({ host, port: Number(port), password });
    await r.send('/give @p minecraft:diamond_helmet 1');
    await r.send('/give @p minecraft:diamond_chestplate 1');
    await r.send('/give @p minecraft:diamond_boots 1');
    await r.send('/give @p minecraft:diamond_leggings 1');
    r.end(); console.log('✅ Full diamond');
}

async function teleportRandomNearby(host, port, password) {
    const r = await Rcon.connect({ host, port: Number(port), password });
    const dx = Math.floor(Math.random() * 201) - 100;
    const dz = Math.floor(Math.random() * 201) - 100;
    await r.send(`/tp @p ~${dx} ~ ~${dz}`);
    r.end(); console.log(`✅ Teleported ${dx},${dz}`);
}

async function spawnLighting(host, port, password) {
    const r = await Rcon.connect({ host, port: Number(port), password });
    await r.send('/execute at @p run summon lightning_bolt ~ ~ ~');
    r.end(); console.log('✅ Lightning');
}

async function spawnDomesticDog(host, port, password) {
    const r = await Rcon.connect({ host, port: Number(port), password });
    await r.send('/execute at @p run summon minecraft:wolf ~ ~1 ~ {Tame:1b}');
    r.end(); console.log('✅ Dog');
}

async function spawnWhiter(host, port, password) {
    const r = await Rcon.connect({ host, port: Number(port), password });
    await r.send('/execute at @p run summon minecraft:wither ~ ~10 ~');
    r.end(); console.log('✅ Whiter');
}

async function spawnDragon(host, port, password) {
    const r = await Rcon.connect({ host, port: Number(port), password });
    await r.send('/execute at @p run summon minecraft:ender_dragon ~ ~50 ~');
    r.end(); console.log('✅ EnderDragon');
}


twitchConnection();
tiktokConnection();
