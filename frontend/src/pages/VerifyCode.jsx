import { useState, useRef, useEffect } from 'react';
import { auth as authApi } from '../api';
import { G, GLL, GOLD, BD, INK2, INK3, W, sans, serif } from '../utils/theme';

export default function VerifyCode({ user, setUser, logout }) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const inputRefs = useRef([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(timer); resend(); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (i, val) => {
    if (!/^[0-9]?$/.test(val)) return;
    const newCode = [...code];
    newCode[i] = val;
    setCode(newCode);
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
    if (newCode.every(d => d)) submitCode(newCode.join(''));
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newCode = ['', '', '', '', '', ''];
    pasted.split('').forEach((ch, idx) => { newCode[idx] = ch; });
    setCode(newCode);
    const nextEmpty = newCode.findIndex(d => !d);
    const focusIdx = nextEmpty === -1 ? 5 : nextEmpty;
    inputRefs.current[focusIdx]?.focus();
    if (pasted.length === 6) submitCode(pasted);
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) inputRefs.current[i - 1]?.focus();
  };

  const submitCode = async (c) => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('vforme_token') },
        body: JSON.stringify({ code: c }),
      });
      const data = await res.json();
      if (data.ok) { const u = await authApi.me(); if (u) setUser(u); }
      else { setError(data.error || 'Неверный код'); setCode(['', '', '', '', '', '']); inputRefs.current[0]?.focus(); }
    } catch(e) { setError('Ошибка. Попробуй ещё раз.'); }
    setLoading(false);
  };

  const resend = async () => {
    try {
      await fetch('/api/auth/resend-verify', { method: 'POST', headers: { 'Authorization': 'Bearer ' + localStorage.getItem('vforme_token') } });
      setSent(true); setTimeout(() => setSent(false), 60000);
    } catch(e) {}
  };

  return (
    <div style={{ fontFamily: sans, background: W, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
      <div style={{ fontFamily: serif, fontSize: 24, fontWeight: 600, color: G, marginBottom: 8 }}>
        Введи код
      </div>
      <div style={{ fontSize: 14, color: INK2, lineHeight: 1.6, marginBottom: 28, maxWidth: 280 }}>
        Мы отправили 6-значный код на <strong>{user.email}</strong>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, width: '100%', maxWidth: 340, justifyContent: 'center' }}>
        {code.map((d, i) => (
          <input
            key={i}
            ref={el => inputRefs.current[i] = el}
            value={d}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            onPaste={handlePaste}
            maxLength={1}
            inputMode="numeric"
            autoFocus={i === 0}
            style={{
              width: '100%', maxWidth: 48, height: 56,
              textAlign: 'center',
              fontSize: 24, fontWeight: 700,
              fontFamily: sans,
              border: `2px solid ${error ? '#E53935' : d ? G : BD}`,
              borderRadius: 12,
              outline: 'none',
              color: G,
              background: d ? GLL : W,
              transition: 'all .15s',
              minWidth: 0,
            }}
          />
        ))}
      </div>

      {error && <div style={{ color: '#E53935', fontSize: 14, marginBottom: 12 }}>{error}</div>}
      {loading && <div style={{ color: INK3, fontSize: 14, marginBottom: 12 }}>Проверяем...</div>}

      <div style={{ fontSize: 13, color: INK3, marginTop: 8 }}>
        Не получил?{' '}
        {sent
          ? <span style={{ color: G }}>Отправлено ✓</span>
          : countdown > 0
            ? <span style={{ color: INK3 }}>Новый код через {countdown} сек</span>
            : <span onClick={resend} style={{ color: G, fontWeight: 700, cursor: 'pointer' }}>Отправить ещё раз</span>
        }
        {' · '}
        <span onClick={logout} style={{ color: INK3, cursor: 'pointer' }}>Выйти</span>
      </div>
    </div>
  );
}
