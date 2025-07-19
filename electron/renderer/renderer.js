document.addEventListener('DOMContentLoaded', () => {
    const logOutput = document.getElementById('log-output');

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

    appendLog("✅| Application successfully loaded!");
});