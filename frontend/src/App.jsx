import { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Programs from './pages/Programs';
import Supplements from './pages/Supplements';
import Recipes from './pages/Recipes';
import Tracker from './pages/Tracker';
import Cabinet from './pages/Cabinet';
import { Toast, Spinner } from './components/UI';
import { G, GOLD, BD, INK3, W, sans, serif } from './utils/theme';

const TABS = [
  { id: 'programs',     icon: '📚', label: 'Программы' },
  { id: 'supplements',  icon: '💊', label: 'БАДы' },
  { id: 'recipes',      icon: '🥗', label: 'Рецепты' },
  { id: 'tracker',      icon: '✦',  label: 'Трекер' },
  { id: 'cabinet',      icon: '◎',  label: 'Кабинет' },
];

function AppShell() {
  const { user, loading } = useAuth();
  const [screen, setScreen] = useState('landing'); // landing | login | register
  const [tab, setTab] = useState('programs');
  const [toast, setToast] = useState(null);

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F9F7F4' }}>
      <Spinner />
    </div>
  );

  // Not authenticated
  if (!user) {
    if (screen === 'login') return <Login onBack={() => setScreen('landing')} onSwitchToRegister={() => setScreen('register')} />;
    if (screen === 'register') return <Register onBack={() => setScreen('landing')} onSwitchToLogin={() => setScreen('login')} />;
    return <Landing onRegister={() => setScreen('register')} onLogin={() => setScreen('login')} />;
  }

  // Authenticated — main app
  return (
    <div style={{ fontFamily: serif, background: W, width: '100%', minHeight: '100vh', paddingBottom: 80, color: '#1A1A1A' }}>
      <div style={{ background: G, padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ color: W, fontSize: 20, fontWeight: 600, letterSpacing: 3, fontFamily: serif }}>V ФОРМЕ</div>
        <div style={{ background: GOLD, color: W, fontSize: 13, fontWeight: 700, borderRadius: 30, padding: '7px 16px', letterSpacing: 1, fontFamily: sans }}>
          {user.name || 'Привет 👋'}
        </div>
      </div>

      {tab === 'programs'    && <Programs flash={flash} />}
      {tab === 'supplements' && <Supplements />}
      {tab === 'recipes'     && <Recipes user={user} flash={flash} />}
      {tab === 'tracker'     && <Tracker flash={flash} />}
      {tab === 'cabinet'     && <Cabinet />}

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: W, borderTop: '1px solid ' + BD, display: 'flex', zIndex: 100, maxWidth: 480, margin: '0 auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
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
