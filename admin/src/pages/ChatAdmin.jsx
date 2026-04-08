import { useState, useEffect, useRef } from 'react';
import { C, Spinner } from '../components/UI';

const BASE = '/api';
function getToken() { return localStorage.getItem('vforme_admin_token'); }
async function req(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  return res.json();
}

function avatar(name) {
  return (name || '?')[0].toUpperCase();
}

function timeStr(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000 && d.getDate() === now.getDate()) return d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
  if (diff < 604800000) return d.toLocaleDateString('ru', { weekday: 'short' });
  return d.toLocaleDateString('ru', { day: '2-digit', month: '2-digit' });
}

// ── НАСТРОЙКИ ────────────────────────────────────────────────
function Settings({ flash, onBack }) {
  const [s, setS] = useState({ assistantName: 'Кристина', welcomeMessage: '', systemPrompt: '', enabled: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => { req('GET', '/admin/chat-settings').then(d => { if (d && !d.error) setS(d); }); }, []);

  const save = async () => {
    setSaving(true);
    await req('PUT', '/admin/chat-settings', s);
    flash('Сохранено');
    setSaving(false);
  };

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: C.ink2 }}>←</button>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.ink }}>Настройки чата</div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.ink3, marginBottom: 6, letterSpacing: 0.5 }}>ИМЯ АССИСТЕНТА</div>
        <input value={s.assistantName} onChange={e => setS(x => ({ ...x, assistantName: e.target.value }))}
          style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.ink3, marginBottom: 6, letterSpacing: 0.5 }}>ПРИВЕТСТВИЕ</div>
        <textarea value={s.welcomeMessage} onChange={e => setS(x => ({ ...x, welcomeMessage: e.target.value }))}
          rows={2} placeholder="Привет! Я Кристина..."
          style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.ink3, marginBottom: 4, letterSpacing: 0.5 }}>СИСТЕМНЫЙ ПРОМПТ — СТИЛЬ И БАЗА ЗНАНИЙ</div>
        <div style={{ fontSize: 12, color: C.ink3, marginBottom: 6 }}>Вставляй сюда тексты, принципы, ответы на частые вопросы — AI будет отвечать на их основе</div>
        <textarea value={s.systemPrompt} onChange={e => setS(x => ({ ...x, systemPrompt: e.target.value }))}
          rows={14}
          placeholder={`Ты — Кристина Виноградова, нутрициолог.\n\nСтиль:\n- Тёплый, дружеский\n- От первого лица\n\nМои принципы:\n- ...\n\nЧасто задаваемые вопросы:\n- ...`}
          style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'monospace', lineHeight: 1.7 }} />
        <div style={{ fontSize: 11, color: C.ink3, marginTop: 4 }}>{s.systemPrompt.length} символов</div>
      </div>

      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
        <input type="checkbox" checked={s.enabled} onChange={e => setS(x => ({ ...x, enabled: e.target.checked }))} id="enabled" />
        <label htmlFor="enabled" style={{ fontSize: 14, cursor: 'pointer' }}>Чат активен</label>
      </div>

      <button onClick={save} disabled={saving}
        style={{ width: '100%', padding: 14, background: C.green, color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
        {saving ? 'Сохраняем...' : 'Сохранить'}
      </button>
    </div>
  );
}

function renderContent(content) {
  if (!content) return null;
  if (content.startsWith('[img]')) {
    const url = content.slice(5);
    return <img src={url} alt="" style={{ maxWidth: 240, borderRadius: 8, display: 'block' }} />;
  }
  if (content.startsWith('[file]')) {
    const [name, url] = content.slice(6).split('|');
    return <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>📎 {name}</a>;
  }
  return <span style={{ whiteSpace: 'pre-wrap' }}>{content}</span>;
}

