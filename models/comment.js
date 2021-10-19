'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Comment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Comment.belongsTo(models.Book)
      Comment.belongsTo(models.User)
      // define association here
    }
  };
  Comment.init({
    text: DataTypes.TEXT,
    replyTo: DataTypes.INTEGER,
    checked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'Comment',
  });
  return Comment;
};