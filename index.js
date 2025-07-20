import { spawn } from 'child_process';
import dotenv from 'dotenv';

import { log, onLog } from './scripts/logger.js';

//Configuracion

dotenv.config({ path: './config.env' });


export async function __init() {
    log('🔰| Application started.');
}

