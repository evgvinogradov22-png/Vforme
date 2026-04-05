import { useState, useEffect } from 'react';
import { users as usersApi, programs as programsApi } from '../api';
import { C, Spinner, Card, Btn, Badge, Modal, Input, Table, Toast } from '../components/UI';

const ROLE_LABELS = { user: 'Клиент', admin: 'Админ', superadmin: 'Суперадмин' };
const ROLE_COLORS = { user: 'blue', admin: 'gold', superadmin: 'purple' };

const STATUS_LABELS = { active: 'Активна', paused: 'Пауза', finished: 'Завершила', new: 'Новая' };
const STATUS_COLORS = { active: 'green', paused: 'gold', finished: 'gray', new: 'blue' };

function ClientModal({ client, programs, onClose, onUpdate, flash }) {
  const [role, setRole] = useState(client.role);
  const [access, setAccess] = useState(client.programAccess || []);
  const [saving, setSaving] = useState(false);
  const a = client.profile?.answers || {};

  const toggleAccess = async (programId) => {
    const granted = !access.includes(programId);
    const newAccess = granted ? [...access, programId] : access.filter(id => id !== programId);
    setAccess(newAccess);
    try {
      await usersApi.setAccess(client.id, programId, granted);
      flash(granted ? 'Доступ открыт' : 'Доступ закрыт');
    } catch (e) {
      setAccess(access); // revert
      flash('Ошибка', 'error');
    }
  };

  const saveRole = async () => {
    setSaving(true);
    try {
      await usersApi.setRole(client.id, role);
      onUpdate({ ...client, role });
      flash('Роль сохранена');
    } catch (e) {
      flash('Ошибка', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={a.name || client.email} onClose={onClose} width={640}>
      {/* HEADER */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24, padding: 16, background: C.bg, borderRadius: 12 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: C.green, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
          {(a.name || client.email)[0].toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.ink }}>{a.name || '—'}</div>
          <div style={{ fontSize: 14, color: C.ink3 }}>{client.email}</div>
          {a.city && <div style={{ fontSize: 13, color: C.ink3 }}>📍 {a.city}</div>}
        </div>
        <Badge color={ROLE_COLORS[client.role]}>{ROLE_LABELS[client.role]}</Badge>
      </div>

      {/* ПАРАМЕТРЫ */}
      {(a.weight || a.height || a.goal_weight) && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.ink3, letterSpacing: 0.5, marginBottom: 12 }}>ПАРАМЕТРЫ</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {a.height && <div style={{ flex: 1, background: C.greenLL, borderRadius: 10, padding: '12px', textAlign: 'center' }}><div style={{ fontSize: 20, fontWeight: 700, color: C.green }}>{a.height}</div><div style={{ fontSize: 11, color: C.greenL }}>рост</div></div>}
            {a.weight && <div style={{ flex: 1, background: C.greenLL, borderRadius: 10, padding: '12px', textAlign: 'center' }}><div style={{ fontSize: 20, fontWeight: 700, color: C.green }}>{a.weight}</div><div style={{ fontSize: 11, color: C.greenL }}>вес</div></div>}
            {a.goal_weight && <div style={{ flex: 1, background: '#FBF5EB', borderRadius: 10, padding: '12px', textAlign: 'center' }}><div style={{ fontSize: 20, fontWeight: 700, color: C.gold }}>{a.goal_weight}</div><div style={{ fontSize: 11, color: C.gold }}>цель</div></div>}
            {a.waist && <div style={{ flex: 1, background: C.greenLL, borderRadius: 10, padding: '12px', textAlign: 'center' }}><div style={{ fontSize: 20, fontWeight: 700, color: C.green }}>{a.waist}</div><div style={{ fontSize: 11, color: C.greenL }}>талия</div></div>}
          </div>
        </div>
      )}

      {/* ЖАЛОБЫ */}
      {a.main_complaints && (
        <div style={{ marginBottom: 20, background: '#FFF0F0', border: '1px solid #FFCCCC', borderRadius: 12, padding: '12px 16px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.red, marginBottom: 6 }}>ЖАЛОБЫ</div>
          <div style={{ fontSize: 14, color: C.ink }}>{a.main_complaints}</div>
        </div>
      )}

      {/* СИМПТОМЫ */}
      {(a.priority_symptoms || []).length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.ink3, letterSpacing: 0.5, marginBottom: 8 }}>СИМПТОМЫ</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {a.priority_symptoms.map((s, i) => <Badge key={i} color="red">{s}</Badge>)}
          </div>
        </div>
      )}

      {/* ЦЕЛИ */}
      {(a.main_goals || []).length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.ink3, letterSpacing: 0.5, marginBottom: 8 }}>ЦЕЛИ</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {a.main_goals.map((g, i) => <Badge key={i} color="green">{g}</Badge>)}
          </div>
        </div>
      )}

      {/* ОЦЕНКИ */}
      {(a.energy_score !== undefined || a.sleep_score !== undefined) && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.ink3, letterSpacing: 0.5, marginBottom: 10 }}>ОЦЕНКИ ИЗ АНКЕТЫ</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {[
              { label: 'Энергия', value: a.energy_score },
              { label: 'Сон', value: a.sleep_score },
              { label: 'Кожа', value: a.skin_score },
              { label: 'Стресс', value: a.stress_score },
              { label: 'Активность', value: a.activity_score },
            ].filter(x => x.value !== undefined).map((s, i) => (
              <div key={i} style={{ background: C.bg, borderRadius: 10, padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: s.value >= 7 ? C.green : s.value >= 4 ? C.gold : C.red }}>{s.value}/10</div>
                <div style={{ fontSize: 11, color: C.ink3, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ДОСТУП К ПРОГРАММАМ */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.ink3, letterSpacing: 0.5, marginBottom: 12 }}>ДОСТУП К ПРОГРАММАМ</div>
        {programs.map(prog => {
          const hasAccess = access.includes(prog.id);
          return (
            <div key={prog.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', border: `1px solid ${hasAccess ? C.green + '44' : C.border}`, borderRadius: 12, marginBottom: 8, background: hasAccess ? C.greenLL : C.white }}>
              <div style={{ fontSize: 24 }}>{prog.icon || '🌿'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{prog.title}</div>
              </div>
              <div onClick={() => toggleAccess(prog.id)}
                style={{ width: 44, height: 24, borderRadius: 12, background: hasAccess ? C.green : C.border, position: 'relative', cursor: 'pointer', transition: 'background .2s' }}>
                <div style={{ position: 'absolute', top: 2, left: hasAccess ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* РОЛЬ */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.ink3, letterSpacing: 0.5, marginBottom: 10 }}>РОЛЬ</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['user', 'admin', 'superadmin'].map(r => (
            <button key={r} onClick={() => setRole(r)}
              style={{ flex: 1, padding: '8px', borderRadius: 10, border: `1px solid ${role === r ? C.green : C.border}`, background: role === r ? C.greenLL : C.white, color: role === r ? C.green : C.ink2, fontWeight: role === r ? 700 : 400, cursor: 'pointer', fontSize: 13 }}>
              {ROLE_LABELS[r]}
            </button>
          ))}
        </div>
        {role !== client.role && (
          <Btn onClick={saveRole} disabled={saving} variant="outline" size="sm" style={{ marginTop: 10 }}>
            {saving ? 'Сохраняем...' : 'Сохранить роль'}
          </Btn>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <Btn onClick={onClose} variant="ghost" size="md" style={{ flex: 1 }}>Закрыть</Btn>
      </div>
    </Modal>
  );
}

export default function Clients({ flash }) {
  const [clientList, setClientList] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([usersApi.getAll(), programsApi.getAll()])
      .then(([u, p]) => { setClientList(u); setPrograms(p); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = clientList.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Spinner />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.ink }}>Клиенты</div>
          <div style={{ fontSize: 14, color: C.ink3, marginTop: 2 }}>{clientList.length} пользователей</div>
        </div>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Всего', value: clientList.length, color: C.green },
          { label: 'Активных', value: clientList.filter(u => u.role === 'user').length, color: C.blue },
          { label: 'Админов', value: clientList.filter(u => u.role === 'admin').length, color: C.gold },
          { label: 'Новых за 7 дней', value: clientList.filter(u => new Date(u.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length, color: C.purple },
        ].map((s, i) => (
          <Card key={i} style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: C.ink3, marginTop: 4 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* SEARCH */}
      <Card style={{ marginBottom: 16, padding: '12px 16px' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по имени или email..."
          style={{ width: '100%', border: 'none', outline: 'none', fontSize: 15, color: C.ink, background: 'transparent', fontFamily: 'Arial, sans-serif' }} />
      </Card>

      {/* TABLE */}
      <Card style={{ padding: 0 }}>
        <Table
          onRow={row => setSelected(row)}
          columns={[
            { title: 'Клиент', key: 'email', render: (v, row) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.green, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                  {(row.name || row.email)[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: C.ink }}>{row.name || '—'}</div>
                  <div style={{ fontSize: 12, color: C.ink3 }}>{row.email}</div>
                </div>
              </div>
            )},
            { title: 'Роль', key: 'role', render: v => <Badge color={ROLE_COLORS[v]}>{ROLE_LABELS[v]}</Badge> },
            { title: 'Зарегистрирован', key: 'createdAt', render: v => v ? new Date(v).toLocaleDateString('ru') : '—' },
            { title: 'Программы', key: 'programAccess', render: (v, row) => (
              <div style={{ fontSize: 13, color: C.ink3 }}>{(v || []).length} доступно</div>
            )},
            { title: '', key: 'id', render: () => <span style={{ color: C.ink3, fontSize: 18 }}>›</span> },
          ]}
          data={filtered}
        />
      </Card>

      {selected && (
        <ClientModal
          client={selected}
          programs={programs}
          onClose={() => setSelected(null)}
          onUpdate={updated => setClientList(p => p.map(u => u.id === updated.id ? updated : u))}
          flash={flash}
        />
      )}
    </div>
  );
}
