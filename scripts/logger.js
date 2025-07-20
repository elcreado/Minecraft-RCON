import EventEmitter from 'events';

const emitter = new EventEmitter();
let logCallbacksn = [];
let pendingLogs = [];

export function onLog(callback) {
    logCallbacksn.push(callback);
    console.log(pendingLogs);
    pendingLogs.forEach(({ msg, color }) => callback(msg, color));
    pendingLogs = [];
}

export function log(msg, color)  {
    const formattedMsg = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logCallbacksn.forEach(callback => callback(formattedMsg, color));
    if (logCallbacksn.length === 0) {
        pendingLogs.push({ msg: formattedMsg, color });
    }
}

log('🔄| [Index.js] Cargando configuracion...');