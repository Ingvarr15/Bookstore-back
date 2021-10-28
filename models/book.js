'use strict';
const {
  Model
} = require('sequelize');
const { Sequelize } = require('.');
module.exports = (sequelize, DataTypes) => {
  class Book extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {

      Book.belongsTo(models.User)
    }
  };
  Book.init({
    img: DataTypes.STRING,
    img2: DataTypes.STRING,
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
    genre: DataTypes.STRING,
    author: DataTypes.STRING,
    price: DataTypes.FLOAT,
    rating: DataTypes.FLOAT,

  }, {
    sequelize,
    modelName: 'Book',
  });
  return Book;
};