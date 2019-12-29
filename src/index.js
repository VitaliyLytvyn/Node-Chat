const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const filter = new Filter()
const app = express()
const server = http.createServer(app)
const io = socketio(server)
const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    console.log('new Web Socket connection ')

    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room })

        if (error) {
            return callback(error)
        }

        socket.join(user.room) // joins the specific room
        // socket.broadcast = > emits to every connection except this one
        // io.to.emit() // emit to everybody in a cpecific room
        // socket.broadcast.to('xxx').emit() // emit to everybody except the cpecific one in a cpecific chat room
        socket.emit('message', generateMessage('Admin', 'Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined the room`))

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })

    socket.on('sendMessage', (text, callback) => {

        if (filter.isProfane(text)) {
            return callback('Profanaty is not allowed')
        }

        const user = getUser(socket.id)
        if (!user) {
            return callback('no user!')
        }

        // //socket.emit('countUpdated', count)// socket.emit = > emits to this particuler connection
        // io.emit('message', generateMessage(text)) // io.emit = > emits to every connection available at the moment
        io.to(user.room).emit('message', generateMessage(user.username, text)) // io.to().emit = > emit to everybody in a cpecific room

        callback()
    })

    socket.on('sendLocation', ({ latitude, longitude }, callback) => {
        const url = `https://google.com/maps?q=${latitude},${longitude}`

        const user = getUser(socket.id)
        if (!user) {
            return callback('no user!')
        }

        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, url))
        callback('Location was REALLY delivered')
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} leaving room`))

            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})


server.listen(port, () => {
    console.log('server started on port:', port)
})