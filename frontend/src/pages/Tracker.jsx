import { useState, useEffect, useMemo } from 'react';
import HabitsTab from './tracker/HabitsTab';
import SupplementsTab from './tracker/SupplementsTab';
import ShoppingTab from './tracker/ShoppingTab';
import { G, GL, GLL, BD, INK, INK2, INK3, OW, W, sans, serif } from '../utils/theme';

const TABS = [
  { id: 'habits',     label: 'Привычки',  icon: '✓' },
  { id: 'supplements',label: 'Добавки',   icon: '◈' },
  { id: 'shopping',   label: 'Покупки',   icon: '☰' },
];

export default function Tracker() {
  const [tab, setTab] = useState('habits');
  const [showStats, setShowStats] = useState(false);

  return (
    <div style={{ padding: '20px 20px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: serif, fontSize: 28, fontWeight: 600, color: G, lineHeight: 1.1 }}>Трекер</div>
          <div style={{ fontSize: 12, color: INK3, marginTop: 4, fontFamily: sans }}>
            {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
          </div>
        </div>
        <button onClick={() => setShowStats(s => !s)}
          style={{ padding: '8px 14px', background: showStats ? G : GLL, color: showStats ? W : G, border: '1px solid ' + G + '33', borderRadius: 10, fontFamily: sans, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Статистика
        </button>
      </div>

      {/* Stats overlay */}
      {showStats && <StatsCalendar onClose={() => setShowStats(false)} />}

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 6, padding: 4, background: OW, border: '1px solid ' + BD, borderRadius: 14, marginBottom: 18 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '10px 6px',
              background: tab === t.id ? W : 'transparent',
              border: 'none', borderRadius: 10,
              fontFamily: sans, fontSize: 13, fontWeight: tab === t.id ? 700 : 500,
              color: tab === t.id ? G : INK2,
              cursor: 'pointer',
              boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              transition: 'all .15s',
            }}>
            <span style={{ marginRight: 4, opacity: 0.7 }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {tab === 'habits'      && <HabitsTab />}
      {tab === 'supplements' && <SupplementsTab />}
      {tab === 'shopping'    && <ShoppingTab />}
    </div>
  );
}

/* ─── Календарь статистики ─── */
function dateKey(d) { return d.toISOString().slice(0, 10); }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

function StatsCalendar({ onClose }) {
  const [logs, setLogs] = useState({});
  const [habits, setHabits] = useState([]);
  const [cursor, setCursor] = useState(new Date());
  const [loaded, setLoaded] = useState(false);

  const today = dateKey(new Date());

  useEffect(() => {
    (async () => {
      try {
        const { tracker } = await import('../api');
        const r = await tracker.getHabits();
        setHabits(r.habits || []);
        const map = {};
        (r.logs || []).forEach(e => { map[e.date] = e.log || {}; });
        setLogs(map);
      } catch {} finally { setLoaded(true); }
    })();
  }, []);

  const y = cursor.getFullYear(), m = cursor.getMonth();
  const monthDays = useMemo(() => {
    const last = new Date(y, m + 1, 0).getDate();
    return Array.from({ length: last }, (_, i) => new Date(y, m, i + 1));
  }, [y, m]);

  function dayCompletion(d) {
    const log = logs[dateKey(d)] || {};
    const total = habits.length || 1;
    return habits.filter(h => log[h.id]).length / total;
  }

  // Streak
  const streak = (() => {
    let n = 0, d = new Date();
    while (true) {
      const log = logs[dateKey(d)] || {};
      if (Object.values(log).some(Boolean)) { n++; d = addDays(d, -1); } else break;
    }
    return n;
  })();

  const todayLog = logs[today] || {};
  const todayDone = habits.filter(h => todayLog[h.id]).length;

  const WD = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

  return (
    <div style={{ background: W, border: '1px solid ' + BD, borderRadius: 18, padding: 16, marginBottom: 18 }}>
      {/* Stats row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, background: GLL, borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
          <div style={{ fontFamily: serif, fontSize: 26, fontWeight: 700, color: G, lineHeight: 1 }}>{streak}</div>
          <div style={{ fontSize: 11, color: GL, marginTop: 3, fontFamily: sans }}>дней подряд</div>
        </div>
        <div style={{ flex: 1, background: '#FBF5EB', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
          <div style={{ fontFamily: serif, fontSize: 26, fontWeight: 700, color: '#C4A26B', lineHeight: 1 }}>{todayDone}/{habits.length || 0}</div>
          <div style={{ fontSize: 11, color: '#C4A26B', marginTop: 3, fontFamily: sans }}>сегодня</div>
        </div>
      </div>

      {/* Month nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <button onClick={() => setCursor(new Date(y, m - 1, 1))}
          style={{ background: 'none', border: 'none', fontSize: 18, color: INK2, cursor: 'pointer', padding: '4px 8px' }}>‹</button>
        <div style={{ fontFamily: sans, fontSize: 14, color: INK, fontWeight: 600, textTransform: 'capitalize' }}>
          {cursor.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
        </div>
        <button onClick={() => setCursor(new Date(y, m + 1, 1))}
          style={{ background: 'none', border: 'none', fontSize: 18, color: INK2, cursor: 'pointer', padding: '4px 8px' }}>›</button>
      </div>

      {/* Weekday header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 4 }}>
        {WD.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10, color: INK3, fontFamily: sans, fontWeight: 600 }}>{d}</div>)}
      </div>

      {/* Days grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {Array(((monthDays[0].getDay() + 6) % 7)).fill(0).map((_, i) => <div key={'p' + i} />)}
        {monthDays.map((d, i) => {
          const c = dayCompletion(d);
          const isToday = dateKey(d) === today;
          return (
            <div key={i} style={{
              height: 30, borderRadius: 7,
              background: c > 0 ? `rgba(45, 74, 45, ${0.15 + c * 0.75})` : OW,
              border: isToday ? '2px solid ' + G : '1px solid transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontFamily: sans, fontWeight: isToday ? 700 : 400,
              color: c > 0.5 ? W : INK2,
            }}>{d.getDate()}</div>
          );
        })}
      </div>

      {/* Close */}
      <button onClick={onClose}
        style={{ width: '100%', marginTop: 14, padding: 10, background: OW, border: '1px solid ' + BD, borderRadius: 10, fontFamily: sans, fontSize: 13, color: INK2, cursor: 'pointer' }}>
        Закрыть
      </button>
    </div>
  );
}
