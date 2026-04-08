import { useState, useEffect, useCallback } from 'react';
import { C, Card, Spinner, Badge } from '../components/UI';

const BASE = '/api';
function getToken() { return localStorage.getItem('vforme_admin_token'); }
async function req(path) {
  const res = await fetch(BASE + path, { headers: { 'Authorization': `Bearer ${getToken()}` } });
  return res.json();
}

function MiniChart({ data, color = C.green }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => Number(d.count || 0)), 1);
  const w = 400, h = 60;
  const points = data.map((d, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * w;
    const y = h - (Number(d.count) / max) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 60 }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" />
      {data.map((d, i) => {
        const x = (i / Math.max(data.length - 1, 1)) * w;
        const y = h - (Number(d.count) / max) * h;
        return <circle key={i} cx={x} cy={y} r="3" fill={color} />;
      })}
    </svg>
  );
}

function Gauge({ value, label, color }) {
  const pct = Math.min(100, Math.round(value || 0));
  const c = color || (pct > 80 ? C.red : pct > 60 ? C.orange : C.green);
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 8px' }}>
        <svg viewBox="0 0 36 36" style={{ width: 80, height: 80, transform: 'rotate(-90deg)' }}>
          <circle cx="18" cy="18" r="15.9" fill="none" stroke={C.border} strokeWidth="3" />
          <circle cx="18" cy="18" r="15.9" fill="none" stroke={c} strokeWidth="3"
            strokeDasharray={`${pct} ${100 - pct}`} strokeLinecap="round" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: c }}>
          {pct}%
        </div>
      </div>
      <div style={{ fontSize: 12, color: C.ink2 }}>{label}</div>
    </div>
  );
}

function StatCard({ label, value, sub, color = C.green, icon }) {
  return (
    <Card style={{ padding: '20px', textAlign: 'center' }}>
      {icon && <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>}
      <div style={{ fontSize: 32, fontWeight: 700, color, fontFamily: 'Georgia, serif' }}>{value}</div>
      <div style={{ fontSize: 13, color: C.ink, fontWeight: 600, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: C.ink3, marginTop: 2 }}>{sub}</div>}
    </Card>
  );
}

