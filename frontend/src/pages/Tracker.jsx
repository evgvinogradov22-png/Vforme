import { useState } from 'react';
import HabitsTab from './tracker/HabitsTab';
import SupplementsTab from './tracker/SupplementsTab';
import ShoppingTab from './tracker/ShoppingTab';
import { G, BD, INK2, OW, W, sans, serif } from '../utils/theme';

const TABS = [
  { id: 'habits',     label: 'Привычки',  icon: '✓' },
  { id: 'supplements',label: 'Добавки',   icon: '◈' },
  { id: 'shopping',   label: 'Покупки',   icon: '☰' },
];

export default function Tracker() {
  const [tab, setTab] = useState('habits');

  return (
    <div style={{ padding: '24px 20px 80px' }}>
      <div style={{ fontFamily: serif, fontSize: 32, fontWeight: 600, color: G, marginBottom: 6 }}>Трекер</div>
      <div style={{ fontSize: 14, color: INK2, marginBottom: 22, fontFamily: sans }}>Привычки, добавки и список покупок</div>

      <div style={{ display: 'flex', gap: 6, padding: 4, background: OW, border: '1px solid ' + BD, borderRadius: 14, marginBottom: 22 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '11px 8px',
              background: tab === t.id ? W : 'transparent',
              border: 'none',
              borderRadius: 10,
              fontFamily: sans, fontSize: 13, fontWeight: tab === t.id ? 700 : 500,
              color: tab === t.id ? G : INK2,
              cursor: 'pointer',
              boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              transition: 'all .15s',
            }}>
            <span style={{ marginRight: 5, opacity: 0.7 }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {tab === 'habits'      && <HabitsTab />}
      {tab === 'supplements' && <SupplementsTab />}
      {tab === 'shopping'    && <ShoppingTab />}
    </div>
  );
}
