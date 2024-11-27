const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const path = require('path');

// Variables de entorno
require('dotenv').config();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET;

// Configurar servidor
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware para manejar JSON en el cuerpo de las peticiones
app.use(bodyParser.json());

// Middleware para servir archivos estáticos desde la carpeta client/public
app.use(express.static(path.join(__dirname, '..', 'client', 'public')));

// Ruta para servir `index.html` en la raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'public', 'index.html'));
});

// Almacenamiento en memoria para partidas
const gameRooms = {};

// Endpoint para el login y generación del token
app.post('/login', (req, res) => {
  const { username } = req.body;

  if (username) {
    // Generar un ID único para el usuario
    const userId = Date.now(); // Esto genera un ID único con base en el timestamp
    const token = jwt.sign({ userId, username }, SECRET, { expiresIn: '1h' });
    res.json({ token, userId, username });  // Enviar el token y los datos del usuario
  } else {
    res.status(400).json({ error: 'Usuario requerido' });
  }
});

// WebSocket
io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado');

  // Unir a una sala específica
  socket.on('joinGame', ({ token, room }) => {
    try {
      const decoded = jwt.verify(token, SECRET);
      socket.join(room);
      socket.emit('chatHistory', gameRooms[room]?.messages || []);
      socket.emit('userInfo', { userId: decoded.userId, username: decoded.username });  // Enviar los datos del usuario
    } catch (err) {
      socket.emit('error', 'Autenticación fallida');
    }
  });

  // Manejo de mensajes
  socket.on('chatMessage', (data) => {
    const room = [...socket.rooms][1]; // Obtener la sala actual
    if (!gameRooms[room]) gameRooms[room] = { messages: [] };
    gameRooms[room].messages.push(data);
    io.to(room).emit('chatMessage', data);
  });

  // Desconexión
  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
