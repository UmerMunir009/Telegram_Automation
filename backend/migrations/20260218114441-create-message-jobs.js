"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("message_jobs", {
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
      },
      created: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("message_jobs");
  },
};