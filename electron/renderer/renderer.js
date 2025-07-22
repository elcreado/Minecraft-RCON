// renderer.js

let tiktokConnection = false;
let twitchConnection = false;
let serverStarted = false;

document.addEventListener('DOMContentLoaded', () => {
  // Elementos del DOM
  const logSection = document.querySelector('.log-section');
  const logOutput = document.getElementById('log-output');
  const toggleLogBtn = document.getElementById('btn-toggle-log');
  const entryCountSpan = document.getElementById('entry-count-span');

  const tiktokBtn = document.getElementById('btn-tiktok');
  const twitchBtn = document.getElementById('btn-twitch');
  const serverBtn = document.getElementById('btn-server');
  const serverStartBtn = document.getElementById('btn-start');
  const saveSettingsBtn = document.getElementById('save-settings');

  // Función para añadir líneas al log
  function appendLog(message, color) {
    const MAX_LOG_LINES = 9;
    const time = new Date().toLocaleTimeString();

    let badgeText = '';
    let badgeClass = '';

    if (color === 'var(--success-color)') {
      badgeText = 'SUCCESS';
      badgeClass = 'badge badge-success';
    } else if (color === 'var(--error-color)') {
      badgeText = 'ERROR';
      badgeClass = 'badge badge-error';
    } else if (color === 'var(--info-color)') {
      badgeText = 'INFO';
      badgeClass = 'badge badge-info';
    } else if (color === 'var(--tiktok-color)') {
      badgeText = 'TIKTOK';
      badgeClass = 'badge badge-tiktok';
    } else if (color === 'var(--twitch-color)') {
      badgeText = 'TWITCH';
      badgeClass = 'badge badge-twitch';
    }
    else {
      badgeText = '';
      badgeClass = '';
    }

    const logEntry = document.createElement('div');
    logEntry.classList.add('log-entry');

    const timeStampSpan = document.createElement('span');
    timeStampSpan.classList.add('timestamp');
    timeStampSpan.textContent = `[${time}] `;
    logEntry.appendChild(timeStampSpan);

    if (badgeText) {
      const badgeSpan = document.createElement('span');
      badgeSpan.className = badgeClass;
      badgeSpan.textContent = badgeText;
      logEntry.appendChild(badgeSpan);
    }

    const messageSpan = document.createElement('span');
    messageSpan.classList.add('message');
    messageSpan.textContent = ` ${message}`;
    logEntry.appendChild(messageSpan);

    if (logOutput.childElementCount >= MAX_LOG_LINES) {
      logOutput.removeChild(logOutput.firstChild);
    }

    logOutput.appendChild(logEntry);
    logOutput.scrollTop = logOutput.scrollHeight;

    entryCountSpan.textContent = `${logOutput.childElementCount} Entities`;
  }

  // Recibimos mensajes desde el main
  window.electronAPI.onLog((msg, color) => {
    appendLog(msg, color);
  });

  // Toggle mostrar/ocultar sección de Log
  toggleLogBtn.addEventListener('click', () => {
    const isHidden = getComputedStyle(logSection).display === 'none';
    logSection.style.display = isHidden ? 'flex' : 'none';
    toggleLogBtn.innerHTML = isHidden
      ? `<i class="fas fa-eye-slash"></i> Ocultar Log`
      : `<i class="fas fa-eye"></i> Mostrar Log`;
  });

  // Conectar / desconectar TikTok
  tiktokBtn.addEventListener('click', async () => {
    const tiktokCard = Array.from(document.querySelectorAll('.service-card')).find(card =>
      card.querySelector('.service-card-header span').textContent.includes('TikTok')
    );

    const statusDot = tiktokCard.querySelector('.status-dot');
    const tiktokText = tiktokCard.querySelector('#tiktok-status');

    if (tiktokConnection == false) {
      const result = await window.electronAPI.startTiktokConnection();

      if (result.success) {
        tiktokBtn.innerHTML = `<i class="fab fa-tiktok"></i> TikTok Connected`;
        tiktokBtn.style.backgroundColor = 'var(--tiktok-color)';
        tiktokConnection = false;

        statusDot.classList.remove('disconnected');
        statusDot.classList.add('connected');
        tiktokText.textContent = 'Connected';

        tiktokConnection = true;
      } else {
        setTimeout(() => {
          tiktokConnection = false;
        }, 2000);
      }

    } else {
      await window.electronAPI.disconnectTiktok();

      tiktokBtn.innerHTML = `<i class="fab fa-tiktok"></i> TikTok Connect`;
      tiktokBtn.style.backgroundColor = 'var(--tiktok-color)';
      tiktokConnection = false;

      statusDot.classList.remove('connected');
      statusDot.classList.add('disconnected');
      tiktokText.textContent = 'Disconnected';

      tiktokConnection = false;
    }
  });

  // Conectar / desconectar Twitch
  twitchBtn.addEventListener('click', async () => {
    const twitchCard = Array.from(document.querySelectorAll('.service-card')).find(card =>
      card.querySelector('.service-card-header span').textContent.includes('Twitch')
    );

    const statusDot = twitchCard.querySelector('.status-dot');
    const twitchText = twitchCard.querySelector('#twitch-status');

    if (twitchConnection == false) {
      const result = await window.electronAPI.startTwitchConnection();

      if (result.success) {
        statusDot.classList.remove('disconnected');
        statusDot.classList.add('connected');
        twitchText.textContent = 'Connected';

        twitchConnection = true;
      } else {
        setTimeout(() => {
          twitchConnection = false;
        }, 2000);
      }
    } else {
      const result = await window.electronAPI.disconnectTwitch();

      statusDot.classList.remove('connected');
      statusDot.classList.add('disconnected');
      twitchText.textContent = 'Disconnected';

      twitchConnection = false;
    }
  });

  serverBtn.addEventListener('click', async () => {
    const result = await window.electronAPI.createMinecraftSv();

    log(result, 'var(--info-color)');
  });

  serverStartBtn.addEventListener('click', async () => {

    if (serverStarted == false) {
      const result = await window.electronAPI.startServer();
      serverStarted = true;
      log(result, 'var(--info-color)');
    } else {
      const result = await window.electronAPI.stopServer();
      serverStarted = false;
      log(result, 'var(--info-color)');
    }


  });

  // Guardar usuarios de TikTok / Twitch
  saveSettingsBtn.addEventListener('click', async () => {
    const tiktokUsername = document.getElementById('tiktok-username').value;
    const twitchUsername = document.getElementById('twitch-username').value;
    const rconIp = document.getElementById('server-ip').value;

    // Reset visual de botones
    tiktokBtn.innerHTML = `<i class="fab fa-tiktok"></i> TikTok Connect`;
    tiktokBtn.style.backgroundColor = 'var(--tiktok-color)';
    tiktokConnection = false;

    twitchBtn.innerHTML = `<i class="fab fa-twitch"></i> Twitch Connect`;
    twitchBtn.style.backgroundColor = 'var(--twitch-color)';
    twitchConnection = false;

    const result = await window.electronAPI.saveSettings({ tiktokUsername, twitchUsername, rconIp });

    appendLog(result.message, 'var(--success-color)');
  });

  // Mensaje inicial
  appendLog('Application successfully loaded!', 'var(--success-color)');
});
