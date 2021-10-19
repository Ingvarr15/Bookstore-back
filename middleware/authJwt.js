const jwt = require('jsonwebtoken')
const config = require('../config/auth.config.js')

verifyToken = (req, res, next) => {
  let token = req.cookies.token

  if (!token) {
    return res.status(403).send({
      message: 'No token provided'
    })
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: 'Unauthorized'
      })
    }
    req.userId = decoded.userId
    next()
  })
}

checkToken = (req, res) => {
  let token = req.cookies.token
  if (!token) {
    return res.status(403).send({
      message: 'No token provided'
    })
  } else {
    return res.status(200).send({
      message: 'OK'
    })
  }
}

signOut = (req, res) => {
  res.clearCookie('token')
  console.log('1')
  return res.status(200).send({
    message: 'OK'
  })
}

const authJwt = {
  verifyToken: verifyToken,
  checkToken: checkToken,
  signOut: signOut
}
module.exports = authJwt