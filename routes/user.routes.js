const { authJwt } = require('../middleware')
const controller = require('../controllers/user.controller')
const { validation } = require('../middleware')

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      'Access-Control-Allow-Headers',
      'x-access-token, Origin, Content-Type, Accept'
    )
    next()
  })

  app.get(
    '/check',
    authJwt.checkToken
  )

  app.post(
    '/signout',
    authJwt.signOut
  )

  app.get(
    '/user', 
    authJwt.verifyToken,
    controller.getPersonal
  )

  app.patch(
    '/user-change',
    authJwt.verifyToken,
    validation,
    controller.updatePersonal
  )

  app.delete(
    '/api/personal/',
    authJwt.verifyToken,
    controller.deletePersonal
  )

  app.post(
    '/upload',
    controller.uploadBook
  )

  app.get(
    '/get-books',
    controller.getBooks
  )

  app.delete(
    '/delete-book',
    controller.deleteBooks
  )

  app.post(
    '/post-comment',
    controller.sendComment
  )

  app.get(
    '/get-comments',
    controller.getComments
  )

  app.patch(
    '/set-socket',
    controller.setSocket
  )

  app.get(
    '/get-replies',
    controller.getReplies
  )

  app.patch(
    '/check-replies',
    controller.checkReplies
  )

  app.get(
    '/get-one-book',
    controller.getOneBook
  )
}