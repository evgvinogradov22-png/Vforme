import { G, GOLD, W, sans, serif } from '../utils/theme';

export default function Landing({ onRegister, onLogin }) {
  return (
    <div style={{ fontFamily: sans, background: G, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', color: W }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>🌿</div>
      <div style={{ fontFamily: serif, fontSize: 44, fontWeight: 600, letterSpacing: 2, marginBottom: 8, textAlign: 'center' }}>V ФОРМЕ</div>
      <div style={{ fontSize: 14, color: GOLD, marginBottom: 8, textAlign: 'center', lineHeight: 1.5 }}>Приложение для оздоровления</div>
      <div style={{ fontSize: 14, color: GOLD, marginBottom: 52, textAlign: 'center', lineHeight: 1.5 }}>Нутрициолога Кристины Виноградовой</div>
      <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button onClick={onRegister} style={{ width: '100%', padding: '18px', background: GOLD, border: 'none', borderRadius: 30, color: W, fontFamily: sans, fontWeight: 700, fontSize: 16, letterSpacing: 1.5, cursor: 'pointer' }}>
          РЕГИСТРАЦИЯ
        </button>
        <button onClick={onLogin} style={{ width: '100%', padding: '18px', background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 30, color: W, fontFamily: sans, fontWeight: 400, fontSize: 15, cursor: 'pointer' }}>
          Войти в кабинет
        </button>
      </div>
    </div>
  );
}
