const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    get() {
      const value = this.getDataValue('created_at');
      return value ? Math.floor(value.getTime() / 1000) : null;
    }
  },
  updated_at: {
    type: DataTypes.DATE,
    get() {
      const value = this.getDataValue('updated_at');
      return value ? Math.floor(value.getTime() / 1000) : null;
    }
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = User;
