const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
    define: {
      timestamps: true, // Включаем автоматические timestamps
      createdAt: 'created_at', // Переименовываем для соответствия ТЗ
      updatedAt: 'updated_at'
    }
  }
);

module.exports = sequelize;
