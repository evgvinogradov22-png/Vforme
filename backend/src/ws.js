const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const url = require('url');

let wss = null;
const clients = new Map(); // userId -> Set of ws connections

function initWebSocket(server) {
  wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    // Auth on connect: token from query string or first message
    let userId = null;
    const params = url.parse(req.url, true).query;
    if (params.token) {
      try {
        const decoded = jwt.verify(params.token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch {
        ws.close(4001, 'Invalid token');
        return;
      }
    }

    if (userId) {
      if (!clients.has(userId)) clients.set(userId, new Set());
      clients.get(userId).add(ws);
      ws.send(JSON.stringify({ type: 'auth_ok' }));
    }

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data);
        // Fallback: auth via message (backwards compat)
        if (msg.type === 'auth' && !userId) {
          const decoded = jwt.verify(msg.token, process.env.JWT_SECRET);
          userId = decoded.id;
          if (!clients.has(userId)) clients.set(userId, new Set());
          clients.get(userId).add(ws);
          ws.send(JSON.stringify({ type: 'auth_ok' }));
        }
      } catch(e) {
        ws.send(JSON.stringify({ type: 'error', message: 'Auth failed' }));
      }
    });

    ws.on('close', () => {
      if (userId && clients.has(userId)) {
        clients.get(userId).delete(ws);
        if (clients.get(userId).size === 0) clients.delete(userId);
      }
    });

    ws.on('error', () => {});

    // Kick unauthenticated after 5s
    if (!userId) {
      setTimeout(() => {
        if (!userId && ws.readyState === WebSocket.OPEN) {
          ws.close(4001, 'Auth timeout');
        }
      }, 5000);
    }
  });

  console.log('✅ WebSocket сервер запущен');
}

function sendToUser(userId, data) {
  if (!clients.has(userId)) return;
  const msg = JSON.stringify(data);
  for (const ws of clients.get(userId)) {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  }
}

function broadcast(data) {
  if (!wss) return;
  const msg = JSON.stringify(data);
  wss.clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  });
}

module.exports = { initWebSocket, sendToUser, broadcast };
