import { useState, useEffect, useMemo } from 'react';
import { tracker as trackerApi } from '../../api';
import { Spinner } from '../../components/UI';
import { G, GL, GLL, GOLD, BD, INK, INK2, INK3, OW, W, sans, serif } from '../../utils/theme';

function dateKey(d) { return d.toISOString().slice(0, 10); }
function startOfWeek(d) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
const WD = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

export default function HabitsTab() {
  const [habits, setHabits] = useState([]);
  const [logs, setLogs] = useState({}); // { 'YYYY-MM-DD': { habitId: true } }
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('week'); // 'week' | 'month'
  const [cursor, setCursor] = useState(new Date()); // ref date
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

  // Week / month range
  const weekDays = useMemo(() => {
    const s = startOfWeek(cursor);
    return Array.from({ length: 7 }, (_, i) => addDays(s, i));
  }, [cursor]);

  const monthDays = useMemo(() => {
    const y = cursor.getFullYear(), m = cursor.getMonth();
    const last = new Date(y, m + 1, 0).getDate();
    return Array.from({ length: last }, (_, i) => new Date(y, m, i + 1));
  }, [cursor]);

  function dayCompletion(d) {
    const log = logs[dateKey(d)] || {};
    const total = habits.length || 1;
    const done = habits.filter(h => log[h.id]).length;
    return done / total;
  }

  if (loading) return <Spinner />;

  const todayDone = habits.filter(h => todayLog[h.id]).length;
  const streak = (() => {
    let n = 0;
    let d = new Date();
    while (true) {
      const log = logs[dateKey(d)] || {};
      if (Object.values(log).some(Boolean)) { n++; d = addDays(d, -1); }
      else break;
    }
    return n;
  })();

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
        <div style={{ flex: 1, background: GLL, borderRadius: 16, padding: 16, textAlign: 'center' }}>
          <div style={{ fontFamily: serif, fontSize: 32, fontWeight: 700, color: G, lineHeight: 1 }}>{streak}</div>
          <div style={{ fontSize: 12, color: GL, marginTop: 5, fontFamily: sans }}>дней подряд</div>
        </div>
        <div style={{ flex: 1, background: '#FBF5EB', borderRadius: 16, padding: 16, textAlign: 'center' }}>
          <div style={{ fontFamily: serif, fontSize: 32, fontWeight: 700, color: GOLD, lineHeight: 1 }}>{todayDone}/{habits.length || 0}</div>
          <div style={{ fontSize: 12, color: GOLD, marginTop: 5, fontFamily: sans }}>сегодня</div>
        </div>
      </div>

      {/* View toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {['week','month'].map(v => (
          <button key={v} onClick={() => setView(v)}
            style={{ flex: 1, padding: '10px', border: '1px solid ' + (view === v ? G : BD), background: view === v ? G : W, color: view === v ? W : INK2, borderRadius: 12, fontFamily: sans, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {v === 'week' ? 'Неделя' : 'Месяц'}
          </button>
        ))}
      </div>

      {/* Calendar */}
      <div style={{ background: W, border: '1px solid ' + BD, borderRadius: 16, padding: 14, marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <button onClick={() => setCursor(view === 'week' ? addDays(cursor, -7) : new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            style={{ background: 'none', border: 'none', fontSize: 18, color: INK2, cursor: 'pointer' }}>‹</button>
          <div style={{ fontFamily: sans, fontSize: 13, color: INK, fontWeight: 600 }}>
            {view === 'week'
              ? `${weekDays[0].getDate()}–${weekDays[6].getDate()} ${weekDays[6].toLocaleDateString('ru-RU', { month: 'long' })}`
              : cursor.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
          </div>
          <button onClick={() => setCursor(view === 'week' ? addDays(cursor, 7) : new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            style={{ background: 'none', border: 'none', fontSize: 18, color: INK2, cursor: 'pointer' }}>›</button>
        </div>
        {view === 'week' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
            {weekDays.map((d, i) => {
              const c = dayCompletion(d);
              const isToday = dateKey(d) === today;
              return (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: INK3, fontFamily: sans, marginBottom: 4 }}>{WD[i]}</div>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, margin: '0 auto',
                    background: c > 0 ? `rgba(45, 74, 45, ${0.15 + c * 0.7})` : OW,
                    border: '1px solid ' + (isToday ? G : BD),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontFamily: sans, fontWeight: isToday ? 700 : 500,
                    color: c > 0.5 ? W : INK,
                  }}>{d.getDate()}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {Array(((monthDays[0].getDay() + 6) % 7)).fill(0).map((_,i) => <div key={'p'+i} />)}
            {monthDays.map((d, i) => {
              const c = dayCompletion(d);
              const isToday = dateKey(d) === today;
              return (
                <div key={i} style={{
                  height: 32, borderRadius: 8,
                  background: c > 0 ? `rgba(45, 74, 45, ${0.15 + c * 0.7})` : OW,
                  border: '1px solid ' + (isToday ? G : BD),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontFamily: sans, fontWeight: isToday ? 700 : 500,
                  color: c > 0.5 ? W : INK,
                }}>{d.getDate()}</div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI generate */}
      {habits.length === 0 && (
        <button onClick={aiGenerate} disabled={aiBusy}
          style={{ width: '100%', padding: 16, background: G, color: W, border: 'none', borderRadius: 14, fontFamily: sans, fontWeight: 700, fontSize: 15, marginBottom: 12, cursor: 'pointer', opacity: aiBusy ? 0.6 : 1 }}>
          {aiBusy ? 'Подбираем…' : '✨ Подобрать 5 привычек на основе Атласа'}
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
