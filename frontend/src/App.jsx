import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { auth as authApi } from './api';
import { useWebSocket } from './hooks/useWebSocket';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Programs from './pages/Programs';
// import Supplements from './pages/Supplements'; // unused
import Recipes from './pages/Recipes';
import Tracker from './pages/Tracker';
import Cabinet from './pages/Cabinet';
import Protocols from './pages/Protocols';
import ResetPassword from './pages/ResetPassword';
import VerifyCode from './pages/VerifyCode';
import PaymentSuccess from './pages/PaymentSuccess';
// import Materials from './pages/Materials'; // unused
import Chat from './pages/Chat';
import Subscription from './pages/Subscription';
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
  const f = { fill: 'currentColor' };
  switch (name) {
    case 'atlas': // карта — человек
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M14.5 4.5C14.5 5.88071 13.3807 7 12 7C10.6193 7 9.49999 5.88071 9.49999 4.5C9.49999 3.11929 10.6193 2 12 2C13.3807 2 14.5 3.11929 14.5 4.5Z" {...f}/><path d="M4.02928 7.75975C4.16196 7.22364 4.70413 6.8966 5.24024 7.02929C7.90135 7.6879 9.93431 8.00126 11.9569 8C13.9811 7.99873 16.044 7.68236 18.7662 7.02772C19.3031 6.89858 19.8431 7.2292 19.9723 7.76618C20.1014 8.30315 19.7708 8.84314 19.2338 8.97228C17.6809 9.34574 16.3025 9.62064 15 9.79168V13.9643L15.4974 20.9288C15.5368 21.4796 15.1221 21.9581 14.5712 21.9975C14.0204 22.0368 13.5419 21.6221 13.5025 21.0712L13.1403 16H10.8597L10.4974 21.0712C10.4581 21.6221 9.97962 22.0368 9.42874 21.9975C8.87786 21.9581 8.46318 21.4796 8.50253 20.9288L8.99999 13.9643V9.80345C7.68963 9.63358 6.31102 9.35465 4.75974 8.97071C4.22363 8.83803 3.89659 8.29586 4.02928 7.75975Z" {...f}/></svg>;
    case 'recipes': // кастрюля
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M12.5021 4.95232L12.9263 4.33384L11.6894 3.48535L11.2651 4.10383C10.6028 5.0694 10.4861 5.98515 10.6186 6.74603C10.7464 7.48011 11.0966 8.01445 11.267 8.26047L11.2702 8.26521C11.4239 8.48717 11.5905 8.72772 11.6511 9.06918C11.7077 9.38862 11.6841 9.88838 11.2427 10.6145L10.8531 11.2554L12.1349 12.0345L12.5245 11.3936C13.1287 10.3996 13.2568 9.53333 13.128 8.80716C13.0092 8.13771 12.6813 7.66675 12.522 7.438L12.5002 7.40662C12.367 7.21417 12.1675 6.89709 12.0964 6.48871C12.0299 6.10714 12.0651 5.58939 12.5021 4.95232Z" {...f}/><path d="M4.07367 14.0024V14.0039H3C2.44772 14.0039 2 14.4516 2 15.0039C2 15.5562 2.44772 16.0039 3 16.0039H4.07367C4.07578 18.7635 6.31355 21 9.07367 21H15C17.7601 21 19.9979 18.7635 20 16.0039H21C21.5523 16.0039 22 15.5562 22 15.0039C22 14.4516 21.5523 14.0039 21 14.0039H20V14.0024H4.07367Z" {...f}/><path d="M8.13546 5.89048L7.71122 6.50896C7.40635 6.95341 7.38946 7.29888 7.43199 7.54315C7.4792 7.81422 7.61261 8.02897 7.70937 8.16872L7.72678 8.19375C7.84944 8.36971 8.11825 8.75536 8.21554 9.30374C8.32208 9.90425 8.21219 10.6063 7.73363 11.3936L7.34408 12.0345L6.06229 11.2554L6.45185 10.6145C6.76756 10.0951 6.77298 9.75953 6.7386 9.56577C6.69989 9.34755 6.59421 9.19316 6.47611 9.02258C6.34226 8.82925 6.05814 8.39723 5.95423 7.80047C5.84565 7.17689 5.94406 6.43343 6.47426 5.66047L6.8985 5.04199L8.13546 5.89048Z" {...f}/><path d="M17.2878 6.50896L17.712 5.89048L16.475 5.04199L16.0508 5.66047C15.5206 6.43343 15.4222 7.17689 15.5308 7.80047C15.6347 8.39723 15.9188 8.82925 16.0527 9.02258C16.1708 9.19316 16.2764 9.34755 16.3151 9.56577C16.3495 9.75953 16.3441 10.0951 16.0284 10.6145L15.6388 11.2554L16.9206 12.0345L17.3102 11.3936C17.7887 10.6063 17.8986 9.90425 17.7921 9.30374C17.6948 8.75536 17.426 8.36971 17.3033 8.19375L17.2859 8.16872C17.1892 8.02897 17.0557 7.81422 17.0085 7.54315C16.966 7.29888 16.9829 6.95341 17.2878 6.50896Z" {...f}/></svg>;
    case 'health': // книга — программы
      return <svg width={size} height={size} viewBox="0 0 48 48" fill="none"><path d="M36.9896 29.0025C33.3205 28.9646 31.2731 29.3354 27.378 30.9258L26.622 29.0742C30.7491 27.389 33.0599 26.9618 37.0103 27.0027L36.9896 29.0025Z" {...f}/><path d="M27.378 26.9258C31.2731 25.3354 33.3205 24.9646 36.9896 25.0025L37.0103 23.0027C33.0599 22.9618 30.7491 23.389 26.622 25.0742L27.378 26.9258Z" {...f}/><path d="M36.9896 21.0025C33.3205 20.9646 31.2731 21.3354 27.378 22.9258L26.622 21.0742C30.7491 19.389 33.0599 18.9618 37.0103 19.0027L36.9896 21.0025Z" {...f}/><path d="M34.5 16V13H36.5V16H34.5Z" {...f}/><path d="M31 14V17H33V14H31Z" {...f}/><path d="M27.5 18V15H29.5V18H27.5Z" {...f}/><path d="M11.0104 29.0025C14.6795 28.9646 16.7269 29.3354 20.622 30.9258L21.378 29.0742C17.2509 27.389 14.9401 26.9618 10.9896 27.0027L11.0104 29.0025Z" {...f}/><path d="M20.622 26.9258C16.7269 25.3354 14.6795 24.9646 11.0104 25.0025L10.9896 23.0027C14.9401 22.9618 17.2509 23.389 21.378 25.0742L20.622 26.9258Z" {...f}/><path d="M11.0104 21.0025C14.6795 20.9646 16.7269 21.3354 20.622 22.9258L21.378 21.0742C17.2509 19.389 14.9401 18.9618 10.9896 19.0027L11.0104 21.0025Z" {...f}/><path d="M13.5 16V13H11.5V16H13.5Z" {...f}/><path d="M17 14V17H15V14H17Z" {...f}/><path d="M20.5 18V15H18.5V18H20.5Z" {...f}/><path fillRule="evenodd" clipRule="evenodd" d="M42 10.9838C42.4057 11.073 42.8198 11.1686 43.2434 11.2707C43.6888 11.378 44 11.7783 44 12.2365V37.7749C44 38.4077 43.4173 38.8804 42.7957 38.7618C36.5832 37.5766 32.3951 37.4936 26.6742 38.3611C26.1781 39.3339 25.1669 40 24 40C22.8331 40 21.8219 39.3339 21.3258 38.3611C15.6049 37.4936 11.4168 37.5766 5.20425 38.7618C4.58268 38.8804 4 38.4077 4 37.7749V12.2365C4 11.7783 4.31119 11.378 4.75659 11.2707C5.18022 11.1686 5.59433 11.073 6 10.9838V10.524C6 9.63895 6.589 8.83011 7.48401 8.60493C13.6344 7.0576 18.1123 8.69563 23.2406 11.0814C23.4904 11.1326 23.7435 11.1855 24 11.2401C24.2565 11.1855 24.5096 11.1326 24.7594 11.0814C29.8877 8.69563 34.3656 7.0576 40.516 8.60493C41.411 8.83011 42 9.63895 42 10.524V10.9838ZM40 33.9681L40 33.967V10.5375C34.3416 9.12233 30.3169 10.6723 25 13.1762V36.4187L25.0028 36.4209C25.0034 36.4213 25.0041 36.4217 25.0047 36.4221C25.009 36.4244 25.0125 36.4251 25.0139 36.4252L25.015 36.4252L25.0173 36.4246C25.0186 36.4242 25.0204 36.4236 25.0227 36.4225C29.9319 34.2006 34.2143 32.9404 39.9457 33.9865C39.9564 33.9884 39.9645 33.9877 39.9714 33.9859C39.9795 33.9838 39.9871 33.9798 39.9932 33.9749C39.997 33.9719 39.999 33.9694 40 33.9681ZM22.9972 36.4209L23 36.4189V13.1772C17.6831 10.6732 13.6584 9.12233 8 10.5375V33.967L8.00001 33.9681C8.00095 33.9694 8.003 33.9719 8.00678 33.9749C8.01286 33.9798 8.02054 33.9838 8.02856 33.9859C8.03554 33.9877 8.04358 33.9884 8.05429 33.9865C13.7857 32.9404 18.0681 34.2006 22.9773 36.4225C22.9823 36.4248 22.9847 36.4252 22.985 36.4252L22.9861 36.4252C22.9877 36.4251 22.9921 36.4242 22.9972 36.4209Z" {...f}/></svg>;
    case 'chat': // пузырь
      return <svg width={size} height={size} viewBox="0 0 48 48" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M18.5 6C10.4919 6 4 12.4919 4 20.5C4 38.5 28 42 28 42V35H29.5C37.5081 35 44 28.5081 44 20.5C44 12.4919 37.5081 6 29.5 6H18.5ZM24 23.5C25.3807 23.5 26.5 22.3807 26.5 21C26.5 19.6193 25.3807 18.5 24 18.5C22.6193 18.5 21.5 19.6193 21.5 21C21.5 22.3807 22.6193 23.5 24 23.5ZM34.5 21C34.5 22.3807 33.3807 23.5 32 23.5C30.6193 23.5 29.5 22.3807 29.5 21C29.5 19.6193 30.6193 18.5 32 18.5C33.3807 18.5 34.5 19.6193 34.5 21ZM16 23.5C17.3807 23.5 18.5 22.3807 18.5 21C18.5 19.6193 17.3807 18.5 16 18.5C14.6193 18.5 13.5 19.6193 13.5 21C13.5 22.3807 14.6193 23.5 16 23.5Z" {...f}/></svg>;
    case 'tracker': // галочка в круге
      return <svg width={size} height={size} viewBox="0 0 48 48" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44ZM34.7415 17.6709C35.1121 17.2614 35.0805 16.629 34.6709 16.2585C34.2614 15.8879 33.629 15.9195 33.2585 16.3291L21.2809 29.5675L14.6905 23.2766C14.291 22.8953 13.658 22.91 13.2766 23.3095C12.8953 23.709 12.91 24.342 13.3095 24.7234L20.6429 31.7234L21.3858 32.4325L22.0749 31.6709L34.7415 17.6709Z" {...f}/></svg>;
    case 'cabinet': // аккаунт
      return <svg width={size} height={size} viewBox="0 0 48 48" fill="none"><path d="M6 36C6 31.0347 17.9925 28 24 28C30.0075 28 42 31.0347 42 36V42H6V36Z" {...f}/><path fillRule="evenodd" clipRule="evenodd" d="M24 26C29.5228 26 34 21.5228 34 16C34 10.4772 29.5228 6 24 6C18.4772 6 14 10.4772 14 16C14 21.5228 18.4772 26 24 26Z" {...f}/></svg>;
    default: return null;
  }
};

