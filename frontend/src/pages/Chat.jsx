import { analytics } from '../utils/analytics';
import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { G, GLL, GOLD, BD, INK, INK2, INK3, W, sans, serif } from '../utils/theme';

const TOKEN = () => localStorage.getItem('vforme_token');

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [welcome, setWelcome] = useState('Привет! Я Кристина. Чем могу помочь?');
  const bottomRef = useRef(null);

  // Live обновления через WebSocket
  useWebSocket((data) => {
    if ((data.type === 'chat_message' || data.type === 'new_message') && data.message) {
      const m = data.message;
      const role = m.role === 'admin' ? 'assistant' : m.role;
      setMessages(prev => {
        if (prev.some(x => x.id === m.id)) return prev;
        return [...prev, { ...m, role, content: m.content }];
      });
    }
  });

  useEffect(() => {
    // Загружаем настройки и историю
    Promise.all([
      fetch('/api/chat/settings', { headers: { Authorization: 'Bearer ' + TOKEN() } }).then(r => r.json()),
      fetch('/api/chat/history', { headers: { Authorization: 'Bearer ' + TOKEN() } }).then(r => r.json()),
    ]).then(([settings, history]) => {
      const w = settings.welcomeMessage || welcome;
      setWelcome(w);
      if (Array.isArray(history) && history.length > 0) {
        setMessages(history.map(m => ({ role: m.role === 'admin' ? 'assistant' : m.role, content: m.content })));
      } else {
        setMessages([{ role: 'assistant', content: w }]);
      }
    }).catch(() => {
      setMessages([{ role: 'assistant', content: welcome }]);
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    setLoading(true);
    try {
      const res = await fetch('/api/chat/upload', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + TOKEN() },
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        const msgContent = data.isImage ? `[img]${data.url}` : `[file]${data.name}|${data.url}`;
        setMessages(prev => [...prev, { role: 'user', content: msgContent }]);
        if (data.isImage) {
          setLoading(true);
          const aiRes = await fetch('/api/chat/image-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKEN() },
            body: JSON.stringify({ imageUrl: data.url }),
          });
          const aiData = await aiRes.json();
          if (aiData.reply) setMessages(prev => [...prev, { role: 'assistant', content: aiData.reply }]);
        }
      }
    } catch(e) {}
    setLoading(false);
  };

  const renderContent = (content) => {
    if (content.startsWith('[img]')) {
      const url = content.slice(5);
      return <img src={url} alt="" style={{ maxWidth: '100%', borderRadius: 8, display: 'block' }} />;
    }
    if (content.startsWith('[file]')) {
      const [name, url] = content.slice(6).split('|');
      return <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>📎 {name}</a>;
    }
    return content;
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    try { analytics.chatMessage(); } catch {}
    try { log.chatMessage(); } catch {}
    const text = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKEN() },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = data?.error || `Ошибка сервера (${res.status})`;
        setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${err}` }]);
      } else if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Пустой ответ от сервера' }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Сеть: ${e.message || e}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)', background: '#F9F7F4' }}>
      <div style={{ background: G, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🌿</div>
        <div>
          <div style={{ color: W, fontFamily: serif, fontSize: 17, fontWeight: 600 }}>Кристина</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: sans }}>Нутрициолог · Онлайн</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {m.role !== 'user' && (
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: G, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, marginRight: 8, marginTop: 4 }}>🌿</div>
            )}
            <div style={{
              maxWidth: '75%', padding: '12px 16px',
              borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: m.role === 'user' ? G : W,
              color: m.role === 'user' ? W : INK,
              fontFamily: sans, fontSize: 15, lineHeight: 1.6,
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              whiteSpace: 'pre-wrap',
            }}>
              {renderContent(m.content)}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: G, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginRight: 8 }}>🌿</div>
            <div style={{ padding: '14px 18px', borderRadius: '18px 18px 18px 4px', background: W, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: INK3, animation: `bounce 1s ease-in-out ${i*0.2}s infinite` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: '12px 16px', background: W, borderTop: `1px solid ${BD}`, display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <label style={{ width: 44, height: 44, borderRadius: '50%', background: '#F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, fontSize: 20 }}>
          📎
          <input type="file" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) uploadFile(e.target.files[0]); }} />
        </label>
        <textarea value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Напиши сообщение..." rows={1}
          style={{ flex: 1, border: `1px solid ${BD}`, borderRadius: 20, padding: '10px 16px', fontFamily: sans, fontSize: 15, outline: 'none', resize: 'none', lineHeight: 1.5, maxHeight: 120, overflowY: 'auto' }} />
        <button onClick={send} disabled={!input.trim() || loading}
          style={{ width: 44, height: 44, borderRadius: '50%', background: input.trim() && !loading ? G : BD, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .2s' }}>
          <span style={{ color: W, fontSize: 18 }}>↑</span>
        </button>
      </div>
      <style>{`@keyframes bounce { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }`}</style>
    </div>
  );
}
