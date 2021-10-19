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
      // Book.belongsTo(models.User, {
      //   as: 'book',
      //   constraints: false
      // })
      Book.belongsTo(models.User)
    }
  };
  Book.init({
    img: DataTypes.BLOB,
    img2: DataTypes.BLOB,
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
    genre: DataTypes.STRING,
    author: DataTypes.STRING,
    price: DataTypes.FLOAT,
    rating: DataTypes.FLOAT,
    // userId: {
    //   type: DataTypes.INTEGER,
    //   references: 'Users',
    //   referencesKey: 'id',
    // },
  }, {
    sequelize,
    modelName: 'Book',
  });
  return Book;
};