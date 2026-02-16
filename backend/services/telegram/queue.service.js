const { Queue } = require('bullmq');
const redisConnection = require('../../config/redis');

const joinQueue = new Queue('telegram-join-queue', { 
    connection: redisConnection 
});

module.exports = { joinQueue };