"use strict";
const { Model,Sequelize } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class MessageJob extends Model {
    static associate(models) {
    }
  }
  MessageJob.init(
    {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        primaryKey: true,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("running", "completed", "stopped", "failed"),
        defaultValue: "running",
      },
      current: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      total: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      targets: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      senderIds: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      logs: {
        type: Sequelize.JSONB,
        defaultValue: [],
      },
      bullJobId: {
        type: Sequelize.STRING,
      },
      delay: {
        type: Sequelize.INTEGER,
      }
    },
    {
      sequelize,
      modelName: "MessageJob",
      tableName: "message_jobs",
      timestamps: true,
      createdAt: "created",
      updatedAt: "updated",
    }
  );
  return MessageJob;
};