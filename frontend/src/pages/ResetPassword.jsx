import { useState, useEffect } from 'react';
import { G, GOLD, BD, INK, INK2, INK3, GLL, W, sans, serif } from '../utils/theme';

export default function ResetPassword({ onDone }) {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (t) setToken(t);
  }, []);

  const submit = async () => {
    if (!password || password.length < 6) return setError('Пароль минимум 6 символов');
    if (password !== confirm) return setError('Пароли не совпадают');
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка');
      setDone(true);
      window.history.replaceState({}, '', '/');
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

  if (done) return (
    <div style={{ fontFamily: sans, background: W, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 24 }}>✅</div>
      <div style={{ fontFamily: serif, fontSize: 26, fontWeight: 600, color: G, marginBottom: 12 }}>Пароль изменён!</div>
      <div style={{ fontSize: 15, color: INK2, marginBottom: 32 }}>Теперь можешь войти с новым паролем.</div>
      <button onClick={onDone}
        style={{ padding: '16px 40px', background: GOLD, border: 'none', borderRadius: 30, color: W, fontFamily: sans, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
        ВОЙТИ
      </button>
    </div>
  );

  return (
    <div style={{ fontFamily: sans, background: W, minHeight: '100vh', color: INK }}>
      <div style={{ background: G, padding: '20px 24px' }}>
        <div style={{ fontFamily: serif, fontSize: 20, color: W, fontWeight: 600 }}>Новый пароль</div>
      </div>
      <div style={{ padding: '32px 24px' }}>
        <div style={{ fontFamily: serif, fontSize: 28, fontWeight: 600, color: G, marginBottom: 8 }}>Придумай новый пароль</div>
        <div style={{ fontSize: 15, color: INK2, marginBottom: 32, lineHeight: 1.5 }}>Минимум 6 символов</div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: INK2, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>НОВЫЙ ПАРОЛЬ</div>
          <input type="password" placeholder="Минимум 6 символов" value={password}
            onChange={e => setPassword(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: INK2, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>ПОВТОРИ ПАРОЛЬ</div>
          <input type="password" placeholder="Введи ещё раз" value={confirm}
            onChange={e => setConfirm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            style={inputStyle} />
        </div>

        {error && <div style={{ background: '#FFF0F0', border: '1px solid #FFCCCC', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: '#CC4444', marginBottom: 16 }}>{error}</div>}

        {!token && (
          <div style={{ background: '#FFF0F0', border: '1px solid #FFCCCC', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: '#CC4444', marginBottom: 16 }}>
            Ссылка недействительна. Запросите сброс пароля заново.
          </div>
        )}

        <button onClick={submit} disabled={!password || !confirm || !token || loading}
          style={{ width: '100%', padding: '18px', background: password && confirm && token && !loading ? GOLD : '#EDE8E0', border: 'none', borderRadius: 30, color: password && confirm && token && !loading ? W : INK3, fontFamily: sans, fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
          {loading ? 'СОХРАНЯЕМ...' : 'СОХРАНИТЬ ПАРОЛЬ'}
        </button>
      </div>
    </div>
  );
}
