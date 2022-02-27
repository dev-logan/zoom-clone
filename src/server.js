import http from 'http'
// import WebSocket from 'ws'
import SocketIO from 'socket.io'
import express from 'express'

const app = express()

app.set('view engine', 'pug')
app.set('views', __dirname + '/views')
app.use('/public', express.static(__dirname + '/public'))
app.get('/', (_, res) => res.render('home'))
app.get('/*', (_, res) => res.redirect('/')) //  다른 주소로 접속시 redirect

const handleListen = () => console.log('Listening on http://localhost:3000')

const httpServer = http.createServer(app)
const wsServer = SocketIO(httpServer)

wsServer.on('connection', (socket) => {
	socket.onAny((event) => {
		console.log(`Socket Event: ${event}`)
	})
	socket.on('enter_room', (roomName, done) => {
		socket.join(roomName)
		done()
		socket.to(roomName).emit('welcome') //  이 방의 나를 제외한 사람들에게 메시지 보내기
	})
	socket.on('disconnecting', () => {
		socket.rooms.forEach((room) => socket.to(room).emit('bye'))
	})
	socket.on('new_message', (msg, room, done) => {
        socket.to(room).emit('new_message', msg)
        done()
    })
})

/* 
const wss = new WebSocket.Server({ server }) //  http 서버 위에 ws 서버를 만듦

const sockets = []

wss.on('connection', (socket) => {
    sockets.push(socket)
    socket['nickname'] = 'Anon'
    console.log('Connected to Browser ✅')
    socket.on('close', () => console.log('Disconnected from Browser ❌'))
    socket.on('message', (msg) => {
        const messageString = msg.toString('utf-8')
        const message = JSON.parse(messageString)
        switch (message.type) {
            case 'new_message':
                sockets.forEach((aSocket) =>
                    aSocket.send(`${socket.nickname}: ${message.payload}`)
                )
                break
            case 'nickname':
                socket['nickname'] = message.payload
                break
        }
    })
})
 */
httpServer.listen(3000, handleListen)
