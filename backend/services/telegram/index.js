const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { Proxy, User } = require("../../models");
const { STATUS_CODES } = require("../../config/constants");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const { Api } = require("telegram");

const activeClients = {};

const loginAccount = asyncErrorHandler(async (req, res) => {
    console.log("--- TELEGRAM LOGIN REQUEST RECEIVED ---");
    const { phone, name, proxyId } = req.body;

    if (!phone || !name) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: "Alias name and phone number are required",
        });
    }

    let proxyOptions = null;
    if (proxyId) {
        const proxy = await Proxy.findByPk(proxyId);
        if (proxy) {
            console.log(` USING PROXY: ${proxy.host}:${proxy.port}`);
            proxyOptions = {
                ip: proxy.host,
                port: parseInt(proxy.port),
                socksType: 5,
                password: proxy.password,
                username: proxy.username
            };
        }
    }

    const client = new TelegramClient(
        new StringSession(""),
        parseInt(process.env.TELEGRAM_API_ID),
        process.env.TELEGRAM_API_HASH,
        {
            connectionRetries: 5,
            proxy: proxyOptions,
            timeout: 30000,
            deviceModel: "Automation Core v1",
            receiveUpdates: false
        }
    );

    try {
        console.log(" Attempting to connect to Telegram...");
        await client.connect();
        console.log("TELEGRAM CLIENT CONNECTED");

        console.log(`Requesting OTP for ${phone}...`);
        const { phoneCodeHash } = await client.sendCode(
            {
                apiId: parseInt(process.env.TELEGRAM_API_ID),
                apiHash: process.env.TELEGRAM_API_HASH,
            },
            phone
        );

        console.log(`OTP SENT SUCCESSFULLY. Hash: ${phoneCodeHash}`);

        activeClients[phone] = {
            client,
            phoneCodeHash,
            name,
            proxyId,
            timestamp: Date.now()
        };

        res.status(STATUS_CODES.SUCCESS).json({
            success: true,
            message: "OTP_SENT_SUCCESSFULLY",
            data: { phoneCodeHash }
        });

    } catch (err) {
        console.error(" GRAMJS ERROR:", err.message);
        if (client) await client.disconnect();

        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: `Telegram Error: ${err.message}`
        });
    }
});


const finalizeUserSession = async (client, phone, name, proxyId, res, createdMessage) => {
    const savedSession = client.session.save();

    const [user, created] = await User.upsert({
        phone: phone,
        name: name,
        sessionString: savedSession,
        proxyId: proxyId || null,
        accountStatus: 'active',
        role: 'user'
    });

    try {
        console.log(`Cleanup: Terminating session for ${phone}`);
        if (client._updateLoop) client._updateLoop = false;
        await client.disconnect();
    } catch (e) {
        console.log("Cleanup handled: Socket already closed.");
    }

    delete activeClients[phone];

    return res.status(STATUS_CODES.SUCCESS).json({
        success: true,
        message: created ? "ACCOUNT_CREATED" : "ACCOUNT_UPDATED",
        data: { id: user.id, name: user.name, phone: user.phone }
    });
};




const verifyAccount = asyncErrorHandler(async (req, res) => {
    const { phone, code, password } = req.body;
    const sessionData = activeClients[phone];

    if (!sessionData) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: "Session expired or not found. Please restart the process."
        });
    }

    const { client, name, proxyId } = sessionData;

    try {
        await client.start({
            phoneNumber: async () => phone,
            phoneCode: async () => code,
            password: async () => password,
            onError: (err) => { throw err; }
        });

        console.log(`Success: Account ${phone} fully authorized.`);
        return await finalizeUserSession(client, phone, name, proxyId, res);

    } catch (error) {
        const msg = error.message.toUpperCase();
        console.error(`Verification Logic Error: ${msg}`);

        if (msg.includes("PASSWORD_HASH_INVALID")) {
            return res.status(402).json({
                success: false,
                requires2FA: true,
                message: "Incorrect Cloud Password. Please try again."
            });
        }

        if (
            (msg.includes("SESSION_PASSWORD_NEEDED") || msg.includes("2FA") || msg.includes("PASSWORD IS EMPTY")) &&
            (!password || password.trim() === "")
        ) {
            console.log(`Security: Killing session for ${phone} - Password missing.`);
            if (activeClients[phone]) delete activeClients[phone];

            return res.status(403).json({
                success: false,
                requires2FA: true,
                killed: true,
                message: "2FA Required. Session terminated due to missing password."
            });
        }

        if (msg.includes("SESSION_PASSWORD_NEEDED") || msg.includes("2FA")) {
            return res.status(200).json({
                success: false,
                requires2FA: true,
                message: "Cloud Password required."
            });
        }

        if (msg.includes("PHONE_CODE_INVALID")) {
            return res.status(400).json({
                success: false,
                message: "The OTP code entered is incorrect."
            });
        }

        // Fallback
        res.status(500).json({
            success: false,
            message: error.message || "An unexpected error occurred."
        });
    }
});



