const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    onLog: (callback) => ipcRenderer.on("log", (_, msg) => callback(msg)),
    startTiktokConnection: () => ipcRenderer.invoke("start-tiktok-connection"),
    startTwitchConnection: () => ipcRenderer.invoke("start-twitch-connection"),
    saveSettings: (settings) => ipcRenderer.invoke("save-settings", settings)
});
    