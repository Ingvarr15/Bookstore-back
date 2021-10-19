'use strict';
const {
  Model
} = require('sequelize');
const { Sequelize } = require('.');
const role = require('./role');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      User.belongsTo(models.Role)
      // User.hasMany(models.Book)
      // User.hasMany(models.Book, {
      //   foreignKey: 'id',
      //   as: 'books'
      // })
    }
  };
  
  User.init({
    username: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      unique: true
    },
    password: DataTypes.STRING,
    dob: DataTypes.DATEONLY,
    socket: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};