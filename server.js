const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const cookieParser = require("cookie-parser")
const fs = require('fs')
const app = express()
const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io')
require('dotenv').config()
const ioServer = new Server(server)
global.io = ioServer

let corsOptions = {
  origin: 'http://localhost:3000'
}

const PORT = process.env.PORT

app.use(cors(corsOptions))
app.use(bodyParser.json({ limit: "50mb" }))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(express.static("public"))
app.use(express.json({ limit: "50mb" }))

const db = require('./models')

global.io.on('connect', () => {
  global.io.emit('newConnection')
})

if (!fs.existsSync('public')) {
  fs.mkdirSync('public')
  fs.mkdirSync('public/book')
  fs.mkdirSync('public/user')
} else if (!fs.existsSync('public/book')) {
  fs.mkdirSync('public/book')
} else if (!fs.existsSync('public/user')) {
  fs.mkdirSync('public/user')
}

db.sequelize.sync().then(() => {
  console.log('Sync Db')
})

app.get('/', function(req, res) {
  res.json({ message: "Server is up"})
})

require('./routes/auth.routes')(app)
require('./routes/user.routes')(app)

server.listen(PORT, () => {
  console.log(`${PORT}`)
})