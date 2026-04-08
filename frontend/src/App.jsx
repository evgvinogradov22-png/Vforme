import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { auth as authApi } from './api';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Programs from './pages/Programs';
import Supplements from './pages/Supplements';
import Recipes from './pages/Recipes';
import Tracker from './pages/Tracker';
import Cabinet from './pages/Cabinet';
import Protocols from './pages/Protocols';
import ResetPassword from './pages/ResetPassword';
import VerifyCode from './pages/VerifyCode';
import PaymentSuccess from './pages/PaymentSuccess';
import Materials from './pages/Materials';
import Chat from './pages/Chat';
import { analytics } from './utils/analytics';
import { log } from './utils/log';
import { Toast, Spinner } from './components/UI';
import { G, GOLD, BD, INK3, W, sans, serif } from './utils/theme';

const TABS = [
  { id: 'programs',  icon: '📚', label: 'Программы' },
  { id: 'materials', icon: '📋', label: 'Протоколы' },
  { id: 'chat',      icon: '💬', label: 'Чат' },
  { id: 'tracker',   icon: '✦',  label: 'Трекер' },
  { id: 'cabinet',   icon: '◎',  label: 'Кабинет' },
];

function AppShell() {
  const { user, loading, setUser, logout } = useAuth();
  const [screen, setScreen] = useState('landing');
  const [tab, setTab] = useState('programs');
  const [toast, setToast] = useState(null);
  const [justRegistered, setJustRegistered] = useState(() => sessionStorage.getItem('justRegistered') === 'true');
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(() => {
    const p = new URLSearchParams(window.location.search).get('payment');
    if (p === 'success') { window.history.replaceState({}, '', '/'); return true; }
    return false;
  });

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // Роуты
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname;
    if (params.get('verified') === 'true') {
      authApi.me().then(u => { if (u) setUser(u); });
      window.history.replaceState({}, '', '/');
    }
    if (path === '/reset-password') setScreen('reset');
  }, []);

  // Сессия
  useEffect(() => {
    if (user) log.sessionStart();
  }, [user?.id]);

  // Слушаем Prodamus
  useEffect(() => {
    const check = () => {
      const p = new URLSearchParams(window.location.search).get('payment');
      if (p === 'success') {
        window.history.replaceState({}, '', '/');
        setShowPaymentSuccess(true);
        analytics.paymentSuccess('Покупка', 0);
        log.paymentSuccess('Покупка', 0);
      }
    };
    const onMessage = (e) => {
      try {
        const d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (d && (d.payment_status === 'success' || d.status === 'success' || d.type === 'payment_success')) {
          setShowPaymentSuccess(true);
        }
      } catch {}
    };
    window.addEventListener('message', onMessage);
    window.addEventListener('popstate', check);
    const t = setInterval(check, 1000);
    return () => { window.removeEventListener('popstate', check); window.removeEventListener('message', onMessage); clearInterval(t); };
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F9F7F4' }}>
      <Spinner />
    </div>
  );

  if (!user) {
    if (screen === 'reset') return <ResetPassword onDone={() => setScreen('login')} />;
    if (screen === 'login') return <Login onBack={() => setScreen('landing')} onSwitchToRegister={() => setScreen('register')} />;
    if (screen === 'register') return <Register onBack={() => setScreen('landing')} onSwitchToLogin={() => setScreen('login')} onRegistered={() => { sessionStorage.setItem('justRegistered', 'true'); setJustRegistered(true); }} />;
    return <Landing onRegister={() => setScreen('register')} onLogin={() => setScreen('login')} />;
  }

  if (showPaymentSuccess) return <PaymentSuccess onContinue={() => { setShowPaymentSuccess(false); setTab('programs'); }} />;
  if (!user.emailVerified && justRegistered) return <VerifyCode user={user} setUser={u => { sessionStorage.removeItem('justRegistered'); setUser(u); }} logout={logout} />;

  return (
    <div style={{ fontFamily: serif, background: W, width: '100%', minHeight: '100vh', paddingBottom: 80, color: '#1A1A1A' }}>
      {/* ХЕДЕР */}
      <div style={{ background: G, padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ color: W, fontSize: 20, fontWeight: 600, letterSpacing: 3, fontFamily: serif }}>V ФОРМЕ</div>
        <div style={{ background: GOLD, color: W, fontSize: 13, fontWeight: 700, borderRadius: 30, padding: '7px 16px', letterSpacing: 1, fontFamily: sans }}>
          {user.name || 'Привет 👋'}
        </div>
      </div>

      {/* ПЛАШКА TELEGRAM */}
      {!user.telegramId && !user.telegramBonusGiven && (
        <div onClick={async () => {
          try {
            const res = await fetch('/api/telegram/link-token', { method: 'POST', headers: { 'Authorization': 'Bearer ' + localStorage.getItem('vforme_token') } });
            const data = await res.json();
            if (data.url) {
              window.open(data.url, '_blank');
              let attempts = 0;
              const poll = setInterval(async () => {
                attempts++;
                try {
                  const me = await fetch('/api/auth/me', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('vforme_token') } });
                  const u = await me.json();
                  if (u.telegramId) { setUser(u); clearInterval(poll); }
                } catch(e) {}
                if (attempts >= 30) clearInterval(poll);
              }, 2000);
            }
          } catch(e) {}
        }} style={{ background: '#1a8cff', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
          <span style={{ fontSize: 24 }}>✈️</span>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 700, fontFamily: sans }}>Подключи Telegram</div>
            <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontFamily: sans }}>Получи +100 баллов и уведомления</div>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 20 }}>›</span>
        </div>
      )}

      {/* КОНТЕНТ */}
      {tab === 'programs'  && <Programs flash={flash} user={user} onAccessGranted={(programId) => setUser(u => ({ ...u, programAccess: [...(u.programAccess || []), programId] }))} />}
      {tab === 'materials' && <Materials flash={flash} user={user} />}
      {tab === 'chat'      && <Chat />}
      {tab === 'tracker'   && <Tracker flash={flash} />}
      {tab === 'cabinet'   && <Cabinet />}

      {/* НАВБАР */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: W, borderTop: '1px solid ' + BD, display: 'flex', zIndex: 100, maxWidth: 480, margin: '0 auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => { analytics.tabSwitch(t.id); log.tabSwitch(t.id); setTab(t.id); }}
            style={{ flex: 1, padding: '10px 0 8px', background: 'none', border: 'none', color: tab === t.id ? G : INK3, cursor: 'pointer', fontSize: 11, fontFamily: sans, fontWeight: tab === t.id ? 700 : 400, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <Toast message={toast} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
