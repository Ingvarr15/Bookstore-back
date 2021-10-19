const db = require('../models')
const User = db.User
const Book = db.Book
// const Reply = db.Replies
const Comment = db.Comment
const jwt = require('jsonwebtoken')
const config = require('../config/auth.config.js')
let cryptoJS = require("crypto-js")
const crypto = require('crypto')
const fs = require('fs')
const { Op } = require('sequelize')


exports.getPersonal = (req, res) => {
  let token = req.cookies.token
  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: 'Unauthorized'
      })
    }
    userId = decoded.id
    User.findByPk(userId).then(user => {
      return res.status(200).send({
        id: user.id,
        username: user.username,
        email: user.email,
        dob: user.dob,
        role: user.RoleId
      })
    })
    .catch(err => {
      res.clearCookie('token')
      res.status(404).send({
        message: 'User not found'
      })
    })
  })
}

exports.updatePersonal = (req, res) => {
  let token = req.cookies.token
  let targetField
  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: 'Unauthorized'
      })
    }
    userId = decoded.id
    let { username, email, password, dob } = req.body
    User.findByPk(userId).then(user => {
      if (username) {
        user.username = username
      }
      if (email) {
        user.email = email
        targetField = 'email'
      }
      if (password) {
        user.password = cryptoJS.AES.encrypt(password, config.secret).toString()
      }
      if (dob) {
        user.dob = dob
        targetField = 'dob'
      }
      return user
    })
    .then((user) => {
      user.save().then(success, fail)
    })
  })

  function success(user) {
      return res.status(200).send(user)
  }

  function fail() {
      let message
      switch (targetField) {
        case 'email':
          message = 'Email is already in use'
          break
        case 'dob':
          message = 'Date of birth is not valid'
          break
      }
      return res.status(409).send({message})
  }
}

exports.deletePersonal = (req, res) => {
  let token = req.headers['x-access-token']
  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: 'Unauthorized'
      })
    }
    userId = decoded.id
    User.findByPk(userId).then(user => {
      user.destroy();
      return res.status(204).send({
        message: 'User has been deleted'
      })
    })
  })
}

exports.sendComment = async (req, res) => {
  let token = req.cookies.token
  let userId
  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: 'Unauthorized'
      })
    }
    userId = decoded.id
  })
    try {
      let userOwner = await User.findByPk(userId)
      let bookOwner = await Book.findByPk(req.body.bookId)
      let comment = await Comment.create({
        text: req.body.text,
        replyTo: req.body.replyTo !== '' ? req.body.replyTo : null
      })
      await comment.setUser(userOwner)
      await comment.setBook(bookOwner)

      if (req.body.replyTo !== '') {
        let replyTarget = await User.findByPk(req.body.replyTo)
        let targetBook = await comment.getBook()
        let replier = await comment.getUser()

        io.to(replyTarget.socket).emit('newReply', {
          book: targetBook.id,
          replier: replier.id,
          text: comment.text
        })


        // comment.replyTo = replyTarget.id
        // Reply.create({
        //   targetId: replyTarget.id,
        //   book: targetBook.id,
        //   replier: replier.id,
        //   text: comment.text,
        // })
      }
      io.emit('newComment')
      res.status(200).send('ok')
    } catch(error) {
      console.log(error)
    }
}

exports.getReplies = async (req, res) => {
  let resArr = {
    repliesItems: []
  }
  console.log('----------------------------------------------------------------------------------------------')
  try {
    let replies = await Comment.findAndCountAll({
      where: {
        checked: false,
        replyTo: req.query.userId
      }
    })
    for await (let item of replies.rows) {
      let owner = await User.findByPk(item.UserId)
      let book = await Book.findByPk(item.BookId)
      let resObj = {
        id: item.id,
        owner: owner.username,
        book: item.BookId,
        text: item.text
      }
      resArr.repliesItems.push(resObj)
    }
    resArr.count = replies.count
    console.log('--------------------------------', resArr)
    res.status(200).send(resArr)
  } catch (error) {
    console.log(error)
    res.status(404).send({
      message: 'No replies'
    })
  }
}

exports.checkReplies = async (req, res) => {
  console.log(req.body)
  try {
    const repliesToCheck = await Comment.findAll({
      where: {
        replyTo: req.body.userId
      }
    })
    for await (let item of repliesToCheck) {
      item.checked = true
      await item.save()
    }
    res.status(200).send('okk')
  } catch (error) {
    console.log(error)
  }
}

