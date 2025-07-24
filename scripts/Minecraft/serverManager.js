export async function stopServer(serverProcess, timeoutMs = 5000) {
    return new Promise((resolve) => {
        if (!serverProcess) return resolve(false);

        try {
            serverProcess.stdin.write('stop\n');        
        } catch (err) {

        }

        const onClose = () => {
            serverProcess = null;
            clearTimeout(timer);
            resolve(true);
        }

        serverProcess.once('close', onClose);
        serverProcess.once('exit', onClose);

        const timer = setTimeout(() => {
            if(serverProcess && !serverProcess.killed) {
                serverProcess.kill('SIGKILL');
            }
        }, timeoutMs);

    });
}