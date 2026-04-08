import DOMPurify from 'dompurify';
import { useState, useEffect } from 'react';
import { C, Spinner, Card, Btn } from '../components/UI';

const BASE = '/api';
function getToken() { return localStorage.getItem('vforme_admin_token'); }
async function req(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  return res.json();
}

export default function Broadcast({ flash }) {
  const [programs, setPrograms] = useState([]);
  const [protocols, setProtocols] = useState([]);
  const [segments, setSegments] = useState({ total: 0 });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const [message, setMessage] = useState('');
  const [segment, setSegment] = useState('all');
  const [programId, setProgramId] = useState('');
  const [protocolId, setProtocolId] = useState('');

  useEffect(() => {
    Promise.all([
      req('GET', '/admin/programs'),
      req('GET', '/admin/protocols'),
      req('GET', '/broadcast/segments'),
    ]).then(([progs, protos, segs]) => {
      setPrograms(Array.isArray(progs) ? progs : []);
      setProtocols(Array.isArray(protos) ? protos : []);
      setSegments(segs || { total: 0 });
    }).finally(() => setLoading(false));
  }, []);

  const send = async () => {
    if (!message.trim()) return flash('Введи текст сообщения');
    setSending(true);
    setResult(null);
    try {
      const data = await req('POST', '/broadcast/send', { message, segment, programId, protocolId });
      setResult(data);
      if (data.sent > 0) flash(`✅ Отправлено ${data.sent} пользователям`);
    } catch (e) { flash('Ошибка отправки'); }
    finally { setSending(false); }
  };

  const SEGMENTS = [
    { id: 'all', label: '👥 Все с Telegram', desc: `${segments.total} пользователей` },
    { id: 'bought_program', label: '✅ Купили программу', desc: 'Выбери программу ниже', needProgram: true },
    { id: 'not_bought_program', label: '❌ Не купили программу', desc: 'Выбери программу ниже', needProgram: true },
    { id: 'bought_protocol', label: '✅ Купили протокол', desc: 'Выбери протокол ниже', needProtocol: true },
    { id: 'not_bought_protocol', label: '❌ Не купили протокол', desc: 'Выбери протокол ниже', needProtocol: true },
  ];

  const currentSeg = SEGMENTS.find(s => s.id === segment);

  if (loading) return <Spinner />;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: C.ink }}>Рассылка в Telegram</div>
        <div style={{ fontSize: 14, color: C.ink3, marginTop: 2 }}>
          {segments.total} пользователей подключили Telegram
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        {/* ЛЕВАЯ КОЛОНКА — НАСТРОЙКИ */}
        <div>
          {/* СЕГМЕНТ */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.ink2, marginBottom: 12, letterSpacing: 0.5 }}>АУДИТОРИЯ</div>
            {SEGMENTS.map(seg => (
              <div key={seg.id} onClick={() => setSegment(seg.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: `1px solid ${segment === seg.id ? C.green : C.border}`, borderRadius: 12, marginBottom: 8, cursor: 'pointer', background: segment === seg.id ? C.greenLL : C.white }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${segment === seg.id ? C.green : C.border}`, background: segment === seg.id ? C.green : C.white, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {segment === seg.id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.white }} />}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{seg.label}</div>
                  <div style={{ fontSize: 12, color: C.ink3 }}>{seg.desc}</div>
                </div>
              </div>
            ))}
          </Card>

          {/* ВЫБОР ПРОГРАММЫ */}
          {currentSeg?.needProgram && (
            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.ink2, marginBottom: 10, letterSpacing: 0.5 }}>ПРОГРАММА</div>
              <select value={programId} onChange={e => setProgramId(e.target.value)}
                style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none' }}>
                <option value="">— Выбери программу —</option>
                {programs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </Card>
          )}

          {/* ВЫБОР ПРОТОКОЛА */}
          {currentSeg?.needProtocol && (
            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.ink2, marginBottom: 10, letterSpacing: 0.5 }}>ПРОТОКОЛ</div>
              <select value={protocolId} onChange={e => setProtocolId(e.target.value)}
                style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none' }}>
                <option value="">— Выбери протокол —</option>
                {protocols.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </Card>
          )}
        </div>

        {/* ПРАВАЯ КОЛОНКА — СООБЩЕНИЕ */}
        <div>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.ink2, marginBottom: 10, letterSpacing: 0.5 }}>ТЕКСТ СООБЩЕНИЯ</div>
            <div style={{ fontSize: 12, color: C.ink3, marginBottom: 10 }}>
              Поддерживается HTML: <code>&lt;b&gt;</code> жирный, <code>&lt;i&gt;</code> курсив, <code>&lt;a href=""&gt;</code> ссылка
            </div>
            <textarea value={message} onChange={e => setMessage(e.target.value)}
              placeholder={'🌿 <b>Привет!</b>\n\nУ нас новый протокол — проверь в приложении!\n\n👉 https://app.nutrikris.ru'}
              rows={10}
              style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px', fontSize: 14, fontFamily: 'monospace', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }} />
            <div style={{ fontSize: 12, color: C.ink3, marginTop: 6 }}>{message.length} символов</div>
          </Card>

          {/* ПРЕВЬЮ */}
          {message && (
            <Card style={{ marginBottom: 16, background: '#F0F0F0' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.ink2, marginBottom: 10 }}>ПРЕВЬЮ</div>
              <div style={{ background: C.white, borderRadius: 12, padding: '12px 14px', fontSize: 14, lineHeight: 1.7 }}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(message.replace(/\n/g, '<br/>')) }} />
            </Card>
          )}

          <Btn onClick={send} disabled={!message.trim() || sending || (currentSeg?.needProgram && !programId) || (currentSeg?.needProtocol && !protocolId)}
            variant="primary" style={{ width: '100%', padding: '16px', fontSize: 15 }}>
            {sending ? '⏳ Отправляем...' : `📤 Отправить${segment === 'all' ? ` всем (${segments.total})` : ''}`}
          </Btn>

          {result && (
            <Card style={{ marginTop: 12, background: result.sent > 0 ? C.greenLL : '#FFF0F0' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: result.sent > 0 ? C.green : C.red }}>
                {result.sent > 0 ? `✅ Отправлено ${result.sent} из ${result.total}` : '❌ Никому не отправлено'}
              </div>
              {result.message && <div style={{ fontSize: 13, color: C.ink3, marginTop: 4 }}>{result.message}</div>}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
