// renderer.js

let tiktokConnection = false;
let twitchConnection = false;

document.addEventListener('DOMContentLoaded', () => {
  // Elementos del DOM
  const logSection     = document.querySelector('.log-section');
  const logOutput      = document.getElementById('log-output');
  const toggleLogBtn   = document.getElementById('btn-toggle-log');

  const tiktokBtn      = document.getElementById('btn-tiktok');
  const twitchBtn      = document.getElementById('btn-twitch');
  const saveSettingsBtn= document.getElementById('save-settings');

  // Función para añadir líneas al log
  function appendLog(message, color) {
    const MAX_LOG_LINES = 50;
    const time = new Date().toLocaleTimeString();
    const line = document.createElement('div');

    line.textContent = `[${time}] ${message}`;
    line.style.color   = color || 'var(--text-color)';

    if (logOutput.childElementCount >= MAX_LOG_LINES) {
      logOutput.removeChild(logOutput.firstChild);
    }
    logOutput.appendChild(line);
    logOutput.scrollTop = logOutput.scrollHeight;
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
    if (!tiktokConnection) {
      const result = await window.electronAPI.startTiktokConnection();
      appendLog(result.message);

      if (result.success) {
        tiktokBtn.innerHTML = `<i class="fab fa-tiktok"></i> TikTok Connected`;
        tiktokBtn.style.backgroundColor = 'var(--success-color)';
        tiktokConnection = true;
      } else {
        tiktokBtn.textContent = 'TikTok Connection Failed';
        tiktokBtn.style.backgroundColor = 'var(--error-color)';
        setTimeout(() => {
          tiktokBtn.innerHTML = `<i class="fab fa-tiktok"></i> TikTok Connect`;
          tiktokBtn.style.backgroundColor = 'var(--tiktok-color)';
        }, 2000);
      }
    } else {
      const result = await window.electronAPI.disconnectTiktok();
      tiktokBtn.innerHTML = `<i class="fab fa-tiktok"></i> TikTok Connect`;
      tiktokBtn.style.backgroundColor = 'var(--tiktok-color)';
      tiktokConnection = false;
      appendLog(result.message);
    }
  });

  // Conectar / desconectar Twitch
  twitchBtn.addEventListener('click', async () => {
    if (!twitchConnection) {
      const result = await window.electronAPI.startTwitchConnection();
      appendLog(result.message);

      if (result.success) {
        twitchBtn.innerHTML = `<i class="fab fa-twitch"></i> Twitch Connected`;
        twitchBtn.style.backgroundColor = 'var(--success-color)';
        twitchConnection = true;
      } else {
        twitchBtn.textContent = 'Twitch Connection Failed';
        twitchBtn.style.backgroundColor = 'var(--error-color)';
        setTimeout(() => {
          twitchBtn.innerHTML = `<i class="fab fa-twitch"></i> Twitch Connect`;
          twitchBtn.style.backgroundColor = 'var(--twitch-color)';
        }, 2000);
      }
    } else {
      const result = await window.electronAPI.disconnectTwitch();
      twitchBtn.innerHTML = `<i class="fab fa-twitch"></i> Twitch Connect`;
      twitchBtn.style.backgroundColor = 'var(--twitch-color)';
      twitchConnection = false;
      appendLog(result.message);
    }
  });

  // Guardar usuarios de TikTok / Twitch
  saveSettingsBtn.addEventListener('click', async () => {
    const tiktokUsername = document.getElementById('tiktok-username').value;
    const twitchUsername = document.getElementById('twitch-username').value;

    // Reset visual de botones
    tiktokBtn.innerHTML = `<i class="fab fa-tiktok"></i> TikTok Connect`;
    tiktokBtn.style.backgroundColor = 'var(--tiktok-color)';
    tiktokConnection = false;

    twitchBtn.innerHTML = `<i class="fab fa-twitch"></i> Twitch Connect`;
    twitchBtn.style.backgroundColor = 'var(--twitch-color)';
    twitchConnection = false;

    const result = await window.electronAPI.saveSettings({ tiktokUsername, twitchUsername });
    appendLog(result.message);
  });

  // Mensaje inicial
  appendLog('✅ Application successfully loaded!', 'var(--success-color)');
});
