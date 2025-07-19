import EventEmitter from 'events';

const emitter = new EventEmitter();
let logCallbacksn = [];
let pendingLogs = [];

export function onLog(callback) {
    logCallbacksn.push(callback);
    pendingLogs.forEach(msg => callback(msg));
    pendingLogs = [];
}

export function log(msg)  {
    const formattedMsg = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logCallbacksn.forEach(callback => callback(formattedMsg));
    if (logCallbacksn.length === 0) {
        pendingLogs.push(formattedMsg);
    }
    console.log(formattedMsg);
}

log('🔄| [Index.js] Cargando configuracion...');