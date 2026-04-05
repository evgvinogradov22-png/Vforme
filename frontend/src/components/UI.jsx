import { G, GL, GLL, GOLD, BD, INK, INK3, OW, W, RED, sans, serif } from '../utils/theme';

export function ScoreSlider({ value, onChange, min = 0, max = 10, label }) {
  const v = value ?? 5;
  const pct = ((v - min) / (max - min)) * 100;
  const color = pct < 30 ? RED : pct < 60 ? GOLD : G;
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 15, color: INK, fontWeight: 600, marginBottom: 16, lineHeight: 1.5 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontSize: 13, color: INK3, minWidth: 16 }}>{min}</span>
        <div style={{ flex: 1, position: 'relative', height: 36, display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, height: 6, background: BD, borderRadius: 4 }}>
            <div style={{ height: '100%', width: pct + '%', background: color, borderRadius: 4, transition: 'width .1s' }} />
          </div>
          <input type="range" min={min} max={max} value={v} onChange={e => onChange(Number(e.target.value))}
            style={{ position: 'absolute', left: 0, right: 0, width: '100%', opacity: 0, height: 36, cursor: 'pointer', margin: 0 }} />
          <div style={{ position: 'absolute', left: `calc(${pct}% - 13px)`, width: 26, height: 26, borderRadius: '50%', background: color, border: '2px solid ' + W, boxShadow: '0 2px 6px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', transition: 'left .1s' }}>
            <span style={{ fontSize: 11, color: W, fontWeight: 700 }}>{v}</span>
          </div>
        </div>
        <span style={{ fontSize: 13, color: INK3, minWidth: 16 }}>{max}</span>
      </div>
    </div>
  );
}

export function Toast({ message }) {
  if (!message) return null;
  return (
    <div style={{ position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)', background: G, color: W, borderRadius: 30, padding: '12px 28px', fontSize: 15, fontFamily: sans, fontWeight: 600, whiteSpace: 'nowrap', zIndex: 999, pointerEvents: 'none' }}>
      {message}
    </div>
  );
}

export function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
      <div style={{ width: 32, height: 32, border: `3px solid ${GLL}`, borderTop: `3px solid ${G}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function BackHeader({ onBack, title, subtitle, color = G }) {
  return (
    <div style={{ background: color, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: W, fontSize: 22, cursor: 'pointer' }}>←</button>
      <div style={{ flex: 1 }}>
        {subtitle && <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, letterSpacing: 1 }}>{subtitle}</div>}
        <div style={{ color: W, fontSize: subtitle ? 15 : 18, fontWeight: 700, marginTop: subtitle ? 2 : 0, fontFamily: subtitle ? sans : serif }}>{title}</div>
      </div>
    </div>
  );
}

export function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: INK3, fontFamily: sans }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 15 }}>{text}</div>
    </div>
  );
}
