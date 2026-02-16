const Redis = require('ioredis');
require('dotenv').config();

const redisConnection = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    connectTimeout: 10000, 
    family: 0,        
    tls: {
        rejectUnauthorized: false 
    }
});

redisConnection.on('connect', () => {
    console.log('✅ Connected to Upstash Redis');
});

redisConnection.on('error', (err) => {
    console.error('Redis Connection Error:', err.message);
});

module.exports = redisConnection;