const TABS = [
  { id: 'atlas',   icon: 'atlas',   label: 'Карта' },
  { id: 'recipes', icon: 'recipes', label: 'Рецепты' },
  { id: 'health',  icon: 'health',  label: 'Программы' },
  { id: 'chat',    icon: 'chat',    label: 'Чат' },
  { id: 'tracker', icon: 'tracker', label: 'Трекер' },
];

function AppShell() {
  const { user, loading, setUser, logout } = useAuth();
  const [screen, setScreen] = useState('landing');
  const [tab, setTab] = useState('atlas');
  const [toast, setToast] = useState(null);
  const [showSubscription, setShowSubscription] = useState(false);
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

  // Открытие подписки из любого места
  useEffect(() => {
    const h = () => setShowSubscription(true);
    window.addEventListener('vforme:open-subscription', h);
    return () => window.removeEventListener('vforme:open-subscription', h);
  }, []);

  // Слушаем запрос на открытие продукта из чата → переключаемся на вкладку Здоровье
  useEffect(() => {
    const handler = () => setTab('health');
    window.addEventListener('vforme:open-health-product', handler);
    return () => window.removeEventListener('vforme:open-health-product', handler);
  }, []);

  // Переключение таба из любого компонента
  useEffect(() => {
    const h = (e) => setTab(e.detail);
    window.addEventListener('vforme:switch-tab', h);
    return () => window.removeEventListener('vforme:switch-tab', h);
  }, []);

  // Live-обновления через WebSocket
  useWebSocket((msg) => {
    if (!msg || !msg.type) return;
    if (msg.type === 'telegram_linked') {
      authApi.me().then(u => { if (u) setUser(u); }).catch(e => console.error(e));
      flash(msg.bonusGiven ? '✈️ Telegram подключён! +100 баллов' : '✈️ Telegram подключён');
      return;
    }
    if (msg.type === 'telegram_unlinked') {
      authApi.me().then(u => { if (u) setUser(u); }).catch(e => console.error(e));
      flash('Telegram отключён');
      return;
    }
    if (msg.type === 'max_linked') {
      authApi.me().then(u => { if (u) setUser(u); }).catch(e => console.error(e));
      flash(msg.bonusGiven ? 'MAX подключён! +100 баллов' : 'MAX подключён');
      return;
    }
    if (msg.type === 'max_unlinked') {
      authApi.me().then(u => { if (u) setUser(u); }).catch(e => console.error(e));
      flash('MAX отключён');
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
    const TRUSTED_ORIGINS = ['https://widget.prodamus.ru', 'https://nutrikris.payform.ru', window.location.origin];
    const onMessage = (e) => {
      if (!TRUSTED_ORIGINS.includes(e.origin)) return;
      try {
        const d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (d && (d.payment_status === 'success' || d.status === 'success' || d.type === 'payment_success')) {
          setShowPaymentSuccess(true);
        }
      } catch {}
    };
    window.addEventListener('message', onMessage);
    window.addEventListener('popstate', check);
    const t = setInterval(check, 2000);
    const killTimer = setTimeout(() => clearInterval(t), 15000); // stop polling after 15s
    return () => { window.removeEventListener('popstate', check); window.removeEventListener('message', onMessage); clearInterval(t); clearTimeout(killTimer); };
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
    <div style={{ fontFamily: serif, background: W, width: '100%', minHeight: '100vh', paddingBottom: 'calc(78px + env(safe-area-inset-bottom))', color: '#1A1A1A' }}>
      {/* ХЕДЕР */}
      <div style={{ background: G, padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ color: W, fontSize: 20, fontWeight: 600, letterSpacing: 3, fontFamily: serif }}>V ФОРМЕ</div>
        <div onClick={() => setTab('cabinet')} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          {user.subscription?.plan === 'club' && (
            <div style={{ background: GOLD, width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(196,162,107,0.4)' }}>
              <span style={{ color: W, fontSize: 14, fontWeight: 700 }}>V</span>
            </div>
          )}
          <div style={{ background: GOLD, color: W, fontSize: 13, fontWeight: 700, borderRadius: 30, padding: '7px 16px', letterSpacing: 0.5, fontFamily: sans }}>
            Личный кабинет
          </div>
        </div>
      </div>

      {/* ПЛАШКА: подключи мессенджер */}
      {!user.telegramId && !user.maxId && (
        <div onClick={() => setTab('cabinet')} style={{ background: '#3478F6', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <div style={{ flex: 1, color: W, fontSize: 14, fontWeight: 600, fontFamily: sans }}>
            Подключи Telegram или MAX
          </div>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18 }}>›</span>
        </div>
      )}

      {/* ПОДПИСКА — fullscreen overlay */}
      {showSubscription && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200, background: '#F9F7F4', overflow: 'auto', maxWidth: 480, margin: '0 auto' }}>
          <Subscription onClose={() => setShowSubscription(false)} />
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
      <div className="vf-navbar" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderTop: '0.5px solid rgba(60,60,67,0.18)',
        display: 'flex',
        justifyContent: 'space-around',
        zIndex: 100,
        maxWidth: 480, margin: '0 auto',
        padding: '10px 4px 10px',
        paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
      }}>
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => { analytics.tabSwitch(t.id); log.tabSwitch(t.id); setTab(t.id); }}
              style={{
                flex: 1, padding: 0,
                background: 'none', border: 'none',
                color: active ? G : '#8E8E93',
                cursor: 'pointer',
                fontSize: 10, fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
                fontWeight: active ? 600 : 400,
                letterSpacing: 0.2,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                transition: 'color .18s ease',
                minWidth: 0,
              }}>
              <TabIcon name={t.icon} size={30} />
              <span style={{ lineHeight: 1 }}>{t.label}</span>
            </button>
          );
        })}
      </div>
      <style>{`.vf-navbar { padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px)) !important; }`}</style>

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
