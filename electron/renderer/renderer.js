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
    function appendLog(message) {
        const time = new Date().toLocaleTimeString();
        logOutput.textContent += `\n[${time}] ${message}`;
        logOutput.scrollTop = logOutput.scrollHeight;
        console.log(`[${time}] ${message}`);
    }

    window.electronAPI.onLog(msg => {
        appendLog(msg);
    });

    //Button to trigger log output

    logButton.addEventListener('click', () => {
        if (logOutput.style.display === 'none') {
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

        }
    });

    twitchButton?.addEventListener('click', async () => {
        if (twitchConnection == false) {
            const result = await window.electronAPI.startTwitchConnection();

            twitchButton.textContent = 'Twitch Connected';
            twitchButton.style.backgroundColor = 'var(--success-color)';

            appendLog(result.message);
            twitchConnection = true;
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

        const result = await window.electronAPI.saveSettings({ tiktokUsername, twitchUsername });
        appendLog(result.message);
    });

    appendLog("✅| Application successfully loaded!");
});

