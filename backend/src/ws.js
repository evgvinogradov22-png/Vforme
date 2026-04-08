const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

let wss = null;
const clients = new Map(); // userId -> Set of ws connections

function initWebSocket(server) {
  wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    let userId = null;

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data);
        
        if (msg.type === 'auth') {
          const decoded = jwt.verify(msg.token, process.env.JWT_SECRET);
          userId = decoded.id;
          if (!clients.has(userId)) clients.set(userId, new Set());
          clients.get(userId).add(ws);
          ws.send(JSON.stringify({ type: 'auth_ok' }));
        }
      } catch(e) {
        ws.send(JSON.stringify({ type: 'error', message: e.message }));
      }
    });

    ws.on('close', () => {
      if (userId && clients.has(userId)) {
        clients.get(userId).delete(ws);
        if (clients.get(userId).size === 0) clients.delete(userId);
      }
    });

    ws.on('error', () => {});
  });

  console.log('✅ WebSocket сервер запущен');
}

// Отправить сообщение конкретному пользователю
function sendToUser(userId, data) {
  if (!clients.has(userId)) return;
  const msg = JSON.stringify(data);
  for (const ws of clients.get(userId)) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  }
}

// Отправить всем подключённым
function broadcast(data) {
  if (!wss) return;
  const msg = JSON.stringify(data);
  wss.clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  });
}

module.exports = { initWebSocket, sendToUser, broadcast };
