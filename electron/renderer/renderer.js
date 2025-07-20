let tiktokConnection = false;
let twitchConnection = false;

document.addEventListener('DOMContentLoaded', () => {
    const logOutput = document.getElementById('log-output');
    const logButton = document.getElementById('show-console');

    const tiktokButton = document.getElementById('start-tiktok');
    const twitchButton = document.getElementById('start-twitch');
    const settingsButton = document.getElementById('settings');
    const saveSettingsButton = document.getElementById('save-settings');

    //Catch Electron Application Log messages
    function appendLog(message, color) {
        const MAX_LOG_LINES = 50; // Maximum number of log lines to keep
        const time = new Date().toLocaleTimeString();
        const logLine = document.createElement('div');

        console.log(message, color);

        logLine.textContent = `[${time}] ${message}`;
        logLine.style.color = color || 'var(--text-color)';

        // Limit the number of log lines
        if (logOutput.childElementCount >= MAX_LOG_LINES) {
            logOutput.removeChild(logOutput.firstChild);
        }

        logOutput.appendChild(logLine);
        logOutput.scrollTop = logOutput.scrollHeight;
        console.log(`[${time}] ${message}`);
    }

    window.electronAPI.onLog((msg, color) => {
        appendLog(msg, color);
    });

    //Button to trigger log output

    logButton.addEventListener('click', () => {
        if (logOutput.style.display === 'none' || logOutput.style.display === '') {
            logOutput.style.display = 'block';
        } else {
            logOutput.style.display = 'none';
        }
    });

    // Iniciar conexiones desde botones (opcional)
    tiktokButton?.addEventListener('click', async () => {
        if (tiktokConnection == false) {
            const result = await window.electronAPI.startTiktokConnection();

            appendLog(result.message);

            if (result.success) {
                tiktokButton.textContent = 'TikTok Connected';
                tiktokButton.style.backgroundColor = 'var(--success-color)';
                tiktokConnection = true;
            } else {
                tiktokButton.textContent = 'TikTok Connection Failed';
                tiktokButton.style.backgroundColor = 'var(--error-color)';
                setTimeout(() => {
                    tiktokButton.textContent = 'Tiktok connect';
                    tiktokButton.style.backgroundColor = 'var(--accent-color)';
                    tiktokConnection = false;
                }, 2000);
            }

        } else {
            const result = await window.electronAPI.disconnectTiktok();
            tiktokButton.textContent = 'Tiktok connect';
            tiktokButton.style.backgroundColor = 'var(--accent-color)';
            tiktokConnection = false;

            appendLog(result.message);
        }
    });

    twitchButton?.addEventListener('click', async () => {
        if (twitchConnection == false) {
            const result = await window.electronAPI.startTwitchConnection();

            if (result.success) {
                twitchButton.textContent = 'Twitch Connected';
                twitchButton.style.backgroundColor = 'var(--success-color)';
                twitchConnection = true;
            } else {
                twitchButton.textContent = 'Twitch Connection Failed';
                twitchButton.style.backgroundColor = 'var(--error-color)';
                setTimeout(() => {
                    twitchButton.textContent = 'Twitch connect';
                    twitchButton.style.backgroundColor = 'var(--accent-color)';
                    twitchConnection = false;
                }, 2000);
            }

            appendLog(result.message);
        } else {
            const result = await window.electronAPI.disconnectTwitch();
            twitchButton.textContent = 'Twitch connect';
            twitchButton.style.backgroundColor = 'var(--accent-color)';
            twitchConnection = false;

            appendLog(result.message);
        }
    });

    settingsButton?.addEventListener('click', () => {
        const settingsSection = document.getElementById('settings-section');

        if (settingsSection.style.display === 'none' || settingsSection.style.display === '') {
            settingsSection.style.display = 'block';
        } else {
            settingsSection.style.display = 'none';
        }
    });

    saveSettingsButton?.addEventListener('click', async () => {
        const tiktokUsername = document.getElementById('tiktok-username').value;
        const twitchUsername = document.getElementById('twitch-username').value;

        tiktokButton.textContent = 'Tiktok connect';
        tiktokButton.style.backgroundColor = 'var(--accent-color)';
        tiktokConnection = false;

        twitchButton.textContent = 'Twitch connect';
        twitchButton.style.backgroundColor = 'var(--accent-color)';
        twitchConnection = false;

        const result = await window.electronAPI.saveSettings({ tiktokUsername, twitchUsername });
        appendLog(result.message);
    });

    appendLog("✅| Application successfully loaded!", "var(--success-color)");
});

