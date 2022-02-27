const socket = io()

const welcome = document.getElementById('welcome')
const form = welcome.querySelector('form')
const room = document.getElementById('room')

room.hidden = true

let roomName

function addMessage(message) {
	const ul = room.querySelector('ul')
	const li = document.createElement('li')
	li.innerText = message
	ul.appendChild(li)
}

function handleMessageSubmit(event) {
	event.preventDefault()
	const input = room.querySelector('#msg input')
    const value = input.value
	socket.emit('new_message', input.value, roomName, () => {
		addMessage(`You: ${value}`)
	})
    input.value = ''
}

// function handleNicknameSubmit(event) {
// 	event.preventDefault()
// 	const input = room.querySelector('#name input')
// 	socket.emit('nickname', input.value)
// }

function showRoom(newCount) {
	welcome.hidden = true
	room.hidden = false
	const h3 = room.querySelector('h3')
	h3.innerText = `Room ${roomName} (${newCount})`
	const msgForm = room.querySelector('#msg')
	msgForm.addEventListener('submit', handleMessageSubmit)
}

function handleRoomSubmit(event) {
	event.preventDefault()
	const nameForm = form.querySelector('input[name="nickName"]')
    const roomNameForm = form.querySelector('input[name="roomName"]')
    socket.emit('nickname', nameForm.value)
	socket.emit('enter_room', roomNameForm.value, showRoom)
	roomName = roomNameForm.value
}

form.addEventListener('submit', handleRoomSubmit)

socket.on('welcome', (user, newCount) => {
	const h3 = room.querySelector('h3')
	h3.innerText = `Room ${roomName} (${newCount})`
	addMessage(`${user} joined!`)
})

socket.on('bye', (left, newCount) => {
    const h3 = room.querySelector('h3')
	h3.innerText = `Room ${roomName} (${newCount})`
	addMessage(`${left} left.`)
})

socket.on('new_message', addMessage)

socket.on('room_change', (rooms) => {
    const roomList = welcome.querySelector('ul')
    roomList.innerHTML = ''
    if (rooms.length === 0) {
        return
    }
    rooms.forEach(room => {
        const li = document.createElement('li')
        li.innerText = room
        roomList.append(li)
    })
})