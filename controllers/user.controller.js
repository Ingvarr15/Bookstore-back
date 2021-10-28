const db = require('../models')
const User = db.User
const Book = db.Book
const Rating = db.Rating
const Comment = db.Comment
const jwt = require('jsonwebtoken')
const config = require('../config/auth.config.js')
let cryptoJS = require("crypto-js")
const crypto = require('crypto')
const fs = require('fs')
const { Op } = require('sequelize')
const { sequelize } = require('../models')

exports.getPersonal = async (req, res) => {
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
    const targetUser = await User.findByPk(userId)
    const ratingsArr = []
    const ratings = await Rating.findAll({
      where: {
        UserId: userId
      }
    })
    for await (let item of ratings) {
      ratingsArr.push({
        book: item.BookId,
        rating: item.rating
      })
    }
    res.status(200).send({
      id: targetUser.id,
      avatar: !targetUser.avatar ? null : Buffer.from(targetUser.avatar).toString('base64'),
      username: targetUser.username,
      email: targetUser.email,
      dob: targetUser.dob,
      role: targetUser.RoleId,
      ratings: ratingsArr
    })
  } catch (error) {
    res.clearCookie('token')
    res.status(404).send({
      message: 'User not found'
    })
  }
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
    let { username, email, password, dob, avatar } = req.body
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
      if (avatar) {
        user.avatar = avatar
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

exports.deleteComment = async (req, res) => {
  try {
    const targetComment = await Comment.findByPk(req.body.id)
    targetComment.destroy()
    res.status(201).send('Comment deleted')
  } catch (error) {
  }
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
      }
      io.emit('newComment')
      res.status(200).send('ok')
    } catch(error) {
    }
}

exports.getReplies = async (req, res) => {
  let resArr = {
    repliesItems: []
  }
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
    res.status(200).send(resArr)
  } catch (error) {
    res.status(404).send({
      message: 'No replies'
    })
  }
}

exports.checkReplies = async (req, res) => {
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
      let replyToUsername = item.replyTo === null ? null : await User.findOne({ 
        where: {
          id: item.replyTo
        }
      })
      if (owner) {
        resArr.push({
          id: item.id,
          replyToUsername: item.replyTo === null ? null : replyToUsername.username,
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
    await owner.save()
    res.status(200).send('ok')
  } catch (error) {
  }
}

exports.setRating = async (req, res) => {
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
      const targetBook = await Book.findOne({
        where: {
          id: req.body.bookId
        }
      })

      const existingRating = await Rating.findOne({
        where: {
          BookId: req.body.bookId,
          UserId: userId
        }
      })

      if (existingRating === null) {
        const newRating = await Rating.create({
          rating: req.body.rating
        })
        await newRating.setUser(userId)
        await newRating.setBook(req.body.bookId)
        await newRating.save()
        targetBook.rating = newRating.rating
        await targetBook.save()
        await recalculateRating()
      } else {
        existingRating.rating = +req.body.rating
        await existingRating.save()
        await recalculateRating()
      }      
      res.status(200).send('ok')

      async function recalculateRating() {
        const countRaters = await Rating.count({
          where: {
            BookId: req.body.bookId
          }
        })
        if (countRaters === 1) {
          targetBook.rating = +req.body.rating
        } else {
          const result = await Rating.findAll({
            attributes: [[sequelize.fn('sum', sequelize.col('rating')), 'total']],
            where: {
              BookId: req.body.bookId
            }
          })
          targetBook.rating = result[0].dataValues.total / countRaters
        }
        await targetBook.save()
      }

    } catch (error) {
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

    const randomString = crypto.randomBytes(5).toString('hex')
    const pathToImg1 = `./public/book/${randomString}-1.png`
    const pathToImg2 = req.body.img2.length > 10 ? `./public/book/${randomString}-2.png` : null
    const stream1 = fs.createWriteStream(pathToImg1)
    stream1.on('finish', () => {
      console.log('file has been written')
    })
    stream1.write(Buffer.from(req.body.img), 'utf-8')
    stream1.end()
    if (req.body.img2.length > 10) {
      const stream2 = fs.createWriteStream(pathToImg2)
      stream2.on('finish', () => {
        console.log('file has been written')
      })
      stream2.write(Buffer.from(req.body.img2), 'utf-8')
      stream2.end()
    }

    User.findByPk(userId).then(user => {
      Book.create({
        img: pathToImg1.substring(9),
        img2: req.body.img2.length > 10 ? pathToImg2.substring(9) : null,
        name: req.body.name,
        description: req.body.description,
        genre: req.body.genre,
        author: req.body.author,
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
          [Op.lte]: [req.query.to]
        }
      } else if (!req.query.to) {
        filterObj[req.query.filterBy] = {
          [Op.gte]: [req.query.from]
        }
      } else {
        filterObj[req.query.filterBy] = {
          [Op.between]: [req.query.from, req.query.to]
        }
      }
    } else if (req.query.filterBy === 'author') {
      filterObj[req.query.filterBy] = {[Op.iLike]: `%${req.query.filterValue}%`}
    } else if (req.query.filterBy === 'genre') {
      filterObj[req.query.filterBy] = {
        [Op.or]: [req.query.filterValue]
      }
    } else {
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

    for await (let item of rawBooks.rows) {
      resArr.books.push({
        id: item.id,
        img: item.img,
        img2: !item.img2 ? null : item.img2,
        name: item.name,
        description: item.description,
        genre: item.genre,
        author: item.author,
        rating: item.rating,
        price: item.price,
        postData: item.createdAt
      })
    }
    resArr.count = rawBooks.count
    if (resArr.length === 0) {
      res.status(200).send({
        message: "There're no books here"
      })
    }
    res.status(200).send(resArr)
  } catch (error) {
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
        res.status(200).send(book)
      }
    } 
  } catch (error) {
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