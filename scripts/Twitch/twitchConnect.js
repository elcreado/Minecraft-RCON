import dotenv from 'dotenv';
import fs from 'fs/promises';

import { RefreshingAuthProvider } from '@twurple/auth';
import { ApiClient } from '@twurple/api';
import { EventSubWsListener } from '@twurple/eventsub-ws';

import { Rcon } from 'rcon-client';

import { handleReward } from '../Minecraft/rconRewards.js';
import { log } from '../logger.js';

dotenv.config({ path: './config.env' });

const { TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, TWITCH_BROADCASTER_LOGIN } = process.env;

let twitchListener;

async function rconText(username, title) {
    try {
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

        r.end();
    } catch (err) {
        console.error('Error al conectar con RCON:', err);
        throw new Error('RCON connection failed');
    }
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
    log('✅ Twitch EventSub WS iniciado');

    twitchListener.onChannelRedemptionAdd(user.id, event => {
        console.log('Listener activado para recompensas de canal');
        (async () => {
            try {
                const username = event.userDisplayName;
                const title = event.rewardTitle;

                log(`🔔 Recompensa redimida por ${username}: ${title}`);
                console.log(`🔔 Recompensa redimida por ${username}: ${title}`);
                // 3) Ejecuta la recompensa (spawn, teleport, etc)

                try {
                    await handleReward(title);
                } catch (err) {
                    log(`⚠️ Has been an error while handling the reward: ${err.message}`);
                }

            } catch (err) {
                log(`⚠️ Has been an error while processing the redemption: ${err.message}`);
            }
        })();
    });
};

export async function twitchMain() {
    try {
        await twitchConnection();
        return { success: true, message: 'Twitch connection started' };
    } catch (error) {
        log(`⚠️| Error al conectar con Twitch: ${error.message}`);
        return { success: false, message: error.message };
    }
}