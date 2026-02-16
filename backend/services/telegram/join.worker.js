const { Worker } = require('bullmq');
const redisConnection = require('../../config/redis');
const { JoinJob } = require('../../models');
const telegramController = require('./index'); 

const joinWorker = new Worker(
    'telegram-join-queue',
    async (job) => {
        const { dbJobId, accounts, urls, delay } = job.data;

        for (let i = 0; i < accounts.length; i++) {
            const dbJob = await JoinJob.findByPk(dbJobId);
            if (!dbJob || dbJob.status === 'stopped') {
                console.log(`🛑 Job ${dbJobId} stopped by user.`);
                break;
            }

            const account = accounts[i];
            const url = urls[i % urls.length];

            try {
                console.log(`Processing: ${account.phone}`);

                await telegramController.internalJoinLogic(account.phone, url);

                const newLogs = [...(dbJob.logs || []), {
                    timestamp: new Date().toLocaleTimeString(),
                    message: `✅ SUCCESS: ${account.phone} joined`,
                    type: 'success'
                }];

                await dbJob.update({
                    progress: i + 1,
                    logs: newLogs
                });

            } catch (err) {
                const errLogs = [...(dbJob.logs || []), {
                    timestamp: new Date().toLocaleTimeString(),
                    message: `❌ FAILED: ${account.phone} - ${err.message}`,
                    type: 'error'
                }];

                await dbJob.update({
                    progress: i + 1,
                    logs: errLogs
                });
            }

            if (i < accounts.length - 1) {
                const waitTime = delay || 30; 
                console.log(`⏳ Waiting ${waitTime} seconds before next account...`);
                await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
            }
        }

        const finalJob = await JoinJob.findByPk(dbJobId);
        if (finalJob && finalJob.status !== 'stopped') {
            await finalJob.update({ status: 'completed' });
            console.log(`🏁 Job ${dbJobId} Finished`);
        }
    },
    {
        connection: redisConnection,
        concurrency: 1 
    }
);

module.exports = joinWorker;