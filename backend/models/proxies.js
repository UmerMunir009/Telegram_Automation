"use strict";
const { Model, Sequelize } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class Proxy extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         */
        static associate(models) {
            Proxy.hasMany(models.User, { foreignKey: "proxyId", as: "users" });
        }
    }

    Proxy.init(
        {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.literal("gen_random_uuid()"),
                primaryKey: true,
                allowNull: false,
            },
            host: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            port: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            username: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            password: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            protocol: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            status: {
                type: Sequelize.ENUM("active", "dead", "blocked"),
                defaultValue: "active",
            },
        },
        {
            sequelize,
            modelName: "Proxy",
            tableName: "proxies",
            createdAt: "created",
            updatedAt: "updated",
            timestamps: true,
        }
    );

    return Proxy;
};