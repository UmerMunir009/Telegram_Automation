const Redis = require('ioredis');
require('dotenv').config();

const redisUrl = process.env.REDIS_URL;

const redisConnection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    connectTimeout: 15000, 
    // Only apply TLS if the URL starts with 'rediss://' (Upstash style)
    // If it's 'redis://' (Railway style), we set tls to null
    tls: redisUrl && redisUrl.startsWith('rediss://') ? {
        rejectUnauthorized: false 
    } : null
});

redisConnection.on('connect', () => {
    console.log('✅ Redis Connection Established');
});

redisConnection.on('error', (err) => {
    console.error('Redis Connection Error:', err.message);
});

module.exports = redisConnection;