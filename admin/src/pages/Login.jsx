import { useState } from 'react';
import { auth as authApi } from '../api';
import { C, Btn, Input } from '../components/UI';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !password) return;
    setError('');
    setLoading(true);
    try {
      const data = await authApi.login(email, password);
      if (!['admin', 'superadmin'].includes(data.user.role)) {
        throw new Error('Нет доступа к панели администратора');
      }
      localStorage.setItem('vforme_admin_token', data.token);
      onLogin(data.user);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: C.white, borderRadius: 20, padding: 40, width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🌿</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.green, letterSpacing: 2 }}>V ФОРМЕ</div>
          <div style={{ fontSize: 13, color: C.ink3, marginTop: 4 }}>Панель управления</div>
        </div>

        <Input label="Email" value={email} onChange={setEmail} placeholder="admin@nutrikris.ru" type="email" />
        <Input label="Пароль" value={password} onChange={setPassword} placeholder="••••••••" type="password" />

        {error && (
          <div style={{ background: C.redbg, border: `1px solid #FFCCCC`, borderRadius: 10, padding: '10px 14px', fontSize: 13, color: C.red, marginBottom: 16 }}>{error}</div>
        )}

        <Btn onClick={submit} disabled={!email || !password || loading} variant="primary" size="lg" style={{ width: '100%' }}>
          {loading ? 'ВХОД...' : 'ВОЙТИ'}
        </Btn>
      </div>
    </div>
  );
}