export default function Stats() {
  const [system, setSystem] = useState(null);
  const [users, setUsers] = useState(null);
  const [payments, setPayments] = useState(null);
  const [points, setPoints] = useState(null);
  const [nginx, setNginx] = useState(null);
  const [pm2, setPm2] = useState(null);
  const [emails, setEmails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const load = useCallback(async () => {
    try {
      const [sys, usr, pay, pts, ng, pm, em] = await Promise.all([
        req('/stats/system'),
        req('/stats/users'),
        req('/stats/payments'),
        req('/stats/points'),
        req('/stats/nginx'),
        req('/stats/pm2logs'),
        req('/stats/emails'),
      ]);
      setSystem(sys);
      setUsers(usr);
      setPayments(pay);
      setPoints(pts);
      setNginx(ng);
      setPm2(pm);
      setEmails(em);
    } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, load]);

  const TABS = [
    { id: 'overview', label: '📊 Обзор' },
    { id: 'users', label: '👥 Пользователи' },
    { id: 'payments', label: '💳 Платежи' },
    { id: 'server', label: '🖥 Сервер' },
    { id: 'logs', label: '📋 Логи' },
    { id: 'emails', label: '✉️ Письма' },
  ];

  if (loading) return <Spinner />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.ink }}>Статистика</div>
          <div style={{ fontSize: 14, color: C.ink3, marginTop: 2 }}>Мониторинг сервера и данных</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.ink2, cursor: 'pointer' }}>
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />
            Авто (5с)
          </label>
          <button onClick={load} style={{ padding: '8px 16px', background: C.green, border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            ↻ Обновить
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: C.bg, borderRadius: 12, padding: 4 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 8, background: activeTab === t.id ? C.white : 'transparent', color: activeTab === t.id ? C.green : C.ink2, cursor: 'pointer', fontSize: 12, fontWeight: activeTab === t.id ? 700 : 400, boxShadow: activeTab === t.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all .15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ОБЗОР */}
      {activeTab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
            <StatCard icon="👤" label="Пользователей" value={users?.total || 0} sub={`+${users?.todayCount || 0} сегодня`} />
            <StatCard icon="💳" label="Оплат" value={payments?.total || 0} sub={`${(payments?.totalRevenue || 0).toLocaleString()} руб.`} color={C.gold} />
            <StatCard icon="⭐" label="Баллов выдано" value={(points?.totalAwarded || 0).toLocaleString()} color="#7C3AED" />
            <StatCard icon="📅" label="За неделю" value={`${(payments?.weekRevenue || 0).toLocaleString()} руб.`} sub={`${users?.weekCount || 0} новых`} color={C.blue} />
          </div>

          {system && (
            <Card style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 16 }}>Состояние сервера</div>
              <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                <Gauge value={system.cpu} label="CPU" />
                <Gauge value={system.memory?.percent} label="RAM" />
                <Gauge value={parseInt(system.disk?.percent)} label="Диск" />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13, color: C.ink2, marginBottom: 8 }}>Аптайм</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.green }}>{system.uptime?.replace('up ', '')}</div>
                  <div style={{ fontSize: 11, color: C.ink3, marginTop: 4 }}>Load: {system.loadAvg?.join(' ')}</div>
                </div>
              </div>
            </Card>
          )}

          {users?.regByDay?.length > 0 && (
            <Card>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 4 }}>Регистрации за 30 дней</div>
              <div style={{ fontSize: 13, color: C.ink3, marginBottom: 16 }}>{users.monthCount} новых пользователей</div>
              <MiniChart data={users.regByDay} color={C.green} />
            </Card>
          )}
        </div>
      )}

      {/* ПОЛЬЗОВАТЕЛИ */}
      {activeTab === 'users' && users && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
            <StatCard label="Всего" value={users.total} />
            <StatCard label="Сегодня" value={users.todayCount} color={C.gold} />
            <StatCard label="За неделю" value={users.weekCount} color={C.blue} />
            <StatCard label="За месяц" value={users.monthCount} color="#7C3AED" />
          </div>
          {users.regByDay?.length > 0 && (
            <Card style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 16 }}>Динамика регистраций</div>
              <MiniChart data={users.regByDay} color={C.green} />
            </Card>
          )}
          <Card style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, fontSize: 14, fontWeight: 700 }}>Последние регистрации</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: C.bg }}>
                  {['Пользователь', 'Роль', 'Дата'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.ink3 }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(users.recent || []).map((u, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600 }}>{u.name || '—'}</div>
                      <div style={{ fontSize: 12, color: C.ink3 }}>{u.email}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <Badge color={u.role === 'superadmin' ? 'purple' : u.role === 'admin' ? 'gold' : 'blue'}>{u.role}</Badge>
                    </td>
                    <td style={{ padding: '12px 16px', color: C.ink3, fontSize: 13 }}>{new Date(u.createdAt).toLocaleString('ru')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* ПЛАТЕЖИ */}
      {activeTab === 'payments' && payments && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
            <StatCard label="Оплат всего" value={payments.total} icon="💳" />
            <StatCard label="Выручка" value={`${(payments.totalRevenue || 0).toLocaleString()} руб.`} color={C.gold} icon="💰" />
            <StatCard label="За 7 дней" value={`${(payments.weekRevenue || 0).toLocaleString()} руб.`} icon="📈" />
          </div>
          {points?.byReason?.length > 0 && (
            <Card style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 16 }}>Источники баллов</div>
              {points.byReason.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={{ fontSize: 13, color: C.ink2, minWidth: 160 }}>{r.reason || 'manual'}</div>
                  <div style={{ flex: 1, height: 8, background: C.border, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, (r.total / points.totalAwarded) * 100)}%`, background: C.green, borderRadius: 4 }} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.green, minWidth: 60, textAlign: 'right' }}>{r.total} балл.</div>
                </div>
              ))}
            </Card>
          )}
          <Card style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, fontSize: 14, fontWeight: 700 }}>Последние оплаты</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: C.bg }}>
                  {['Order ID', 'Сумма', 'Дата'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.ink3 }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(payments.recent || []).map((o, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: C.ink3 }}>{o.orderId?.slice(0, 24)}...</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: C.green }}>{(o.amount || 0).toLocaleString()} руб.</td>
                    <td style={{ padding: '12px 16px', color: C.ink3, fontSize: 13 }}>{new Date(o.updatedAt).toLocaleString('ru')}</td>
                  </tr>
                ))}
                {!payments.recent?.length && <tr><td colSpan={3} style={{ padding: 32, textAlign: 'center', color: C.ink3 }}>Нет оплат</td></tr>}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* СЕРВЕР */}
      {activeTab === 'server' && system && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
            <Card style={{ textAlign: 'center', padding: 24 }}>
              <Gauge value={system.cpu} label="CPU Usage" />
              <div style={{ marginTop: 8, fontSize: 13, color: C.ink3 }}>Load: {system.loadAvg?.join(' · ')}</div>
            </Card>
            <Card style={{ padding: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 12 }}>RAM</div>
              <Gauge value={system.memory?.percent} label={`${system.memory?.used} / ${system.memory?.total} MB`} />
              <div style={{ marginTop: 12 }}>
                {[{ l: 'Всего', v: `${system.memory?.total} MB` }, { l: 'Используется', v: `${system.memory?.used} MB` }, { l: 'Свободно', v: `${system.memory?.free} MB` }].map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: C.ink3 }}>{r.l}</span>
                    <span style={{ fontWeight: 600 }}>{r.v}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card style={{ padding: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 12 }}>Диск</div>
              <Gauge value={parseInt(system.disk?.percent)} label={`${system.disk?.used} / ${system.disk?.total}`} />
              <div style={{ marginTop: 12 }}>
                {[{ l: 'Всего', v: system.disk?.total }, { l: 'Используется', v: system.disk?.used }, { l: 'Свободно', v: system.disk?.free }].map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: C.ink3 }}>{r.l}</span>
                    <span style={{ fontWeight: 600 }}>{r.v}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Аптайм</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.green }}>{system.uptime}</div>
          </Card>
        </div>
      )}

      {/* ЛОГИ */}
      {activeTab === 'logs' && (
        <div>
          <Card style={{ marginBottom: 16, padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, fontSize: 14, fontWeight: 700 }}>Nginx — последние запросы</div>
            <div style={{ maxHeight: 300, overflow: 'auto' }}>
              {(nginx?.lines || []).filter(l => l.path).map((l, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 16px', borderBottom: `1px solid ${C.border}`, fontSize: 12, fontFamily: 'monospace', alignItems: 'center' }}>
                  <span style={{ color: l.status >= 500 ? C.red : l.status >= 400 ? C.orange : C.green, minWidth: 36, fontWeight: 700 }}>{l.status}</span>
                  <span style={{ color: C.ink2, minWidth: 50 }}>{l.method}</span>
                  <span style={{ flex: 1, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.path}</span>
                  <span style={{ color: C.ink3 }}>{l.ip}</span>
                </div>
              ))}
              {!nginx?.lines?.filter(l => l.path).length && <div style={{ padding: 24, textAlign: 'center', color: C.ink3 }}>Нет данных</div>}
            </div>
          </Card>
          <Card style={{ marginBottom: 16, padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, fontSize: 14, fontWeight: 700, color: C.green }}>PM2 — вывод</div>
            <div style={{ maxHeight: 300, overflow: 'auto', background: '#0d1117', borderRadius: '0 0 12px 12px' }}>
              {(pm2?.out || []).slice(0, 50).map((line, i) => (
                <div key={i} style={{ padding: '3px 16px', fontSize: 12, fontFamily: 'monospace', color: line.includes('✅') ? '#4ade80' : '#e2e8f0', borderBottom: '1px solid #1e293b' }}>{line}</div>
              ))}
            </div>
          </Card>
          <Card style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, fontSize: 14, fontWeight: 700, color: C.red }}>PM2 — ошибки</div>
            <div style={{ maxHeight: 200, overflow: 'auto', background: '#0d1117', borderRadius: '0 0 12px 12px' }}>
              {(pm2?.err || []).filter(l => l.includes('Error') || l.includes('❌')).slice(0, 20).map((line, i) => (
                <div key={i} style={{ padding: '3px 16px', fontSize: 12, fontFamily: 'monospace', color: '#f87171', borderBottom: '1px solid #1e293b' }}>{line}</div>
              ))}
              {!pm2?.err?.filter(l => l.includes('Error')).length && <div style={{ padding: 16, textAlign: 'center', color: '#4ade80', fontSize: 13 }}>✅ Ошибок нет</div>}
            </div>
          </Card>
        </div>
      )}

      {/* ПИСЬМА */}
      {activeTab === 'emails' && emails && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
            <StatCard icon="✉️" label="Отправлено всего" value={emails.total || 0} />
            <StatCard icon="✅" label="Успешно" value={(emails.total || 0) - (emails.errors || 0)} color={C.green} />
            <StatCard icon="❌" label="Ошибок" value={emails.errors || 0} color={C.red} />
          </div>
          <Card style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, fontSize: 14, fontWeight: 700 }}>История отправки</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: C.bg }}>
                  {['Кому', 'Тип', 'Статус', 'Дата'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.ink3 }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(emails.logs || []).map((log, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '10px 16px', color: C.ink }}>{log.to}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ background: C.greenLL, color: C.green, fontSize: 12, borderRadius: 20, padding: '3px 10px', fontWeight: 600 }}>
                        {log.type === 'verify' ? '✉️ Верификация' : log.type === 'welcome' ? '🌿 Приветствие' : log.type === 'payment' ? '💳 Оплата' : log.type === 'reset' ? '🔐 Сброс пароля' : log.type}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ color: log.status === 'sent' ? C.green : C.red, fontWeight: 600, fontSize: 12 }}>
                        {log.status === 'sent' ? '✅ Отправлено' : '❌ Ошибка'}
                      </span>
                      {log.error && <div style={{ fontSize: 11, color: C.red, marginTop: 2 }}>{log.error}</div>}
                    </td>
                    <td style={{ padding: '10px 16px', color: C.ink3, fontSize: 12 }}>{new Date(log.createdAt).toLocaleString('ru')}</td>
                  </tr>
                ))}
                {!emails.logs?.length && <tr><td colSpan={4} style={{ padding: 32, textAlign: 'center', color: C.ink3 }}>Писем ещё не отправлялось</td></tr>}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  );
}
