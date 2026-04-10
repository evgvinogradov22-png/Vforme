import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { broadcast as api, programs as programsApi } from '../api';
import { C, Spinner, Card, Btn, Badge, Table } from '../components/UI';

const TABS = ['Аудитория', 'Рассылка', 'История'];

export default function Broadcast({ flash }) {
  const [tab, setTab] = useState('Рассылка');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: C.ink }}>Рассылки</div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {TABS.map(t => (
          <Btn key={t} variant={tab === t ? 'primary' : 'ghost'} size="sm" onClick={() => setTab(t)}>{t}</Btn>
        ))}
      </div>
      {tab === 'Аудитория' && <AudienceTab />}
      {tab === 'Рассылка' && <SendTab flash={flash} />}
      {tab === 'История' && <HistoryTab />}
    </div>
  );
}

function AudienceTab() {
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.audience().then(setData).catch(console.error).finally(() => setLoading(false)); }, []);

  if (loading) return <Spinner />;
  if (!data) return <div>Ошибка загрузки</div>;

  const filtered = data.users.filter(u => {
    if (filter === 'tg') return u.telegramId;
    if (filter === 'max') return u.maxId;
    if (filter === 'none') return !u.telegramId && !u.maxId;
    return true;
  });

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Всего', value: data.total, color: C.green },
          { label: 'Telegram', value: data.totalTg, color: '#2AABEE' },
          { label: 'MAX', value: data.totalMax, color: '#5B6CEA' },
        ].map((s, i) => (
          <Card key={i} style={{ textAlign: 'center', padding: 16 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: C.ink3, marginTop: 4 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[['all','Все'],['tg','Telegram'],['max','MAX'],['none','Без мессенджера']].map(([v, l]) => (
          <Btn key={v} variant={filter === v ? 'primary' : 'ghost'} size="sm" onClick={() => setFilter(v)}>{l}</Btn>
        ))}
      </div>

      <Card style={{ padding: 0 }}>
        <Table columns={[
          { title: 'Пользователь', key: 'email', render: (v, r) => (
            <div>
              <div style={{ fontWeight: 600, color: C.ink }}>{r.name || '—'}</div>
              <div style={{ fontSize: 12, color: C.ink3 }}>{r.email}</div>
            </div>
          )},
          { title: 'Telegram', key: 'telegramId', render: (v, r) => v ? <Badge color="blue">@{r.telegramUsername || 'да'}</Badge> : <span style={{ color: C.ink3, fontSize: 12 }}>—</span> },
          { title: 'MAX', key: 'maxId', render: (v, r) => v ? <Badge color="purple">@{r.maxUsername || 'да'}</Badge> : <span style={{ color: C.ink3, fontSize: 12 }}>—</span> },
          { title: 'Дата', key: 'createdAt', render: v => v ? new Date(v).toLocaleDateString('ru') : '—' },
        ]} data={filtered} />
      </Card>
    </div>
  );
}

function SendTab({ flash }) {
  const [message, setMessage] = useState('');
  const [channels, setChannels] = useState(['telegram', 'max']);
  const [segment, setSegment] = useState('all');
  const [programId, setProgramId] = useState('');
  const [programs, setPrograms] = useState([]);
  const [segments, setSegments] = useState({});
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    Promise.all([api.segments(), programsApi.getAll()])
      .then(([s, p]) => { setSegments(s); setPrograms(p); })
      .catch(console.error);
  }, []);

  const toggleChannel = (ch) => setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);

  const send = async () => {
    if (!message.trim() || channels.length === 0) return;
    setSending(true); setResult(null);
    try {
      const r = await api.send({ message, channels, segment, programId: programId || undefined });
      setResult(r);
      flash(`Отправлено: TG ${r.sentTg}, MAX ${r.sentMax}`);
    } catch (e) { flash('Ошибка: ' + e.message, 'error'); }
    finally { setSending(false); }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <div>
        <Card style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.ink3, letterSpacing: 0.5, marginBottom: 10 }}>КАНАЛЫ</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            {[['telegram', 'Telegram', '#2AABEE'], ['max', 'MAX', '#5B6CEA']].map(([id, label, color]) => (
              <div key={id} onClick={() => toggleChannel(id)} style={{
                flex: 1, padding: 12, borderRadius: 12, textAlign: 'center', cursor: 'pointer',
                background: channels.includes(id) ? color + '15' : '#F9F7F4',
                border: `2px solid ${channels.includes(id) ? color : '#E0DAD0'}`,
                color: channels.includes(id) ? color : C.ink3, fontWeight: 600, fontSize: 14,
              }}>
                {label} {channels.includes(id) && '✓'}
              </div>
            ))}
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: C.ink3, letterSpacing: 0.5, marginBottom: 10 }}>АУДИТОРИЯ</div>
          <select value={segment} onChange={e => setSegment(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, marginBottom: 10, background: '#fff' }}>
            <option value="all">Все ({segments.total || 0})</option>
            <option value="club">Подписчики клуба ({segments.totalClub || 0})</option>
            <option value="bought_program">Купившие программу</option>
            <option value="not_bought_program">Не купившие программу</option>
          </select>

          {(segment === 'bought_program' || segment === 'not_bought_program') && (
            <select value={programId} onChange={e => setProgramId(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, marginBottom: 10, background: '#fff' }}>
              <option value="">Выбери программу</option>
              {programs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          )}

          <div style={{ fontSize: 13, fontWeight: 700, color: C.ink3, letterSpacing: 0.5, marginBottom: 10, marginTop: 10 }}>СООБЩЕНИЕ</div>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={6} placeholder="Текст рассылки..."
            style={{ width: '100%', padding: '12px 14px', border: `1px solid ${C.border}`, borderRadius: 12, fontSize: 14, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'Arial, sans-serif' }} />

          <Btn onClick={send} disabled={sending || !message.trim() || channels.length === 0} variant="primary" style={{ width: '100%', marginTop: 16 }}>
            {sending ? 'Отправляем...' : 'Отправить рассылку'}
          </Btn>
        </Card>

        {result && (
          <Card style={{ marginTop: 16, padding: 16, background: '#F0FFF0' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.green, marginBottom: 8 }}>Рассылка отправлена</div>
            <div style={{ fontSize: 13, color: C.ink }}>Telegram: {result.sentTg} отправлено{result.errorsTg > 0 ? `, ${result.errorsTg} ошибок` : ''}</div>
            <div style={{ fontSize: 13, color: C.ink }}>MAX: {result.sentMax} отправлено{result.errorsMax > 0 ? `, ${result.errorsMax} ошибок` : ''}</div>
          </Card>
        )}
      </div>

      <Card style={{ padding: 20, height: 'fit-content' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.ink3, letterSpacing: 0.5, marginBottom: 12 }}>ПРЕДПРОСМОТР</div>
        <div style={{ background: '#F9F7F4', borderRadius: 14, padding: '16px 18px', fontSize: 15, color: C.ink, lineHeight: 1.6 }}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(message.replace(/\n/g, '<br/>')) || '<span style="color:#999">Начни писать...</span>' }} />
      </Card>
    </div>
  );
}

function HistoryTab() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.history().then(setList).catch(console.error).finally(() => setLoading(false)); }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      {list.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: C.ink3 }}>Пока нет рассылок</div>}
      {list.map(item => (
        <Card key={item.id} style={{ marginBottom: 12, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {(item.channels || []).map(ch => (
                <Badge key={ch} color={ch === 'telegram' ? 'blue' : 'purple'}>{ch === 'telegram' ? 'TG' : 'MAX'}</Badge>
              ))}
              <Badge color="green">{item.segment}</Badge>
            </div>
            <div style={{ fontSize: 12, color: C.ink3 }}>{new Date(item.createdAt).toLocaleString('ru')}</div>
          </div>
          <div style={{ fontSize: 14, color: C.ink, marginBottom: 8, lineHeight: 1.5 }}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize((item.message || '').slice(0, 200).replace(/\n/g, '<br/>')) }} />
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: C.ink3 }}>
            <span>TG: {item.sentTg} отправлено{item.errorsTg > 0 ? `, ${item.errorsTg} ошибок` : ''}</span>
            <span>MAX: {item.sentMax} отправлено{item.errorsMax > 0 ? `, ${item.errorsMax} ошибок` : ''}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}
