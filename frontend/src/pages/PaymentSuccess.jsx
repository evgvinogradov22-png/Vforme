import { useEffect, useState } from 'react';
import { G, GOLD, W, INK2, sans, serif } from '../utils/theme';

export default function PaymentSuccess({ onContinue }) {
  const [dots, setDots] = useState(0);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    // Анимация точек
    const t = setInterval(() => setDots(d => (d + 1) % 4), 500);

    // Polling — проверяем каждые 2 сек открылся ли доступ
    const token = localStorage.getItem('vforme_token');
    if (!token) return () => clearInterval(t);

    let attempts = 0;
    let prevAccess = null;

    const poll = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if (prevAccess === null) {
          prevAccess = (data.programAccess || []).length;
        } else if ((data.programAccess || []).length > prevAccess) {
          setConfirmed(true);
          clearInterval(poll);
          setTimeout(() => onContinue && onContinue(), 2000);
        }
      } catch(e) {}
      if (attempts >= 30) clearInterval(poll);
    }, 2000);

    return () => { clearInterval(t); clearInterval(poll); };
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: G, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', fontFamily: sans }}>
      <div style={{ maxWidth: 360, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 80, marginBottom: 24 }}>{confirmed ? '🎉' : '🌿'}</div>

        <div style={{ fontFamily: serif, fontSize: 28, fontWeight: 700, color: W, marginBottom: 16 }}>
          {confirmed ? 'Доступ открыт!' : 'Спасибо за оплату!'}
        </div>

        <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: 32 }}>
          {confirmed
            ? 'Программа добавлена в ваш кабинет. Переходим...'
            : 'Подтверждаем платёж и открываем доступ к программе. Это займёт не более 2 минут.'}
        </div>

        {!confirmed && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 40 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: 12, height: 12, borderRadius: '50%',
                background: dots === i ? GOLD : 'rgba(255,255,255,0.3)',
                transition: 'background 0.3s'
              }} />
            ))}
          </div>
        )}

        <button onClick={() => onContinue && onContinue()}
          style={{ width: '100%', padding: '16px', background: GOLD, border: 'none', borderRadius: 30, color: W, fontSize: 16, fontWeight: 700, cursor: 'pointer', letterSpacing: 1 }}>
          {confirmed ? 'ПЕРЕЙТИ К ПРОГРАММЕ' : 'ПЕРЕЙТИ В КАБИНЕТ'}
        </button>
      </div>
    </div>
  );
}
