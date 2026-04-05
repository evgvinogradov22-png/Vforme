import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { G, GOLD, BD, INK, INK2, INK3, W, sans, serif } from '../utils/theme';

export default function Login({ onBack, onSwitchToRegister }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !password) return;
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', border: '1px solid ' + BD, borderRadius: 14,
    padding: '14px 16px', fontSize: 16, fontFamily: sans,
    color: INK, background: W, outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ fontFamily: sans, background: W, minHeight: '100vh', color: INK }}>
      <div style={{ background: G, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: W, fontSize: 22, cursor: 'pointer' }}>←</button>
        <div style={{ fontFamily: serif, fontSize: 20, color: W, fontWeight: 600 }}>Вход</div>
      </div>
      <div style={{ padding: '32px 24px' }}>
        <div style={{ fontFamily: serif, fontSize: 30, fontWeight: 600, color: G, marginBottom: 6 }}>С возвращением</div>
        <div style={{ fontSize: 15, color: INK2, marginBottom: 32, lineHeight: 1.5 }}>Войди в свой личный кабинет</div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: INK2, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>EMAIL</div>
          <input type="email" placeholder="example@mail.ru" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: INK2, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>ПАРОЛЬ</div>
          <input type="password" placeholder="Введи пароль" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            style={inputStyle} />
        </div>

        {error && <div style={{ background: '#FFF0F0', border: '1px solid #FFCCCC', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: '#CC4444', marginBottom: 16 }}>{error}</div>}

        <button onClick={submit} disabled={!email || !password || loading}
          style={{ width: '100%', padding: '18px', background: email && password && !loading ? GOLD : '#EDE8E0', border: 'none', borderRadius: 30, color: email && password && !loading ? W : INK3, fontFamily: sans, fontWeight: 700, fontSize: 16, cursor: email && password && !loading ? 'pointer' : 'not-allowed', marginTop: 8 }}>
          {loading ? 'ВХОД...' : 'ВОЙТИ'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: INK3 }}>
          Нет аккаунта?{' '}
          <span onClick={onSwitchToRegister} style={{ color: G, fontWeight: 700, cursor: 'pointer' }}>Зарегистрироваться</span>
        </div>
      </div>
    </div>
  );
}
