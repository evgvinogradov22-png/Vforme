import { useState, useEffect } from 'react';
import { tracker as trackerApi } from '../api';
import { Spinner } from '../components/UI';
import { G, GL, GLL, GOLD, GOLDD, BD, INK, INK2, INK3, OW, W, sans, serif } from '../utils/theme';

const DEFAULT_HABITS = [
  { id: 'h1', icon: '💧', title: 'Вода', subtitle: '1,5–2 литра в день', color: '#6B8EC4' },
  { id: 'h2', icon: '🌿', title: 'Без сахара', subtitle: 'Весь день без сладкого', color: '#6B8E6B' },
  { id: 'h3', icon: '🌬', title: 'Дыхание', subtitle: '5 минут практики', color: '#8B7BB8' },
  { id: 'h4', icon: '🚶', title: 'Движение', subtitle: '30 минут активности', color: '#C4A26B' },
  { id: 'h5', icon: '🌙', title: 'Сон до 23:00', subtitle: 'Ложусь вовремя', color: '#6B7EA8' },
  { id: 'h6', icon: '🥣', title: 'Костный бульон', subtitle: 'Каждый день', color: '#7A9E5A' },
  { id: 'h7', icon: '🥗', title: 'Овощи', subtitle: '3 порции в день', color: '#5A8A5A' },
  { id: 'h8', icon: '📝', title: 'Дневник питания', subtitle: 'Записала всё', color: '#A87B55' },
];

function getTodayKey() { return new Date().toISOString().slice(0, 10); }

