const socket = io()

//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $locationSendButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')
const $sidebar = document.querySelector('#sidebar')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const linkTemplate = document.querySelector('#link-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autocroll = () => {
    // new message element
    const $newmessage = $messages.lastElementChild

    // height og the new(last) message
    const newmessageStyles = getComputedStyle($newmessage)
    const newmessageMargin = parseInt(newmessageStyles.marginBottom)
    const newmessageHeight = $newmessage.offsetHeight + newmessageMargin

    // visible height
    const visibleHeight = $messages.offsetHeight

    // height of messages container
    const containerHeight = $messages.scrollHeight

    // how far have I scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newmessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {

    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('k:mm')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autocroll()
})

socket.on('locationMessage', (locationMessage) => {

    const html = Mustache.render(linkTemplate, {
        username: locationMessage.username,
        urlLink: locationMessage.url,
        createdAt: moment(locationMessage.createdAt).format('k:mm')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autocroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    $sidebar.innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    // disable form
    $messageFormButton.setAttribute('disabled', 'disabled')

    const text = e.target.elements.message.value
    socket.emit('sendMessage', text, (error) => { //the last function is an aknowledge

        // re-enable form
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) {
            return console.log(`${error}`)
        }
        //console.log(`the message was delivered`)
    })
})

$locationSendButton.addEventListener('click', (e) => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser!')
    }

    // disable button
    $locationSendButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        // re-enable form
        $locationSendButton.removeAttribute('disabled')

        const loc = {
            longitude: position.coords.longitude,
            latitude: position.coords.latitude
        }

        socket.emit('sendLocation', loc, (mess_ackn) => { //the last function is an aknowledge
            //console.log(`location message was delivered - ${mess_ackn}`)
        })

        // var node = document.getElementById('node-id');
        // var newNode = document.createElement('p');
        // newNode.appendChild(document.createTextNode(`${position.coords.longitude}`));
        // node.appendChild(newNode);
    })

})

socket.emit('join', { username, room }, (error_ackn) => {
    if (error_ackn) {
        alert(error_ackn)
        location.href = '/' //redirecting on main page
    }
})