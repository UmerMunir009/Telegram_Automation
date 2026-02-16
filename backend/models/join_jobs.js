"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class JoinJob extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // If you decide to link back to users later, define it here
    }
  }
  JoinJob.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("running", "completed", "stopped", "failed"),
        defaultValue: "running",
      },
      progress: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      total: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      logs: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      bullJobId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      delay: {
        type: DataTypes.INTEGER,
        defaultValue: 60,
      },
      urls: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "JoinJob",
      tableName: "join_jobs",
      timestamps: true,
      createdAt: "created",
      updatedAt: "updated",
      underscored: false, // Set to true if you prefer created_at over created
    }
  );
  return JoinJob;
};