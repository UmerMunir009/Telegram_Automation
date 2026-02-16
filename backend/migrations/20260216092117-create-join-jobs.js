"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("join_jobs", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        primaryKey: true,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("running", "completed", "stopped", "failed"),
        defaultValue: "running",
        allowNull: false,
      },
      progress: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      total: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      logs: {
        type: Sequelize.JSONB,
        defaultValue: [],
      },
      bullJobId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      delay: {
        type: Sequelize.INTEGER,
        defaultValue: 60,
      },
      urls: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      created: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated: {
        allowNull: true,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("join_jobs");
  },
};