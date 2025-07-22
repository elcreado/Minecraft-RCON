const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    onLog: (callback) => ipcRenderer.on("log", (_, msg, color) => callback(msg, color)),
    startTiktokConnection: () => ipcRenderer.invoke("start-tiktok-connection"),
    startTwitchConnection: () => ipcRenderer.invoke("start-twitch-connection"),
    disconnectTiktok: () => ipcRenderer.invoke("disconnect-tiktok"),
    disconnectTwitch: () => ipcRenderer.invoke("disconnect-twitch"),
    saveSettings: (settings) => ipcRenderer.invoke("save-settings", settings),
    createMinecraftSv: () => ipcRenderer.invoke("create-server"),
    startServer: () => ipcRenderer.invoke("start-server"),
    stopServer: () => ipcRenderer.invoke("stop-server")
});
    