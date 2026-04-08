import { useState, useEffect } from 'react';
import { auth as authApi } from './api';
import Login from './pages/Login';
import Clients from './pages/Clients';
import Programs from './pages/Programs';
import Recipes from './pages/Recipes';
import Supplements from './pages/Supplements';
import Promos from './pages/Promos';
import Stats from './pages/Stats';
import Protocols from './pages/Protocols';
import Broadcast from './pages/Broadcast';
import ChatAdmin from './pages/ChatAdmin';
import Deploy from './pages/Deploy';
import Payments from './pages/Payments';
import { C, Toast } from './components/UI';

const NAV = [
  { id: 'clients',     icon: '👥', label: 'Клиенты' },
  { id: 'programs',    icon: '📚', label: 'Программы' },
  { id: 'recipes',     icon: '🥗', label: 'Рецепты' },
  { id: 'supplements', icon: '💊', label: 'БАДы' },
  { id: 'promos', icon: '🎟', label: 'Промокоды' },
  { id: 'protocols', icon: '📋', label: 'Протоколы' },
  { id: 'broadcast', icon: '📤', label: 'Рассылка' },
  { id: 'chat', icon: '💬', label: 'Чат' },
  { id: 'payments', icon: '💳', label: 'Платежи' },
  { id: 'deploy', icon: '🚀', label: 'Деплой' },
  { id: 'stats', icon: '📊', label: 'Статистика' },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('clients');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('vforme_admin_token');
    if (token) {
      authApi.me()
        .then(u => {
          if (['admin', 'superadmin'].includes(u.role)) setUser(u);
          else localStorage.removeItem('vforme_admin_token');
        })
        .catch(() => localStorage.removeItem('vforme_admin_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const flash = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const logout = () => {
    localStorage.removeItem('vforme_admin_token');
    setUser(null);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#fff', fontSize: 16 }}>Загрузка...</div>
    </div>
  );

  if (!user) return <Login onLogin={setUser} />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: 'Arial, sans-serif' }}>
      {/* SIDEBAR */}
      <div style={{ width: 240, background: C.green, display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0 }}>
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: 2 }}>V ФОРМЕ</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Панель управления</div>
        </div>

        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {NAV.map(item => (
            <button key={item.id} onClick={() => setTab(item.id)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, border: 'none', background: tab === item.id ? 'rgba(255,255,255,0.15)' : 'transparent', color: tab === item.id ? '#fff' : 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 14, fontWeight: tab === item.id ? 700 : 400, marginBottom: 4, textAlign: 'left', transition: 'all .15s' }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ padding: '10px 14px', marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{user.name || user.email}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{user.role}</div>
          </div>
          <button onClick={logout}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 13, textAlign: 'left' }}>
            Выйти
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, marginLeft: 240, padding: 32, minHeight: '100vh' }}>
        {tab === 'clients'     && <Clients flash={flash} />}
        {tab === 'programs'    && <Programs flash={flash} />}
        {tab === 'recipes'     && <Recipes flash={flash} />}
        {tab === 'supplements' && <Supplements flash={flash} />}
        {tab === 'promos'        && <Promos flash={flash} />}
        {tab === 'protocols'     && <Protocols flash={flash} />}
        {tab === 'broadcast'     && <Broadcast flash={flash} />}
        {tab === 'chat'           && <ChatAdmin flash={flash} />}
        {tab === 'payments'      && <Payments />}
        {tab === 'deploy'         && <Deploy flash={flash} />}
        {tab === 'stats'         && <Stats />}
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </div>
  );
}
