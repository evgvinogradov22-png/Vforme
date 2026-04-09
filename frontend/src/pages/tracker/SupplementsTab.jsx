import { useState, useEffect } from 'react';
import { tracker as trackerApi } from '../../api';
import { Spinner } from '../../components/UI';
import { renderMarkdown } from '../../utils/md';
import { G, GL, GLL, GOLD, BD, INK, INK2, INK3, OW, W, sans, serif } from '../../utils/theme';

const TIME_OPTIONS = [
  { v: 'утром натощак',   label: 'Утром натощак' },
  { v: 'утром с едой',    label: 'Утром с едой' },
  { v: 'днём',            label: 'Днём' },
  { v: 'вечером',         label: 'Вечером' },
  { v: 'перед сном',      label: 'Перед сном' },
];

export default function SupplementsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', dose: '', time: '', course: '', recommendation: '' });
  const [aiBusy, setAiBusy] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setItems(await trackerApi.getSupplements()); }
    catch {} finally { setLoading(false); }
  }

  function reset() {
    setForm({ name: '', dose: '', time: '', course: '', recommendation: '' });
    setAdding(false); setEditId(null);
  }

  async function save() {
    if (!form.name.trim()) return;
    try {
      if (editId) {
        const r = await trackerApi.updateSupplement(editId, form);
        setItems(p => p.map(s => s.id === editId ? r : s));
      } else {
        const r = await trackerApi.createSupplement(form);
        setItems(p => [r, ...p]);
      }
      reset();
    } catch (e) { alert(e.message); }
  }

  async function remove(id) {
    if (!confirm('Удалить?')) return;
    try { await trackerApi.deleteSupplement(id); setItems(p => p.filter(s => s.id !== id)); }
    catch (e) { alert(e.message); }
  }

  function edit(s) {
    setForm({ name: s.name || '', dose: s.dose || '', time: s.time || '', course: s.course || '', recommendation: s.recommendation || '' });
    setEditId(s.id); setAdding(true);
  }

  async function getAiRec() {
    if (!form.name.trim()) { alert('Сначала укажи название'); return; }
    setAiBusy(true);
    try {
      const r = await trackerApi.aiRecommendSupplement({ name: form.name, dose: form.dose });
      setForm(f => ({ ...f, recommendation: r.recommendation || '' }));
    } catch (e) { alert('AI: ' + e.message); }
    finally { setAiBusy(false); }
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <div style={{ fontSize: 11, color: INK3, letterSpacing: 1.5, fontWeight: 700, marginBottom: 12, fontFamily: sans }}>
        МОИ ДОБАВКИ
      </div>

      {items.length === 0 && !adding && (
        <div style={{ textAlign: 'center', padding: '32px 16px', color: INK3, fontFamily: sans, fontSize: 14 }}>
          Пока нет добавок.<br/>Добавь первую кнопкой ниже.
        </div>
      )}

      {items.map(s => (
        <div key={s.id} style={{ border: '1px solid ' + BD, borderRadius: 16, padding: '14px 16px', marginBottom: 10, background: W }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: serif, fontSize: 17, fontWeight: 600, color: G }}>{s.name}</div>
              {s.dose && <div style={{ fontSize: 13, color: INK2, marginTop: 2, fontFamily: sans }}>{s.dose}</div>}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                {s.time && <span style={{ fontSize: 11, padding: '4px 10px', background: GLL, color: G, borderRadius: 8, fontFamily: sans }}>⏰ {s.time}</span>}
                {s.course && <span style={{ fontSize: 11, padding: '4px 10px', background: '#FBF5EB', color: GOLD, borderRadius: 8, fontFamily: sans }}>📅 {s.course}</span>}
              </div>
              {s.recommendation && (
                <div style={{ marginTop: 10, padding: 10, background: OW, borderRadius: 10, fontSize: 12, color: INK2, fontFamily: sans, lineHeight: 1.5 }}>
                  {renderMarkdown(s.recommendation)}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button onClick={() => edit(s)} style={{ background: 'none', border: 'none', color: INK3, fontSize: 14, cursor: 'pointer', padding: 4 }}>✎</button>
              <button onClick={() => remove(s.id)} style={{ background: 'none', border: 'none', color: INK3, fontSize: 18, cursor: 'pointer', padding: 4 }}>×</button>
            </div>
          </div>
        </div>
      ))}

      {adding ? (
        <div style={{ borderRadius: 16, padding: 0, marginTop: 12 }}>
          <input autoFocus placeholder="Название (Магний B6)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            style={{ width: '100%', border: '1px solid ' + BD, borderRadius: 12, padding: '14px 16px', fontSize: 16, fontFamily: sans, color: INK, outline: 'none', marginBottom: 10, boxSizing: 'border-box', background: OW }} />
          <input placeholder="Дозировка (1 капсула)" value={form.dose} onChange={e => setForm({ ...form, dose: e.target.value })}
            style={{ width: '100%', border: '1px solid ' + BD, borderRadius: 12, padding: '14px 16px', fontSize: 15, fontFamily: sans, color: INK, outline: 'none', marginBottom: 10, boxSizing: 'border-box', background: OW }} />
          <select value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}
            style={{ width: '100%', border: '1px solid ' + BD, borderRadius: 12, padding: '14px 16px', fontSize: 15, fontFamily: sans, color: INK, outline: 'none', marginBottom: 10, background: OW, boxSizing: 'border-box' }}>
            <option value="">Когда принимать…</option>
            {TIME_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
          </select>
          <input placeholder="Курс (30 дней / постоянно)" value={form.course} onChange={e => setForm({ ...form, course: e.target.value })}
            style={{ width: '100%', border: '1px solid ' + BD, borderRadius: 12, padding: '14px 16px', fontSize: 15, fontFamily: sans, color: INK, outline: 'none', marginBottom: 10, boxSizing: 'border-box', background: OW }} />
          <textarea placeholder="Рекомендация (или нажми AI)" value={form.recommendation} onChange={e => setForm({ ...form, recommendation: e.target.value })} rows={3}
            style={{ width: '100%', border: '1px solid ' + BD, borderRadius: 12, padding: '14px 16px', fontSize: 14, fontFamily: sans, color: INK, outline: 'none', marginBottom: 10, resize: 'vertical', boxSizing: 'border-box', background: OW }} />
          <button onClick={getAiRec} disabled={aiBusy} style={{ width: '100%', padding: 12, background: GLL, color: G, border: '1px solid ' + G + '33', borderRadius: 10, fontFamily: sans, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 10, opacity: aiBusy ? 0.5 : 1 }}>
            ✨ {aiBusy ? 'AI думает…' : 'AI-рекомендация по приёму'}
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={save} style={{ flex: 1, padding: 12, background: G, border: 'none', borderRadius: 10, color: W, fontFamily: sans, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>{editId ? 'Сохранить' : 'Добавить'}</button>
            <button onClick={reset} style={{ padding: '12px 16px', background: OW, border: '1px solid ' + BD, borderRadius: 10, color: INK2, fontFamily: sans, fontSize: 14, cursor: 'pointer' }}>Отмена</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ width: '100%', padding: 14, background: W, border: '1px dashed ' + BD, borderRadius: 14, color: INK2, fontFamily: sans, fontSize: 14, cursor: 'pointer', marginTop: 10 }}>
          + Добавить добавку
        </button>
      )}
    </div>
  );
}
