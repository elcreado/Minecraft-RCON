import dotenv from 'dotenv';

import { Rcon } from 'rcon-client';

import { loadSettings } from '../saveSettings.js';
import { log } from '../logger.js';

dotenv.config({ path: './config.env' });

export async function handleReward(title) {
    const t = title.toLowerCase();
    const settings = await loadSettings();
    const serverIp = settings.rconIp;

    log(`Server responding in ${serverIp}`, 'var(--info-color)');

    const args = [serverIp, process.env.RCON_PORT, process.env.RCON_PASSWORD];
    if (t.includes('creeper')) await spawnCreeper(...args);
    if (t.includes('zombie')) await spawnZombie(...args);
    if (t.includes('teleport')) await teleportRandomNearby(...args);
    if (t.includes('full-diamond')) await giveAndEquipDiamondArmor(...args);
    if (t.includes('rayo')) await spawnLighting(...args);
    if (t.includes('lobo-domesticado')) await spawnDomesticDog(...args);
    if (t.includes('whiter')) await spawnWhiter(...args);
    if (t.includes('dragon')) await spawnDragon(...args);
}

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