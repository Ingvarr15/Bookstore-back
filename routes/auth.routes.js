const { verifySignUp } = require('../middleware')
const controller = require('../controllers/auth.controller')
const { body } = require('express-validator')
const cors = require('cors')

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      'Access-control-Allow-Headers',
      'x-access-token, Origin, Content-Type, Accept'
    )
    next()
  })

  app.post(
    '/api/auth/signup',
    cors(),
    body('email').isEmail(),
    body('password').isLength({ min: 5 }),
    body('username').isLength({ min: 5 }),
    verifySignUp.checkDuplicateUsernameOrEmail,
    controller.signup
  )
  app.post('/api/auth/signin', controller.signin)
}