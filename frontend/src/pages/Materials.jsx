import { useState } from 'react';
import Protocols from './Protocols';
import Supplements from './Supplements';
import Recipes from './Recipes';

export default function Materials({ flash, user }) {
  const [sub, setSub] = useState('protocols');
  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#F9F7F4' }}>
      <div style={{ display: 'flex', borderBottom: '2px solid #ddd', background: '#fff', padding: '0' }}>
        {[
          { id: 'protocols', label: '📋 Протоколы' },
          { id: 'supplements', label: '💊 Схемы БАД' },
          { id: 'recipes', label: '🥗 Рецепты' },
        ].map(t => (
          <button key={t.id} onClick={() => setSub(t.id)} style={{
            flex: 1, padding: '14px 4px', border: 'none', background: 'none',
            borderBottom: sub === t.id ? '3px solid #2D4A2D' : '3px solid transparent',
            color: sub === t.id ? '#2D4A2D' : '#888',
            fontWeight: sub === t.id ? 700 : 400, fontSize: 12, cursor: 'pointer',
            display: 'block',
          }}>{t.label}</button>
        ))}
      </div>
      <div style={{ display: sub === 'protocols' ? 'block' : 'none' }}><Protocols flash={flash} /></div>
      <div style={{ display: sub === 'supplements' ? 'block' : 'none' }}><Supplements /></div>
      <div style={{ display: sub === 'recipes' ? 'block' : 'none' }}><Recipes user={user} flash={flash} /></div>
    </div>
  );
}
