const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const { STATUS_CODES, TEXTS } = require("../../config/constants");
const { Proxy, User } = require("../../models");
const { Op, literal } = require("sequelize");

const addProxies = asyncErrorHandler(async (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(STATUS_CODES.CONFLICT).json({
            statusCode: STATUS_CODES.CONFLICT,
            message: "Access denied. Admins only.",
        });
    }
    const { rawData, protocol } = req.body;

    if (!rawData) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            statusCode: STATUS_CODES.BAD_REQUEST,
            message: "Raw proxy data is required",
        });
    }

    const lines = rawData.split(/\r?\n/);
    const proxyDataArray = [];

    for (let line of lines) {
        const parts = line.trim().split(":");
        if (parts.length >= 2) {
            proxyDataArray.push({
                host: parts[0],
                port: parseInt(parts[1]),
                username: parts[2] || null,
                password: parts[3] || null,
                protocol: protocol || "socks5",
                status: "active",
            });
        }
    }

    if (proxyDataArray.length === 0) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            statusCode: STATUS_CODES.BAD_REQUEST,
            message: "No valid proxy formats detected",
        });
    }

    const createdProxies = await Proxy.bulkCreate(proxyDataArray);

    res.status(STATUS_CODES.CREATED).json({
        statusCode: STATUS_CODES.CREATED,
        message: `${createdProxies.length} proxies added successfully`,
        data: createdProxies,
    });
});

const getAvailableProxies = asyncErrorHandler(async (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(STATUS_CODES.FORBIDDEN).json({
            statusCode: STATUS_CODES.FORBIDDEN,
            message: "Access denied. Admins only.",
        });
    }

    const proxies = await Proxy.findAll({
        attributes: {
            include: [
                [
                    literal(`(
                        SELECT COUNT(*)
                        FROM users AS u
                        WHERE u."proxyId" = "Proxy".id
                        AND u."deleted" IS NULL
                    )`),
                    "usageCount"
                ]
            ]
        },
        where: literal(`(
            SELECT COUNT(*)
            FROM users AS u
            WHERE u."proxyId" = "Proxy".id
            AND u."deleted" IS NULL
        ) < 2`),
        order: [["created", "DESC"]]
    });

    res.status(STATUS_CODES.SUCCESS).json({
        statusCode: STATUS_CODES.SUCCESS,
        message: TEXTS.SUCCESS,
        data: proxies,
    });
});

const deleteProxy = asyncErrorHandler(async (req, res) => {
    const { id } = req.params;

    const activeUsage = await User.count({ where: { proxyId: id } });

    if (activeUsage > 0) {
        return res.status(STATUS_CODES.CONFLICT).json({
            statusCode: STATUS_CODES.CONFLICT,
            message: "Proxy is in use by active accounts and cannot be deleted",
        });
    }

    const result = await Proxy.destroy({ where: { id } });

    if (!result) {
        return res.status(STATUS_CODES.NOT_FOUND).json({
            statusCode: STATUS_CODES.NOT_FOUND,
            message: "Proxy not found",
        });
    }

    res.status(STATUS_CODES.SUCCESS).json({
        statusCode: STATUS_CODES.SUCCESS,
        message: TEXTS.DELETED,
    });
});



module.exports = {
    addProxies,
    getAvailableProxies,
    deleteProxy

};