// ── ГЛАВНЫЙ КОМПОНЕНТ ─────────────────────────────────────────
export default function ChatAdmin({ flash }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [view, setView] = useState('chats'); // chats | settings
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    req('GET', '/chat/admin/chats').then(data => {
      setChats(Array.isArray(data) ? data : []);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    loadMessages(selected.userId);
    pollRef.current = setInterval(() => loadMessages(selected.userId), 5000);
    return () => clearInterval(pollRef.current);
  }, [selected]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadMessages = async (userId) => {
    const data = await req('GET', `/chat/admin/chats/${userId}`);
    if (Array.isArray(data)) setMessages(data);
  };

  const send = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    await req('POST', `/chat/admin/chats/${selected.userId}/send`, { content: input.trim() });
    setInput('');
    await loadMessages(selected.userId);
    setSending(false);
  };

  const selectChat = (chat) => {
    setSelected(chat);
    setMessages([]);
  };

  if (view === 'settings') return <Settings flash={flash} onBack={() => setView('chats')} />;

  const name = selected ? (selected.user?.name || selected.user?.email || '?') : '';

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 80px)', border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>

      {/* ЛЕВАЯ КОЛОНКА — СПИСОК */}
      <div style={{ width: 300, flexShrink: 0, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column' }}>
        {/* ХЕДЕР СПИСКА */}
        <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.ink }}>Чаты</div>
          <button onClick={() => setView('settings')}
            style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: C.ink3 }}>⚙️</button>
        </div>

        {/* СПИСОК */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? <div style={{ padding: 20 }}><Spinner /></div> : chats.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: C.ink3, fontSize: 14 }}>Нет диалогов</div>
          ) : chats.map(chat => {
            const n = chat.user?.name || chat.user?.email || '?';
            const isSelected = selected?.userId === chat.userId;
            return (
              <div key={chat.userId} onClick={() => selectChat(chat)}
                style={{ padding: '12px 16px', cursor: 'pointer', background: isSelected ? C.greenLL : 'transparent', borderLeft: `3px solid ${isSelected ? C.green : 'transparent'}`, display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: C.green, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
                  {avatar(n)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 600, color: C.ink, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n}</div>
                    <div style={{ fontSize: 11, color: C.ink3, flexShrink: 0, marginLeft: 8 }}>{timeStr(chat.lastAt)}</div>
                  </div>
                  <div style={{ fontSize: 12, color: C.ink3, marginTop: 2 }}>{chat.count} сообщений</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ПРАВАЯ КОЛОНКА — ЧАТ */}
      {!selected ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.ink3, flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 40 }}>💬</div>
          <div style={{ fontSize: 15 }}>Выбери диалог</div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* ХЕДЕР ЧАТА */}
          <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: C.green, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>
              {avatar(name)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: C.ink, fontSize: 15 }}>{name}</div>
              <div style={{ fontSize: 12, color: C.ink3 }}>{selected.user?.email}</div>
            </div>
            {/* AI ПЕРЕКЛЮЧАТЕЛЬ */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: aiEnabled ? C.green : C.ink3, fontWeight: 600 }}>{aiEnabled ? '🤖 AI' : '👤 Ручной'}</span>
              <div onClick={() => setAiEnabled(!aiEnabled)}
                style={{ width: 44, height: 24, borderRadius: 12, background: aiEnabled ? C.green : C.border, position: 'relative', cursor: 'pointer', transition: 'background .2s', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 2, left: aiEnabled ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </div>
            </div>
          </div>

          {/* СООБЩЕНИЯ */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8, background: '#F5F5F5' }}>
            {messages.map((m, i) => {
              const isUser = m.role === 'user';
              return (
                <div key={i} style={{ display: 'flex', justifyContent: isUser ? 'flex-start' : 'flex-end', gap: 8, alignItems: 'flex-end' }}>
                  {isUser && (
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#aaa', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                      {avatar(name)}
                    </div>
                  )}
                  <div style={{ maxWidth: '65%' }}>
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: isUser ? '4px 12px 12px 12px' : '12px 4px 12px 12px',
                      background: isUser ? '#fff' : m.isAi ? '#DCFFE0' : '#FFF3CC',
                      fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', color: '#1A1A1A',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                    }}>
                      {renderContent(m.content)}
                    </div>
                    <div style={{ fontSize: 10, color: '#999', marginTop: 2, textAlign: isUser ? 'left' : 'right' }}>
                      {!isUser && (m.isAi ? '🤖 AI · ' : '👤 Вы · ')}
                      {timeStr(m.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* ИНПУТ */}
          <div style={{ padding: '12px 16px', background: '#fff', borderTop: `1px solid ${C.border}` }}>
            {aiEnabled ? (
              <div style={{ padding: '10px 16px', background: C.greenLL, borderRadius: 10, fontSize: 13, color: C.green, textAlign: 'center' }}>
                🤖 AI отвечает автоматически — переключи в ручной режим чтобы писать самому
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <label style={{ width: 40, height: 40, borderRadius: 8, background: '#F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, fontSize: 18 }}>
                  📎
                  <input type="file" style={{ display: 'none' }} onChange={async e => {
                    if (!e.target.files[0]) return;
                    const fd = new FormData(); fd.append('file', e.target.files[0]);
                    const res = await fetch('/api/chat/upload', { method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }, body: fd });
                    const d = await res.json();
                    if (d.url) { await req('POST', `/chat/admin/chats/${selected.userId}/send`, { content: d.isImage ? `[img]${d.url}` : `[file]${e.target.files[0].name}|${d.url}` }); await loadMessages(selected.userId); }
                  }} />
                </label>
                <textarea value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder="Написать от имени Кристины..." rows={2}
                  style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none', resize: 'none', fontFamily: 'inherit' }} />
                <button onClick={send} disabled={!input.trim() || sending}
                  style={{ padding: '10px 20px', background: C.green, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  {sending ? '...' : '↑'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
