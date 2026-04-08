import { useEffect, useRef } from 'react';

let globalWs = null;
let globalListeners = new Map();
let reconnectTimer = null;
let reconnectDelay = 1000;
let stopped = false;

function getWsUrl() {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${window.location.host}/ws`;
}

function connect() {
  if (stopped) return;
  if (globalWs && (globalWs.readyState === WebSocket.OPEN || globalWs.readyState === WebSocket.CONNECTING)) return;

  const token = localStorage.getItem('vforme_token');
  if (!token) return;

  try {
    globalWs = new WebSocket(getWsUrl());

    globalWs.onopen = () => {
      reconnectDelay = 1000; // сброс задержки при успешном подключении
      globalWs.send(JSON.stringify({ type: 'auth', token }));
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
    };

    globalWs.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        globalListeners.forEach(cb => cb(data));
      } catch {}
    };

    globalWs.onclose = () => {
      globalWs = null;
      if (stopped) return;
      // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
      reconnectTimer = setTimeout(() => {
        connect();
      }, reconnectDelay);
      reconnectDelay = Math.min(reconnectDelay * 2, 30000);
    };

    globalWs.onerror = () => {
      globalWs?.close();
      globalWs = null;
    };
  } catch {}
}

function disconnect() {
  stopped = true;
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  if (globalWs) { globalWs.close(); globalWs = null; }
}

export function useWebSocket(onMessage) {
  const cbRef = useRef(onMessage);
  cbRef.current = onMessage;

  useEffect(() => {
    stopped = false;
    const id = Math.random().toString(36).slice(2);
    globalListeners.set(id, (data) => cbRef.current(data));
    connect();
    return () => {
      globalListeners.delete(id);
      if (globalListeners.size === 0) disconnect();
    };
  }, []);
}

export function connectWS() { stopped = false; connect(); }
export function disconnectWS() { disconnect(); }
