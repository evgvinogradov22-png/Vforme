import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { G, GOLD, BD, INK, INK2, INK3, GLL, W, sans, serif } from '../utils/theme';

export default function Login({ onBack, onSwitchToRegister }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [screen, setScreen] = useState('login'); // 'login' | 'forgot' | 'forgot_sent'
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const submit = async () => {
    if (!email || !password) return;
    if (!validateEmail(email)) return setError('Введи корректный email');
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

  const sendReset = async () => {
    if (!resetEmail) return;
    if (!validateEmail(resetEmail)) return setError('Введи корректный email');
    setResetLoading(true);
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
      setScreen('forgot_sent');
    } catch (e) {}
    finally { setResetLoading(false); }
  };

  const inputStyle = {
    width: '100%', border: '1px solid ' + BD, borderRadius: 14,
    padding: '14px 16px', fontSize: 16, fontFamily: sans,
    color: INK, background: W, outline: 'none', boxSizing: 'border-box',
  };

  if (screen === 'forgot') return (
    <div style={{ fontFamily: sans, background: W, minHeight: '100vh', color: INK }}>
      <div style={{ background: G, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={() => setScreen('login')} style={{ background: 'none', border: 'none', color: W, fontSize: 22, cursor: 'pointer' }}>←</button>
        <div style={{ fontFamily: serif, fontSize: 20, color: W, fontWeight: 600 }}>Сброс пароля</div>
      </div>
      <div style={{ padding: '32px 24px' }}>
        <div style={{ fontFamily: serif, fontSize: 28, fontWeight: 600, color: G, marginBottom: 8 }}>Забыли пароль?</div>
        <div style={{ fontSize: 15, color: INK2, marginBottom: 32, lineHeight: 1.5 }}>Введи email — пришлём ссылку для сброса пароля</div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: INK2, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>EMAIL</div>
          <input type="email" placeholder="example@mail.ru" value={resetEmail}
            onChange={e => setResetEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendReset()}
            style={inputStyle} />
        </div>
        <button onClick={sendReset} disabled={!resetEmail || resetLoading}
          style={{ width: '100%', padding: '18px', background: resetEmail && !resetLoading ? GOLD : '#EDE8E0', border: 'none', borderRadius: 30, color: resetEmail && !resetLoading ? W : INK3, fontFamily: sans, fontWeight: 700, fontSize: 16, cursor: resetEmail && !resetLoading ? 'pointer' : 'not-allowed' }}>
          {resetLoading ? 'ОТПРАВЛЯЕМ...' : 'ОТПРАВИТЬ ССЫЛКУ'}
        </button>
      </div>
    </div>
  );

  if (screen === 'forgot_sent') return (
    <div style={{ fontFamily: sans, background: W, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 24 }}>📬</div>
      <div style={{ fontFamily: serif, fontSize: 26, fontWeight: 600, color: G, marginBottom: 12 }}>Письмо отправлено</div>
      <div style={{ fontSize: 15, color: INK2, lineHeight: 1.7, marginBottom: 32, maxWidth: 300 }}>
        Проверь почту <strong>{resetEmail}</strong> и перейди по ссылке для сброса пароля.
      </div>
      <div style={{ background: GLL, borderRadius: 16, padding: '16px 20px', marginBottom: 32, maxWidth: 300, width: '100%' }}>
        <div style={{ fontSize: 13, color: G, lineHeight: 1.6 }}>Ссылка действует 1 час.<br/>Проверь папку «Спам».</div>
      </div>
      <button onClick={() => setScreen('login')}
        style={{ width: '100%', maxWidth: 300, padding: '16px', background: GOLD, border: 'none', borderRadius: 30, color: W, fontFamily: sans, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
        ВЕРНУТЬСЯ КО ВХОДУ
      </button>
    </div>
  );

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
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 12, color: INK2, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>ПАРОЛЬ</div>
          <input type="password" placeholder="Введи пароль" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            style={inputStyle} />
        </div>

        <div style={{ textAlign: 'right', marginBottom: 20 }}>
          <span onClick={() => { setResetEmail(email); setScreen('forgot'); }}
            style={{ fontSize: 13, color: G, cursor: 'pointer', fontWeight: 600 }}>
            Забыли пароль?
          </span>
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
