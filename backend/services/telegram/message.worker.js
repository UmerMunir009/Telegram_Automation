const { Worker } = require('bullmq');
const redisConnection = require('../../config/redis');
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { MessageJob, User, Proxy } = require("../../models");

const messageWorker = new Worker('telegram-message-queue', async (job) => {
    const { dbJobId, senderIds, targets, message, delay } = job.data;
    
    const dbJob = await MessageJob.findByPk(dbJobId);
    if (!dbJob) return;

    const addLog = async (msg, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        const updatedLogs = [...(dbJob.logs || []), { timestamp, msg, type }].slice(-20);
        await dbJob.update({ logs: updatedLogs });
    };

    for (let i = 0; i < targets.length; i++) {
        const currentStatus = await MessageJob.findByPk(dbJobId, { attributes: ['status'] });
        if (currentStatus.status === 'stopped') {
            await addLog("Campaign stopped by user.", "error");
            return;
        }

        const target = targets[i];
        const currentSenderId = senderIds[i % senderIds.length];
        const sender = await User.findByPk(currentSenderId, {
            include: [{ model: Proxy, as: 'proxy' }]
        });

        if (!sender) {
            await addLog(`Skipping: Sender ID ${currentSenderId} not found.`, "error");
            continue;
        }

        let client;
        try {
            await addLog(`Attempting delivery to ${target} via ${sender.name}...`);

            client = new TelegramClient(
                new StringSession(sender.sessionString),
                parseInt(process.env.TELEGRAM_API_ID),
                process.env.TELEGRAM_API_HASH,
                {
                    connectionRetries: 1,
                    proxy: sender.proxy ? {
                        ip: sender.proxy.host,
                        port: parseInt(sender.proxy.port),
                        socksType: 5,
                        password: sender.proxy.password,
                        username: sender.proxy.username
                    } : null
                }
            );

            await client.connect();
            
            const entity = await client.getEntity(target);
            await client.sendMessage(entity, { message });
            
            await dbJob.update({ current: i + 1 });
            await addLog(`[OK] Delivered to ${target}`, "success");

        } catch (err) {
            let errorType = 'error';
            let errorMsg = err.message;

            if (errorMsg.includes("FLOOD_WAIT")) errorType = "warning";
            if (errorMsg.includes("PEER_FLOOD")) errorMsg = "Account restricted (Spam limit)";

            await addLog(`[FAIL] ${target}: ${errorMsg}`, errorType);
        } finally {
            if (client) await client.disconnect();
        }

        if (i < targets.length - 1) {
            const jitter = (Math.random() * 0.2 + 0.9); 
            const finalSleep = Math.floor(delay * 1000 * jitter);
            await new Promise(resolve => setTimeout(resolve, finalSleep));
        }
    }

    await dbJob.update({ status: 'completed' });
    await addLog("Campaign Finished Successfully.", "info");

}, { 
    connection: redisConnection,
    concurrency: 5 ,
    removeOnComplete: { count: 100 }, 
    removeOnFail: { count: 500 },
    drainDelay: 5
});

module.exports = messageWorker;