import { useState, useMemo } from 'react';
import HabitsTab from './tracker/HabitsTab';
import SupplementsTab from './tracker/SupplementsTab';
import ShoppingTab from './tracker/ShoppingTab';
import { G, GL, BD, INK, INK2, INK3, OW, W, sans, serif } from '../utils/theme';

const TABS = [
  { id: 'habits',     label: 'Привычки',  icon: '✓' },
  { id: 'supplements',label: 'Добавки',   icon: '◈' },
  { id: 'shopping',   label: 'Покупки',   icon: '☰' },
];

function dateKey(d) { return d.toISOString().slice(0, 10); }
function startOfWeek(d) {
  const x = new Date(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); x.setHours(0,0,0,0); return x;
}
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
const WD_SHORT = ['П','В','С','Ч','П','С','В'];

export default function Tracker() {
  const [tab, setTab] = useState('habits');
  const today = dateKey(new Date());

  // Compact week strip
  const weekDays = useMemo(() => {
    const s = startOfWeek(new Date());
    return Array.from({ length: 7 }, (_, i) => addDays(s, i));
  }, []);

  return (
    <div style={{ padding: '20px 20px 80px' }}>
      {/* Header row: title + compact week */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: serif, fontSize: 28, fontWeight: 600, color: G, lineHeight: 1.1 }}>Трекер</div>
          <div style={{ fontSize: 12, color: INK3, marginTop: 4, fontFamily: sans }}>
            {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
          </div>
        </div>
        {/* Week strip */}
        <div style={{ display: 'flex', gap: 4 }}>
          {weekDays.map((d, i) => {
            const isToday = dateKey(d) === today;
            return (
              <div key={i} style={{ textAlign: 'center', width: 30 }}>
                <div style={{ fontSize: 9, color: INK3, fontFamily: sans, marginBottom: 2, fontWeight: 500 }}>{WD_SHORT[i]}</div>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: isToday ? G : 'transparent',
                  border: isToday ? 'none' : '1px solid ' + BD,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontFamily: sans, fontWeight: isToday ? 700 : 500,
                  color: isToday ? W : INK2,
                }}>{d.getDate()}</div>
              </div>
            );
          })}
        </div>
      </div>

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
