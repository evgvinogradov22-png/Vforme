import { useState, useEffect } from 'react';
import { tracker as trackerApi } from '../../api';
import { Spinner } from '../../components/UI';
import { G, GL, GLL, GOLD, BD, INK, INK2, INK3, OW, W, sans, serif } from '../../utils/theme';

function dateKey(d) { return d.toISOString().slice(0, 10); }

export default function HabitsTab() {
  const [habits, setHabits] = useState([]);
  const [logs, setLogs] = useState({}); // { 'YYYY-MM-DD': { habitId: true } }
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('✦');
  const [aiBusy, setAiBusy] = useState(false);

  const today = dateKey(new Date());
  const todayLog = logs[today] || {};

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const r = await trackerApi.getHabits();
      setHabits(r.habits || []);
      const map = {};
      (r.logs || []).forEach(e => { map[e.date] = e.log || {}; });
      setLogs(map);
    } catch {} finally { setLoading(false); }
  }

  async function toggleToday(hid) {
    const prev = logs[today] || {};
    const next = { ...prev, [hid]: !prev[hid] };
    setLogs(p => ({ ...p, [today]: next }));
    try { await trackerApi.logHabit({ date: today, log: next }); }
    catch { setLogs(p => ({ ...p, [today]: prev })); }
  }

  async function addManual() {
    if (!newName.trim()) return;
    try {
      const h = await trackerApi.createHabit({ name: newName.trim(), icon: newIcon, order: habits.length });
      setHabits(p => [...p, h]);
      setNewName(''); setNewIcon('✦'); setAdding(false);
    } catch (e) { alert(e.message); }
  }

  async function removeHabit(id) {
    if (!confirm('Удалить привычку?')) return;
    try {
      await trackerApi.deleteHabit(id);
      setHabits(p => p.filter(h => h.id !== id));
    } catch (e) { alert(e.message); }
  }

  async function aiGenerate() {
    setAiBusy(true);
    try {
      const created = await trackerApi.aiGenerateHabits();
      if (Array.isArray(created)) setHabits(p => [...p, ...created]);
    } catch (e) { alert('AI: ' + e.message); }
    finally { setAiBusy(false); }
  }

  if (loading) return <Spinner />;

  return (
    <div>
      {/* AI generate */}
      {habits.length === 0 && (
        <button onClick={aiGenerate} disabled={aiBusy}
          style={{ width: '100%', padding: 16, background: G, color: W, border: 'none', borderRadius: 14, fontFamily: sans, fontWeight: 700, fontSize: 15, marginBottom: 12, cursor: 'pointer', opacity: aiBusy ? 0.6 : 1 }}>
          {aiBusy ? 'Подбираем…' : 'Подобрать 5 привычек на основе Карты'}
        </button>
      )}

      {/* Habits list */}
      <div style={{ fontSize: 11, color: INK3, letterSpacing: 1.5, fontWeight: 700, marginBottom: 12, fontFamily: sans }}>СЕГОДНЯ</div>
      {habits.map(h => {
        const done = !!todayLog[h.id];
        return (
          <div key={h.id}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', border: '1px solid ' + (done ? G + '66' : BD), borderRadius: 16, marginBottom: 8, background: done ? GLL : W }}>
            <div onClick={() => toggleToday(h.id)} style={{ width: 42, height: 42, borderRadius: 12, background: done ? G : OW, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, cursor: 'pointer', color: done ? W : INK }}>
              {done ? '✓' : h.icon || '✦'}
            </div>
            <div style={{ flex: 1, fontSize: 15, color: done ? G : INK, fontFamily: sans, fontWeight: 500 }} onClick={() => toggleToday(h.id)}>{h.name}</div>
            <button onClick={() => removeHabit(h.id)} style={{ background: 'none', border: 'none', color: INK3, fontSize: 18, cursor: 'pointer', padding: 4 }}>×</button>
          </div>
        );
      })}

      {/* Add */}
      {adding ? (
        <div style={{ border: '1px solid ' + GOLD, borderRadius: 16, padding: 14, marginTop: 8 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input value={newIcon} onChange={e => setNewIcon(e.target.value)} maxLength={3}
              style={{ width: 50, textAlign: 'center', border: '1px solid ' + BD, borderRadius: 10, padding: 10, fontSize: 18, fontFamily: sans }} />
            <input autoFocus placeholder="Название привычки" value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addManual()}
              style={{ flex: 1, border: '1px solid ' + BD, borderRadius: 10, padding: 10, fontSize: 14, fontFamily: sans, color: INK, outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addManual} style={{ flex: 1, padding: 12, background: G, border: 'none', borderRadius: 10, color: W, fontFamily: sans, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Добавить</button>
            <button onClick={() => { setAdding(false); setNewName(''); }} style={{ padding: '12px 16px', background: OW, border: '1px solid ' + BD, borderRadius: 10, color: INK2, fontFamily: sans, fontSize: 14, cursor: 'pointer' }}>Отмена</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button onClick={() => setAdding(true)} style={{ flex: 1, padding: 14, background: W, border: '1px dashed ' + BD, borderRadius: 14, color: INK2, fontFamily: sans, fontSize: 14, cursor: 'pointer' }}>+ Добавить</button>
          {habits.length > 0 && (
            <button onClick={aiGenerate} disabled={aiBusy} style={{ padding: '14px 16px', background: GLL, border: '1px solid ' + G + '33', borderRadius: 14, color: G, fontFamily: sans, fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: aiBusy ? 0.5 : 1 }}>
              ✨ {aiBusy ? '…' : 'AI'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
