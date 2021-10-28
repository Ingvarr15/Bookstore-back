module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Roles', [
      {
        id: 1,
        role_name: 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        role_name: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Users', null, {});
  }
};