import { useState, useEffect } from 'react';
import { C, Spinner, Card, Btn, Modal, Input, Table, Badge } from '../components/UI';

const BASE = '/api';
function getToken() { return localStorage.getItem('vforme_admin_token'); }
async function req(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  return res.json();
}

function PromoModal({ promo, programs, onClose, onSave }) {
  const [data, setData] = useState(promo || { code: '', type: 'percent', value: 10, maxUses: 0, active: true, programId: '', expiresAt: '' });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...data, value: Number(data.value), maxUses: Number(data.maxUses), programId: data.programId || null, expiresAt: data.expiresAt || null };
      promo?.id ? await req('PUT', `/admin/promos/${promo.id}`, payload) : await req('POST', '/admin/promos', payload);
      onSave(); onClose();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={promo ? 'Редактировать промокод' : 'Новый промокод'} onClose={onClose}>
      <Input label="Код" value={data.code} onChange={v => setData(d => ({ ...d, code: v.toUpperCase() }))} placeholder="SALE20" />
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.ink2, marginBottom: 8, letterSpacing: 0.5 }}>ТИП СКИДКИ</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ v: 'percent', l: '% Процент' }, { v: 'fixed', l: 'руб. Фиксированная' }].map(t => (
            <button key={t.v} onClick={() => setData(d => ({ ...d, type: t.v }))}
              style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${data.type === t.v ? C.green : C.border}`, background: data.type === t.v ? C.greenLL : C.white, color: data.type === t.v ? C.green : C.ink2, cursor: 'pointer', fontWeight: data.type === t.v ? 700 : 400, fontSize: 14 }}>
              {t.l}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <Input label={data.type === 'percent' ? 'Скидка (%)' : 'Скидка (руб.)'} value={String(data.value)} onChange={v => setData(d => ({ ...d, value: v }))} type="number" style={{ flex: 1 }} />
        <Input label="Макс. использований (0 = ∞)" value={String(data.maxUses)} onChange={v => setData(d => ({ ...d, maxUses: v }))} type="number" style={{ flex: 1 }} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.ink2, marginBottom: 8, letterSpacing: 0.5 }}>ПРОГРАММА (пусто = все)</div>
        <select value={data.programId || ''} onChange={e => setData(d => ({ ...d, programId: e.target.value }))}
          style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none' }}>
          <option value="">— Все программы —</option>
          {programs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </div>
      <Input label="Действует до (пусто = бессрочно)" value={data.expiresAt || ''} onChange={v => setData(d => ({ ...d, expiresAt: v }))} type="date" />
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
          <input type="checkbox" checked={data.active} onChange={e => setData(d => ({ ...d, active: e.target.checked }))} />
          Промокод активен
        </label>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn onClick={onClose} variant="ghost" style={{ flex: 1 }}>Отмена</Btn>
        <Btn onClick={save} disabled={!data.code || saving} variant="primary" style={{ flex: 2 }}>{saving ? 'Сохраняем...' : 'Сохранить'}</Btn>
      </div>
    </Modal>
  );
}

export default function Promos({ flash }) {
  const [list, setList] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const load = async () => {
    const [promos, progs] = await Promise.all([req('GET', '/admin/promos'), req('GET', '/admin/programs')]);
    setList(Array.isArray(promos) ? promos : []);
    setPrograms(Array.isArray(progs) ? progs : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const del = async (id) => {
    if (!confirm('Удалить промокод?')) return;
    await req('DELETE', `/admin/promos/${id}`);
    load(); flash('Удалено');
  };

  const toggle = async (promo) => {
    await req('PUT', `/admin/promos/${promo.id}`, { ...promo, active: !promo.active });
    load();
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.ink }}>Промокоды</div>
          <div style={{ fontSize: 14, color: C.ink3, marginTop: 2 }}>{list.length} промокодов</div>
        </div>
        <Btn onClick={() => setModal({})} variant="primary">+ Промокод</Btn>
      </div>

      <Card style={{ padding: 0 }}>
        <Table
          columns={[
            { title: 'Код', key: 'code', render: v => <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 15, color: C.ink }}>{v}</span> },
            { title: 'Скидка', key: 'type', render: (v, row) => <Badge color="gold">{row.type === 'percent' ? `${row.value}%` : `${row.value} руб.`}</Badge> },
            { title: 'Использований', key: 'usedCount', render: (v, row) => `${v} / ${row.maxUses === 0 ? '∞' : row.maxUses}` },
            { title: 'Статус', key: 'active', render: (v, row) => (
              <div onClick={() => toggle(row)} style={{ cursor: 'pointer' }}>
                <Badge color={v ? 'green' : 'gray'}>{v ? 'Активен' : 'Отключён'}</Badge>
              </div>
            )},
            { title: 'До', key: 'expiresAt', render: v => v ? new Date(v).toLocaleDateString('ru') : '∞' },
            { title: '', key: 'id', render: (v, row) => (
              <div style={{ display: 'flex', gap: 6 }}>
                <Btn onClick={() => setModal(row)} variant="ghost" size="sm">Изменить</Btn>
                <Btn onClick={() => del(v)} variant="danger" size="sm">✕</Btn>
              </div>
            )},
          ]}
          data={list}
        />
      </Card>

      {modal !== null && (
        <PromoModal promo={modal.id ? modal : null} programs={programs} onClose={() => setModal(null)} onSave={() => { load(); flash('Сохранено'); }} />
      )}
    </div>
  );
}
