"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("users", {
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
      __v: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      deleted: {
        allowNull: true,
        type: Sequelize.DATE,
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
    await queryInterface.dropTable("users");
  },
};