export default function Tracker({ flash }) {
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState(DEFAULT_HABITS);
  const [habitLog, setHabitLog] = useState({});
  const [loading, setLoading] = useState(true);
  const [addingHabit, setAddingHabit] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState('');

  const today = getTodayKey();
  const todayLog = habitLog[today] || {};

  useEffect(() => {
    Promise.all([trackerApi.getTasks(), trackerApi.getHabits()])
      .then(([t, h]) => {
        setTasks(t);
        // build habitLog from server data
        const log = {};
        h.forEach(entry => { log[entry.date] = entry.log || {}; });
        setHabitLog(log);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleTask = async (id, done) => {
    try {
      await trackerApi.updateTask(id, { done });
      setTasks(p => p.map(t => t.id === id ? { ...t, done } : t));
    } catch (e) {}
  };

  const toggleHabit = async (hid) => {
    const prev = habitLog[today] || {};
    const newLog = { ...prev, [hid]: !prev[hid] };
    setHabitLog(p => ({ ...p, [today]: newLog }));
    try {
      await trackerApi.saveHabit({ date: today, log: newLog });
    } catch (e) {
      // revert on error
      setHabitLog(p => ({ ...p, [today]: prev }));
    }
  };

  const addHabit = () => {
    if (!newHabitTitle.trim()) return;
    setHabits(p => [...p, { id: 'c' + Date.now(), icon: '⭐', title: newHabitTitle.trim(), subtitle: 'Каждый день', color: GOLD }]);
    setNewHabitTitle('');
    setAddingHabit(false);
  };

  if (loading) return <Spinner />;

  const streak = Object.keys(habitLog).filter(d => Object.values(habitLog[d] || {}).some(Boolean)).length;
  const todayDone = habits.filter(h => todayLog[h.id]).length;
  const pendingTasks = tasks.filter(t => !t.done);
  const doneTasks = tasks.filter(t => t.done);

  return (
    <div style={{ padding: '24px 20px' }}>
      <div style={{ fontFamily: serif, fontSize: 32, fontWeight: 600, color: G, marginBottom: 6 }}>Трекер</div>
      <div style={{ fontSize: 15, color: INK2, marginBottom: 24, fontFamily: sans }}>Привычки и задачи из программ</div>

      {tasks.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: INK3, letterSpacing: 1.5, fontWeight: 700, marginBottom: 14, fontFamily: sans }}>ЗАДАЧИ ИЗ ПРОГРАММ</div>
          {pendingTasks.map(t => (
            <div key={t.id} onClick={() => toggleTask(t.id, true)}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 16px', border: '1px solid ' + BD, borderRadius: 16, marginBottom: 8, background: W, cursor: 'pointer' }}>
              <div style={{ width: 24, height: 24, borderRadius: 7, border: '2px solid ' + GOLD, background: W, flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, color: INK, fontFamily: sans }}>{t.text}</div>
                {t.source && <div style={{ fontSize: 12, color: INK3, marginTop: 3, fontFamily: sans }}>Из урока: {t.source}</div>}
              </div>
            </div>
          ))}
          {doneTasks.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 16px', border: '1px solid ' + BD, borderRadius: 16, marginBottom: 8, background: OW, opacity: 0.6 }}>
              <div style={{ width: 24, height: 24, borderRadius: 7, border: '2px solid ' + G, background: G, flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: W, fontSize: 12 }}>✓</span>
              </div>
              <div style={{ fontSize: 15, color: INK3, textDecoration: 'line-through', fontFamily: sans }}>{t.text}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, background: GLL, borderRadius: 16, padding: '16px', textAlign: 'center' }}>
          <div style={{ fontFamily: serif, fontSize: 34, fontWeight: 700, color: G, lineHeight: 1 }}>{streak}</div>
          <div style={{ fontSize: 13, color: GL, marginTop: 5, fontFamily: sans }}>дней подряд</div>
        </div>
        <div style={{ flex: 1, background: '#FBF5EB', borderRadius: 16, padding: '16px', textAlign: 'center' }}>
          <div style={{ fontFamily: serif, fontSize: 34, fontWeight: 700, color: GOLD, lineHeight: 1 }}>{todayDone}/{habits.length}</div>
          <div style={{ fontSize: 13, color: GOLD, marginTop: 5, fontFamily: sans }}>сегодня</div>
        </div>
      </div>

      <div style={{ fontSize: 11, color: INK3, letterSpacing: 1.5, fontWeight: 700, marginBottom: 14, fontFamily: sans }}>ЕЖЕДНЕВНЫЕ ПРИВЫЧКИ</div>
      {habits.map(h => {
        const done = !!todayLog[h.id];
        return (
          <div key={h.id} onClick={() => toggleHabit(h.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 18px', border: '1px solid ' + (done ? h.color + '66' : BD), borderRadius: 18, marginBottom: 10, background: done ? h.color + '12' : W, cursor: 'pointer', transition: 'all .2s' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: done ? h.color : h.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
              {done ? '✓' : h.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: done ? h.color : INK, fontFamily: sans }}>{h.title}</div>
              <div style={{ fontSize: 13, color: INK3, marginTop: 2, fontFamily: sans }}>{h.subtitle}</div>
            </div>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid ' + (done ? h.color : BD), background: done ? h.color : W, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {done && <span style={{ color: W, fontSize: 14 }}>✓</span>}
            </div>
          </div>
        );
      })}

      {addingHabit ? (
        <div style={{ border: '1px solid ' + GOLD, borderRadius: 18, padding: '16px 18px', marginTop: 8 }}>
          <input autoFocus placeholder="Название привычки" value={newHabitTitle} onChange={e => setNewHabitTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addHabit()}
            style={{ width: '100%', border: 'none', borderBottom: '1px solid ' + BD, padding: '8px 0', fontSize: 16, fontFamily: sans, color: INK, outline: 'none', background: 'transparent', marginBottom: 14, boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={addHabit} style={{ flex: 1, padding: '12px', background: G, border: 'none', borderRadius: 12, color: W, fontFamily: sans, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Добавить</button>
            <button onClick={() => setAddingHabit(false)} style={{ padding: '12px 16px', background: OW, border: '1px solid ' + BD, borderRadius: 12, color: INK2, fontFamily: sans, fontSize: 15, cursor: 'pointer' }}>Отмена</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAddingHabit(true)} style={{ width: '100%', padding: '16px', background: W, border: '1px dashed ' + BD, borderRadius: 18, color: INK2, fontFamily: sans, fontSize: 16, cursor: 'pointer', marginTop: 8 }}>
          + Добавить свою привычку
        </button>
      )}
    </div>
  );
}
