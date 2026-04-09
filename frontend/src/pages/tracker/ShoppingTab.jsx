import { useState, useEffect, useMemo } from 'react';
import { tracker as trackerApi } from '../../api';
import { Spinner } from '../../components/UI';
import { G, GLL, GOLD, BD, INK, INK2, INK3, OW, W, sans, serif } from '../../utils/theme';

export default function ShoppingTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setItems(await trackerApi.getShopping()); }
    catch {} finally { setLoading(false); }
  }

  async function toggle(id, done) {
    setItems(p => p.map(i => i.id === id ? { ...i, done } : i));
    try { await trackerApi.toggleShopping(id, done); } catch {}
  }

  async function remove(id) {
    try { await trackerApi.deleteShopping(id); setItems(p => p.filter(i => i.id !== id)); }
    catch (e) { alert(e.message); }
  }

  async function addManual() {
    if (!newName.trim()) return;
    try {
      const r = await trackerApi.addShopping({ name: newName.trim(), category: 'ingredient' });
      setItems(p => [r, ...p]);
      setNewName(''); setAdding(false);
    } catch (e) { alert(e.message); }
  }

  async function clearAll() {
    if (!confirm('Очистить весь список?')) return;
    try { await trackerApi.clearShopping(); setItems([]); }
    catch (e) { alert(e.message); }
  }

  async function clearDone() {
    const done = items.filter(i => i.done);
    if (done.length === 0) return;
    if (!confirm(`Удалить ${done.length} купленных?`)) return;
    try {
      await Promise.all(done.map(i => trackerApi.deleteShopping(i.id)));
      setItems(p => p.filter(i => !i.done));
    } catch {}
  }

  const grouped = useMemo(() => {
    const ing = items.filter(i => i.category !== 'supplement');
    const sup = items.filter(i => i.category === 'supplement');
    return { ing, sup };
  }, [items]);

  if (loading) return <Spinner />;

  const Section = ({ title, list }) => list.length > 0 && (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 11, color: INK3, letterSpacing: 1.5, fontWeight: 700, marginBottom: 10, fontFamily: sans }}>{title}</div>
      {list.map(it => (
        <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: '1px solid ' + BD, borderRadius: 14, marginBottom: 6, background: it.done ? OW : W, opacity: it.done ? 0.55 : 1 }}>
          <div onClick={() => toggle(it.id, !it.done)}
            style={{ width: 24, height: 24, borderRadius: 7, border: '2px solid ' + (it.done ? G : BD), background: it.done ? G : W, flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {it.done && <span style={{ color: W, fontSize: 12 }}>✓</span>}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, color: INK, fontFamily: sans, textDecoration: it.done ? 'line-through' : 'none' }}>{it.name}</div>
            {it.source && <div style={{ fontSize: 11, color: INK3, marginTop: 2, fontFamily: sans }}>из: {it.source}</div>}
            {it.link && <a href={it.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: G, fontFamily: sans, fontWeight: 600, marginTop: 3, display: 'inline-block' }}>Купить →</a>}
          </div>
          <button onClick={() => remove(it.id)} style={{ background: 'none', border: 'none', color: INK3, fontSize: 18, cursor: 'pointer', padding: 4 }}>×</button>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      {items.length === 0 && !adding ? (
        <div style={{ textAlign: 'center', padding: '32px 16px', color: INK3, fontFamily: sans, fontSize: 14 }}>
          Список пуст.<br/>Добавляй продукты из рецептов или БАДы из протоколов кнопкой «В список покупок».
        </div>
      ) : (
        <>
          <Section title="ПРОДУКТЫ" list={grouped.ing} />
          <Section title="ДОБАВКИ" list={grouped.sup} />
        </>
      )}

      {adding ? (
        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          <input autoFocus placeholder="Что купить" value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addManual()}
            style={{ flex: 1, border: '1px solid ' + BD, borderRadius: 12, padding: '14px 16px', fontSize: 15, fontFamily: sans, color: INK, outline: 'none', background: OW }} />
          <button onClick={addManual} style={{ padding: '14px 18px', background: G, border: 'none', borderRadius: 12, color: W, fontFamily: sans, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>OK</button>
          <button onClick={() => { setAdding(false); setNewName(''); }} style={{ padding: '14px 14px', background: OW, border: 'none', borderRadius: 12, color: INK3, fontFamily: sans, fontSize: 16, cursor: 'pointer' }}>×</button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ width: '100%', padding: 14, background: W, border: '1px dashed ' + BD, borderRadius: 14, color: INK2, fontFamily: sans, fontSize: 14, cursor: 'pointer', marginTop: 10 }}>
          + Добавить вручную
        </button>
      )}

      {items.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button onClick={clearDone} style={{ flex: 1, padding: 12, background: OW, border: '1px solid ' + BD, borderRadius: 12, color: INK2, fontFamily: sans, fontSize: 13, cursor: 'pointer' }}>Убрать купленные</button>
          <button onClick={clearAll} style={{ flex: 1, padding: 12, background: OW, border: '1px solid ' + BD, borderRadius: 12, color: INK2, fontFamily: sans, fontSize: 13, cursor: 'pointer' }}>Очистить всё</button>
        </div>
      )}
    </div>
  );
}
