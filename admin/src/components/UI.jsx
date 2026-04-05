export const C = {
  green: '#2D4A2D',
  greenL: '#3D6B3D',
  greenLL: '#EBF0EB',
  gold: '#C4A26B',
  bg: '#F4F5F7',
  white: '#FFFFFF',
  border: '#E2E4E8',
  ink: '#1A1A1A',
  ink2: '#555',
  ink3: '#999',
  red: '#CC4444',
  redbg: '#FFF0F0',
  blue: '#3B82F6',
  bluebg: '#EFF6FF',
  orange: '#F59E0B',
  orangebg: '#FFFBEB',
  purple: '#7C3AED',
  purplebg: '#F5F3FF',
};

export function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
      <div style={{ width: 32, height: 32, border: `3px solid ${C.greenLL}`, borderTop: `3px solid ${C.green}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function Toast({ message, type = 'success' }) {
  if (!message) return null;
  const bg = type === 'error' ? C.red : C.green;
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, background: bg, color: '#fff', borderRadius: 12, padding: '12px 20px', fontSize: 14, fontWeight: 600, zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
      {message}
    </div>
  );
}

export function Card({ children, style }) {
  return (
    <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: 24, ...style }}>
      {children}
    </div>
  );
}

export function Btn({ children, onClick, variant = 'primary', size = 'md', disabled, style }) {
  const base = { border: 'none', borderRadius: 10, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, transition: 'opacity .15s', fontFamily: 'Arial, sans-serif', ...style };
  const sizes = { sm: { padding: '6px 12px', fontSize: 13 }, md: { padding: '10px 18px', fontSize: 14 }, lg: { padding: '14px 24px', fontSize: 15 } };
  const variants = {
    primary: { background: C.green, color: '#fff' },
    gold: { background: C.gold, color: '#fff' },
    danger: { background: C.red, color: '#fff' },
    ghost: { background: 'transparent', color: C.ink2, border: `1px solid ${C.border}` },
    outline: { background: 'transparent', color: C.green, border: `1px solid ${C.green}` },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...sizes[size], ...variants[variant] }}>{children}</button>;
}

export function Badge({ children, color = 'green' }) {
  const colors = {
    green: { bg: C.greenLL, text: C.green },
    gold: { bg: '#FBF5EB', text: '#A8885A' },
    red: { bg: C.redbg, text: C.red },
    blue: { bg: C.bluebg, text: C.blue },
    purple: { bg: C.purplebg, text: C.purple },
    gray: { bg: '#F3F4F6', text: C.ink3 },
  };
  const { bg, text } = colors[color] || colors.gray;
  return <span style={{ background: bg, color: text, fontSize: 12, fontWeight: 700, borderRadius: 20, padding: '3px 10px', display: 'inline-block' }}>{children}</span>;
}

export function Input({ label, value, onChange, placeholder, type = 'text', style }) {
  return (
    <div style={{ marginBottom: 16, ...style }}>
      {label && <div style={{ fontSize: 12, fontWeight: 700, color: C.ink2, marginBottom: 6, letterSpacing: 0.5 }}>{label.toUpperCase()}</div>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 14, color: C.ink, background: C.white, outline: 'none', boxSizing: 'border-box', fontFamily: 'Arial, sans-serif' }} />
    </div>
  );
}

export function Textarea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <div style={{ fontSize: 12, fontWeight: 700, color: C.ink2, marginBottom: 6, letterSpacing: 0.5 }}>{label.toUpperCase()}</div>}
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 14, color: C.ink, background: C.white, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'Arial, sans-serif' }} />
    </div>
  );
}

export function Modal({ title, onClose, children, width = 560 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: C.white, borderRadius: 20, width: '100%', maxWidth: width, maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.ink }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: C.ink3, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

export function Table({ columns, data, onRow }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ background: '#F9FAFB' }}>
            {columns.map((col, i) => (
              <th key={i} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.ink3, letterSpacing: 0.5, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>
                {col.title.toUpperCase()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} onClick={() => onRow && onRow(row)} style={{ borderBottom: `1px solid ${C.border}`, cursor: onRow ? 'pointer' : 'default', transition: 'background .1s' }}
              onMouseEnter={e => onRow && (e.currentTarget.style.background = '#F9FAFB')}
              onMouseLeave={e => onRow && (e.currentTarget.style.background = 'transparent')}>
              {columns.map((col, j) => (
                <td key={j} style={{ padding: '14px 16px', color: C.ink, verticalAlign: 'middle' }}>
                  {col.render ? col.render(row[col.key], row) : row[col.key] || '—'}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr><td colSpan={columns.length} style={{ padding: '32px 16px', textAlign: 'center', color: C.ink3 }}>Пусто</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
