"use strict";
const { Model,Sequelize } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.belongsTo(models.Proxy, { foreignKey: "proxyId", as: "proxy" });
    }
  }

  User.init(
    {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true, 
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true, 
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: true, 
      },
      role: {
        type: Sequelize.ENUM("user", "admin"),
        allowNull: false,
        defaultValue: "user",
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true, 
        unique: true,
      },
      sessionString: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      proxyId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "proxies",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      accountStatus: {
        type: Sequelize.ENUM("active", "banned", "flood_wait", "restricted"),
        defaultValue: "active",
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      createdAt: "created",
      updatedAt: "updated",
      deletedAt: "deleted",
      timestamps: true,
      paranoid: true,
    }
  );

  return User;
};