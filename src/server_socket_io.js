import http from 'http'
// import WebSocket from 'ws'
import { Server } from 'socket.io'
import { instrument } from '@socket.io/admin-ui'
import express from 'express'

const app = express()

app.set('view engine', 'pug')
app.set('views', __dirname + '/views')
app.use('/public', express.static(__dirname + '/public'))
app.get('/', (_, res) => res.render('home'))
app.get('/*', (_, res) => res.redirect('/')) //  다른 주소로 접속시 redirect

const handleListen = () => console.log('Listening on http://localhost:3000')

const httpServer = http.createServer(app)
const wsServer = new Server(httpServer, {
	cors: {
		origin: ['http://admin.socket.io'],
		credentials: true,
	},
})
instrument(wsServer, {
	auth: false,
})

function publicRooms() {
	const {
		sockets: {
			adapter: { sids, rooms },
		},
	} = wsServer
	const publicRooms = []
	rooms.forEach((_, key) => {
		if (sids.get(key) === undefined) {
			publicRooms.push(key)
		}
	})
	return publicRooms
}

function countRoom(roomName) {
	return wsServer.sockets.adapter.rooms.get(roomName)?.size
}

wsServer.on('connection', (socket) => {
	socket['nickname'] = 'Anon'
	socket.onAny((event) => {
		console.log(`Socket Event: ${event}`)
	})
	socket.on('enter_room', (roomName, done) => {
		socket.join(roomName)
		done(countRoom(roomName))
		socket
			.to(roomName)
			.emit('welcome', socket.nickname, countRoom(roomName)) //  이 방의 나를 제외한 사람들에게 메시지 보내기
		wsServer.sockets.emit('room_change', publicRooms())
	})
	socket.on('disconnecting', () => {
		socket.rooms.forEach((room) =>
			socket.to(room).emit('bye', socket.nickname, countRoom(room) - 1)
		)
	})
	socket.on('disconnect', () => {
		wsServer.sockets.emit('room_change', publicRooms())
	})
	socket.on('new_message', (msg, room, done) => {
		socket.to(room).emit('new_message', `${socket.nickname}: ${msg}`)
		done()
	})
	socket.on('nickname', (nickname) => (socket['nickname'] = nickname))
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
