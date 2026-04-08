import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { auth as authApi } from './api';
import { useWebSocket } from './hooks/useWebSocket';
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
import Playground from './pages/Playground';
import Atlas from './pages/Atlas';
import Health from './pages/Health';
import { analytics } from './utils/analytics';
import { log } from './utils/log';
import { Toast, Spinner } from './components/UI';
import { G, GOLD, BD, INK3, W, sans, serif } from './utils/theme';

// Минималистичные line-иконки. stroke берётся из currentColor — цвет
// меняется при активном табе через свойство color у родительского button.
const TabIcon = ({ name, size = 22 }) => {
  const props = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor',
    strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  switch (name) {
    case 'atlas': // лист
      return <svg {...props}><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19.5 2c0 7-1.07 12.7-7 16.45-2.4 1.5-5 1.55-5 1.55Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/></svg>;
    case 'health': // плюс в круге
      return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>;
    case 'recipes': // тарелка с приборами
      return <svg {...props}><path d="M3 11h18"/><path d="M12 11v10"/><path d="M5 11a7 7 0 0 1 14 0"/></svg>;
    case 'chat': // пузырь
      return <svg {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
    case 'tracker': // галочка в круге
      return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/></svg>;
    case 'cabinet': // человек
      return <svg {...props}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>;
    default: return null;
  }
};

const TABS = [
  { id: 'atlas',   icon: 'atlas',   label: 'Атлас' },
  { id: 'health',  icon: 'health',  label: 'Здоровье' },
  { id: 'recipes', icon: 'recipes', label: 'Рецепты' },
  { id: 'chat',    icon: 'chat',    label: 'Чат' },
  { id: 'tracker', icon: 'tracker', label: 'Трекер' },
  { id: 'cabinet', icon: 'cabinet', label: 'Кабинет' },
];

function AppShell() {
  const { user, loading, setUser, logout } = useAuth();
  const [screen, setScreen] = useState('landing');
  const [tab, setTab] = useState('atlas');
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

  // Слушаем запрос на открытие продукта из чата → переключаемся на вкладку Здоровье
  useEffect(() => {
    const handler = () => setTab('health');
    window.addEventListener('vforme:open-health-product', handler);
    return () => window.removeEventListener('vforme:open-health-product', handler);
  }, []);

  // Live-обновления через WebSocket
  useWebSocket((msg) => {
    if (!msg || !msg.type) return;
    if (msg.type === 'telegram_linked') {
      authApi.me().then(u => { if (u) setUser(u); }).catch(() => {});
      flash(msg.bonusGiven ? '✈️ Telegram подключён! +100 баллов' : '✈️ Telegram подключён');
      return;
    }
    if (msg.type === 'telegram_unlinked') {
      authApi.me().then(u => { if (u) setUser(u); }).catch(() => {});
      flash('✈️ Telegram отключён');
      return;
    }
    if (msg.type === 'data_updated') {
      window.dispatchEvent(new CustomEvent('vforme:data_updated', { detail: msg }));
      return;
    }
    if (msg.type === 'chat_message') {
      window.dispatchEvent(new CustomEvent('vforme:chat_message', { detail: msg }));
      return;
    }
  });

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
      {tab === 'atlas'   && <Atlas onGoChat={() => setTab('chat')} />}
      {tab === 'health'  && <Health />}
      {tab === 'recipes' && <Recipes flash={flash} user={user} />}
      {tab === 'chat'    && <Chat />}
      {tab === 'tracker' && <Tracker flash={flash} />}
      {tab === 'cabinet' && <Cabinet />}

      {/* НАВБАР */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: W, borderTop: '1px solid ' + BD, display: 'flex', zIndex: 100, maxWidth: 480, margin: '0 auto' }}>
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => { analytics.tabSwitch(t.id); log.tabSwitch(t.id); setTab(t.id); }}
              style={{
                flex: 1, padding: '8px 0 6px', background: 'none', border: 'none',
                color: active ? G : '#9A958A',
                cursor: 'pointer', fontSize: 9, fontFamily: sans,
                fontWeight: active ? 700 : 500, letterSpacing: 0.2,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                transition: 'color .15s',
              }}>
              <TabIcon name={t.icon} size={20} />
              {t.label}
            </button>
          );
        })}
      </div>

      <Toast message={toast} />
    </div>
  );
}

export default function App() {
  // Песочница прототипа — доступна без авторизации
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/playground')) {
    return <Playground />;
  }
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