exports.getComments = async (req, res) => {
  let resArr = []
  try {
    let comments = await Comment.findAll({
      order: [['createdAt', 'asc']],
      where: {
        BookId: req.query.bookId
      }
    })
    for await (let item of comments) {
      let owner = await User.findByPk(item.UserId)
      if (owner) {
        resArr.push({
          id: item.id,
          owner: owner.username,
          ownerId: owner.id,
          text: item.text,
          date: item.createdAt
        })
      } else {
        resArr.push({
          id: item.id,
          owner: '<User deleted>',
          ownerId: null,
          text: item.text,
          date: item.createdAt
        })
      }
    }
    res.status(200).send(resArr)
  } catch (error) {
  }
}

exports.setSocket = async (req, res) => {
  try {
    let owner = await User.findOne({
      where: {
        email: req.body.email
      }
    })
    owner.socket = req.body.socket
    owner.save()
    res.status(200).send('ok')
  } catch (error) {
    console.log(error)
  }
}

exports.uploadBook = (req, res) => {
  let token = req.cookies.token
  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: 'Unauthorized'
      })
    }
    userId = decoded.id
    User.findByPk(userId).then(user => {
      Book.create({
        img: req.body.img,
        img2: req.body.img2.length > 10 ? req.body.img2 : null,
        name: req.body.name,
        description: req.body.description,
        genre: req.body.genre,
        author: req.body.author,
        rating: req.body.rating,
        price: req.body.price
      })
      .then(book => {
        book.setUser(user)
        res.send({ message: 'Book uploaded' })
      })
      .catch(err => {
        res.status(500).send({ message: err.message })
      })
    })
    .catch(err => {
      res.clearCookie('token')
      res.status(404).send({
        message: 'User not found'
      })
    })
  })
}

exports.getBooks = async (req, res) => {
  let resArr = {
    books: []
  }
  let filterObj = {}

  if (req.query.filterBy) {
    if(req.query.filterBy === 'price' || req.query.filterBy === 'rating') {
      if (!req.query.from) {
        filterObj[req.query.filterBy] = {
          [Op.lt]: [req.query.to]
        }
      } else if (!req.query.to) {
        filterObj[req.query.filterBy] = {
          [Op.gt]: [req.query.from]
        }
      } else {
        filterObj[req.query.filterBy] = {
          [Op.between]: [req.query.from, req.query.to]
        }
      }
    } else if (req.query.filterBy === 'author') {
      filterObj[req.query.filterBy] = {[Op.iLike]: `%${req.query.filterValue}%`}
    }
     else {
      filterObj[req.query.filterBy] = req.query.filterValue
    }
  }
  try {
    const rawBooks = await Book.findAndCountAll({
      limit: 9,
      offset: (req.query.page - 1) * 9,
      order: [[req.query.sortBy, req.query.order]],
      where: filterObj
    })
  
    await rawBooks.rows.forEach(item => {
      resArr.books.push({
        id: item.id,
        img: Buffer.from(item.img).toString('base64'),
        img2: !item.img2 ? null : Buffer.from(item.img2).toString('base64'),
        name: item.name,
        description: item.description,
        genre: item.genre,
        author: item.author,
        rating: item.rating,
        price: item.price,
        postData: item.createdAt
      })
      console.log(item.img)
    })
    resArr.count = rawBooks.count
    if (resArr.length === 0) {
      res.status(200).send({
        message: "There're no books here"
      })
    }
    res.status(200).send(resArr)
  } catch (error) {
    console.log(error)
    res.status(400).send({
      message: 'Bad request'
    })
  }
}

exports.getOneBook = async (req, res) => {
  try {
    if (req.query.bookId === '') {
      res.status(404).send({
        message: 'Book is not found'
      })
    } else {
      const book = await Book.findOne({
        where: {
          id: req.query.bookId
        }
      })
      if (book === null) {
        res.status(404).send({
          message: 'Book is not found'
        })
      } else {
        book.img = Buffer.from(book.img).toString('base64')
        book.img2 = !book.img2 ? null : Buffer.from(book.img2).toString('base64')
        console.log('------------|||||||||||||____________________|||||||||||||||||||||')
        res.status(200).send(book)
      }
    } 
  } catch (error) {
    console.log(error)
  }
}

exports.deleteBooks = async (req, res) => {
  const targetItem = await Book.findOne({
    where:{
      id: req.body.id
    }
  })
  try {
    targetItem.destroy()
    res.status(204).send('OK')
  } catch(error) {
    res.status(404).send({
      message: 'Book is not found'
    })
  }
}