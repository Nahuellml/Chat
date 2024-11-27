const socket = io(window.location.origin); //https://chat-production-093f.up.railway.app
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
let username = ''; // Variable global para el nombre de usuario

// Función para pedir al usuario su nickname
function promptNickname() {
  return new Promise((resolve) => {
    const nickname = prompt('Ingrese su nombre de usuario (nickname):');
    if (nickname) {
      resolve(nickname);
    } else {
      resolve('UsuarioDesconocido'); // Default username if none is provided
    }
  });
}

// Función para simular el inicio de sesión y obtener el token
function login(username) {
  return fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.token) {
        return data; // Retornar el token y los datos del usuario
      }
      throw new Error('Error al iniciar sesión');
    });
}

// Función para unirse a la sala después de obtener el token
function joinRoom(token) {
  const room = prompt('Ingresa el nombre de la sala', 'sala1'); // Pedir la sala
  socket.emit('joinGame', { token, room });
}

// Pedir nickname y luego iniciar sesión
promptNickname()
  .then((nickname) => {
    username = nickname; // Guardar el nombre de usuario globalmente
    return login(nickname);  // Iniciar sesión con el nickname
  })
  .then((data) => {
    const { token, userId } = data;
    joinRoom(token); // Una vez autenticado, unirse a la sala
  })
  .catch((err) => {
    console.error('Error al obtener token:', err);
  });

// Enviar mensaje al servidor
sendButton.addEventListener('click', () => {
  const message = messageInput.value;
  if (message.trim()) {
    socket.emit('chatMessage', { user: username, message }); // Usar el username al enviar el mensaje
    messageInput.value = '';
  }
});

// Recibir mensaje del servidor
socket.on('chatMessage', (data) => {
  const messageElement = document.createElement('div');
  messageElement.textContent = `${data.user}: ${data.message}`;
  messagesDiv.appendChild(messageElement);
});

// Recibir historial de chat al unirse
socket.on('chatHistory', (messages) => {
  messages.forEach((message) => {
    const messageElement = document.createElement('div');
    messageElement.textContent = `${message.user}: ${message.message}`;
    messagesDiv.appendChild(messageElement);
  });
});

// Recibir información del usuario
socket.on('userInfo', (data) => {
  // Aquí puedes mostrar esta información en el DOM si es necesario
  const userInfoDiv = document.createElement('div');
  userInfoDiv.textContent = `Conectado como: ${data.username} (ID: ${data.userId})`;
  messagesDiv.appendChild(userInfoDiv);
});

// Manejo de errores
socket.on('error', (message) => {
  console.error(message);
});