setInterval(() => {
    const now = Date.now();
    Object.keys(activeClients).forEach(phone => {
        if (now - activeClients[phone].timestamp > 15 * 60 * 1000) {
            console.log(`Cleaning up expired session for: ${phone}`);
            activeClients[phone].client.disconnect();
            delete activeClients[phone];
        }
    });
}, 5 * 60 * 1000);


const joinGroup = asyncErrorHandler(async (req, res) => {
    const { phone, channelUrl } = req.body;

    if (!phone || !channelUrl) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: "Phone number and Target URL are required",
        });
    }

    const user = await User.findOne({
        where: { phone: phone },
        include: [{ model: Proxy, as: 'proxy' }]
    });

    if (!user || !user.sessionString) {
        return res.status(STATUS_CODES.NOT_FOUND).json({
            success: false,
            message: "Active session not found for this account",
        });
    }

    let proxyOptions = null;
    if (user.proxy) {
        proxyOptions = {
            ip: user.proxy.host,
            port: parseInt(user.proxy.port),
            socksType: 5,
            password: user.proxy.password,
            username: user.proxy.username
        };
    }

    const client = new TelegramClient(
        new StringSession(user.sessionString),
        parseInt(process.env.TELEGRAM_API_ID),
        process.env.TELEGRAM_API_HASH,
        {
            connectionRetries: 5,
            proxy: proxyOptions,
            deviceModel: "Automation Core v1",
            receiveUpdates: false,
            autoReconnect: false,
            timeout: 20000,
        }
    );

    try {
        const connectionTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("SESSION_CONNECTION_HANG")), 10000)
        );

        console.log(`[${phone}] Connecting to Telegram...`);

        await Promise.race([
            client.connect(),
            connectionTimeout
        ]);

        if (client._updateLoop) client._updateLoop = false;

        console.log(`[${phone}] Attempting to join: ${channelUrl}`);

        if (channelUrl.includes('t.me/+') || channelUrl.includes('joinchat/')) {
            const hash = channelUrl.split('/').pop().replace('+', '');
            await client.invoke(
                new Api.messages.ImportChatInvite({ hash: hash })
            );
        } else {
            const cleanUsername = channelUrl.replace('https://t.me/', '').replace('@', '');
            await client.invoke(
                new Api.channels.JoinChannel({
                    channel: cleanUsername,
                })
            );
        }

        await client.disconnect();

        return res.status(STATUS_CODES.SUCCESS).json({
            success: true,
            message: `Successfully joined ${channelUrl}`,
        });

    } catch (err) {
        console.error(`JOIN_ERROR [${phone}]:`, err.message);

        if (client) {
            try { await client.disconnect(); } catch (e) { /* ignore secondary error */ }
        }

        const errorMessage = err.message;

        const isSessionInvalid =
            errorMessage.includes("AUTH_KEY_UNREGISTERED") ||
            errorMessage.includes("SESSION_REVOKED") ||
            errorMessage.includes("SESSION_EXPIRED") ||
            errorMessage.includes("USER_DEACTIVATED") ||
            errorMessage === "SESSION_CONNECTION_HANG";

        if (isSessionInvalid) {
            return res.status(STATUS_CODES.UNAUTHORIZED).json({
                success: false,
                message: "session expired relogin",
            });
        }

        let userFriendlyError = errorMessage;
        if (errorMessage.includes("FLOOD_WAIT")) userFriendlyError = "Rate limit hit. Wait before next join.";
        if (errorMessage.includes("TIMEOUT")) userFriendlyError = "Proxy connection timeout.";
        if (errorMessage.includes("CHANNELS_TOO_MUCH")) userFriendlyError = "Account is in too many groups.";

        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: userFriendlyError,
        });
    }
});



const sendSingle = asyncErrorHandler(async (req, res) => {
    const { targetHandle, message, senderId } = req.body;

    const sender = await User.findOne({
        where: { id: senderId, accountStatus: 'active' },
        include: [{ model: Proxy, as: 'proxy' }]
    });

    if (!sender) {
        return res.status(404).json({ success: false, message: "Sender session not active" });
    }

    let client;
    try {
        let proxyOptions = sender.proxy ? {
            ip: sender.proxy.host,
            port: parseInt(sender.proxy.port),
            socksType: 5,
            password: sender.proxy.password,
            username: sender.proxy.username
        } : null;

        client = new TelegramClient(
            new StringSession(sender.sessionString),
            parseInt(process.env.TELEGRAM_API_ID),
            process.env.TELEGRAM_API_HASH,
            { connectionRetries: 1, proxy: proxyOptions }
        );

        await client.connect();
        const entity = await client.getEntity(targetHandle);
        await client.sendMessage(entity, { message });

        await client.disconnect();
        return res.status(STATUS_CODES.SUCCESS).json({ success: true, message: `Sent to ${targetHandle}` });

    } catch (err) {
        if (client) await client.disconnect();
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: err.message });
    }
});

module.exports = {
    loginAccount,
    joinGroup,
    verifyAccount,
    sendSingle
};