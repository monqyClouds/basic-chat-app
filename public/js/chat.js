const socket = io();

// Elements
const $messageForm = document.getElementById('message-form');
const $messageFormInput = $messageForm.querySelector('#input-box');
const $messageFormBtn = $messageForm.querySelector('button');
const $sendLocationBtn = document.getElementById('send-location');
const $messages = document.getElementById('messages');

// Templates
const messageTemplate = document.getElementById('message-template').innerHTML;
const locationTemplate = document.getElementById('location-template').innerHTML;
const sidebarTemplate = document.getElementById('sidebar-template').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
  // New message element
  const $newMessage = $messages.lastElementChild;

  // Height of new message + margin-bottom
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // Visible height
  const visibleHeight = $messages.offsetHeight;

  // Total height of messages container
  const containerHeight = $messages.scrollHeight;

  // How far scrolled
  const scrollOffset = $messages.scrollTop + visibleHeight;
  
  if (containerHeight - newMessageHeight < scrollOffset + 10) {
    $messages.scrollTop = $messages.scrollHeight;
    console.log(containerHeight + ' container height')
    console.log(scrollOffset + ' scroll offset')
    console.log(containerHeight - scrollOffset + ' conatianer ht - scroffst')
    console.log(containerHeight -newMessageHeight+ ' conatianer ht - nwmsght')
  }
}

socket.on('message', ({username, text, createdAt}) => {
  // console.log(text);
  const html = Mustache.render(messageTemplate, {
		username,
		text,
		createdAt: moment(createdAt).format("HH:mm"),
	});
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
})

socket.on('locationMessage', ({username, url, createdAt}) => {
  const link = Mustache.render(locationTemplate, {
    username,
    url,
    createdAt: moment(createdAt).format("HH:mm")
  })
  $messages.insertAdjacentHTML('beforeend', link);
  autoscroll();
})

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  })
  document.getElementById('sidebar').innerHTML = html;
})

// Setting up acknowledgement
$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  
	// disable form
  $messageFormBtn.setAttribute('disabled', 'disabled');

	const inputText = $messageFormInput.value;

	socket.emit("sendMessage", inputText, (err) => {
    // enable form
    $messageFormBtn.removeAttribute('disabled');
    $messageFormInput.value = '';
    $messageFormInput.focus();    // Aids typing messages real fast

		// This is the acknowledgement function
		if (err) {
			return console.log(err);
		}

		console.log("Message delivered!");
	});
});

// Sharing location
$sendLocationBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    return alert('Geolocation is not supported by you browser')
  }

  // Disable btn
  $sendLocationBtn.setAttribute('disabled', 'disabled');

  navigator.geolocation.getCurrentPosition((position) => {
    const coords = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    }

    socket.emit('sendLocation', coords, (err) => {
      console.log('Location Shared!');

      // Enable btn
      $sendLocationBtn.removeAttribute('disabled');
    })
  })
})

socket.emit('join', { username, room }, (err) => {
  if (err) {
    alert(err);
    location.href = '/'
  }
});
