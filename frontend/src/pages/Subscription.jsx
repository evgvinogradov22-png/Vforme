import { useState, useEffect } from 'react';
import { subscription as subApi } from '../api';
import { useAuth } from '../hooks/useAuth';
import { G, GL, GLL, GOLD, BD, INK, INK2, INK3, OW, W, sans, serif } from '../utils/theme';

const FEATURES_FREE = [
  '3 продукта на выбор',
  'Все рецепты',
  'Трекер привычек',
  'Атлас здоровья',
  '10 сообщений/день в чате',
];

const FEATURES_CLUB = [
  'Все протоколы и схемы БАД',
  'Все лекции',
  'Безлимитный чат с AI Кристиной',
  'Конструктор схемы добавок',
  'Скидка 10% на программы',
  'Все рецепты и трекер',
];

export default function Subscription({ onClose }) {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [subData, setSubData] = useState(null);

  const plan = user?.subscription?.plan || 'free';
  const isClub = plan === 'club';

  useEffect(() => {
    subApi.get().then(setSubData).catch(console.error);
  }, []);

  async function handleSubscribe() {
    setLoading(true);
    try {
      const r = await subApi.subscribe();
      if (r?.payUrl && typeof window.payformWidget === 'function') {
        window.payformWidget(r.payUrl);
      } else if (r?.payUrl) {
        window.open(r.payUrl, '_blank');
      }
    } catch (e) { alert(e.message); }
    finally { setLoading(false); }
  }

  async function handleCancel() {
    if (!confirm('Отменить подписку? Доступ сохранится до конца оплаченного периода.')) return;
    try {
      const r = await subApi.cancel();
      alert(`Подписка отменена. Доступ до ${new Date(r.activeUntil).toLocaleDateString('ru-RU')}`);
      refreshUser();
    } catch (e) { alert(e.message); }
  }

  const endDate = user?.subscription?.currentPeriodEnd
    ? new Date(user.subscription.currentPeriodEnd).toLocaleDateString('ru-RU')
    : null;

  return (
    <div style={{ padding: '24px 20px 80px' }}>
      <div style={{ fontFamily: serif, fontSize: 28, fontWeight: 600, color: G, marginBottom: 4 }}>Подписка</div>
      <div style={{ fontSize: 13, color: INK3, fontFamily: sans, marginBottom: 24 }}>Выбери свой тариф</div>

      {/* Free card */}
      <div style={{
        border: '1px solid ' + (isClub ? BD : G),
        borderRadius: 18, padding: 20, marginBottom: 14,
        background: isClub ? W : GLL,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontFamily: serif, fontSize: 20, fontWeight: 700, color: G }}>Бесплатно</div>
          {!isClub && <div style={{ fontSize: 11, fontWeight: 700, color: G, background: G + '22', padding: '4px 10px', borderRadius: 8 }}>Текущий</div>}
        </div>
        {FEATURES_FREE.map((f, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <span style={{ color: G, fontSize: 14 }}>✓</span>
            <span style={{ fontSize: 14, color: INK, fontFamily: sans }}>{f}</span>
          </div>
        ))}
      </div>

      {/* Club card */}
      <div style={{
        border: '2px solid ' + GOLD,
        borderRadius: 18, padding: 20, marginBottom: 20,
        background: isClub ? '#FBF5EB' : W,
        position: 'relative',
      }}>
        {isClub && <div style={{ position: 'absolute', top: -10, right: 16, fontSize: 11, fontWeight: 700, color: W, background: GOLD, padding: '4px 12px', borderRadius: 8 }}>Активна</div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <div style={{ fontFamily: serif, fontSize: 20, fontWeight: 700, color: GOLD }}>Клуб V Форме</div>
          <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 700, color: GOLD }}>399 ₽<span style={{ fontSize: 13, fontWeight: 500, color: INK3 }}>/мес</span></div>
        </div>
        {FEATURES_CLUB.map((f, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <span style={{ color: GOLD, fontSize: 14 }}>★</span>
            <span style={{ fontSize: 14, color: INK, fontFamily: sans }}>{f}</span>
          </div>
        ))}

        {!isClub ? (
          <button onClick={handleSubscribe} disabled={loading}
            style={{ width: '100%', marginTop: 16, padding: 16, background: GOLD, border: 'none', borderRadius: 14, color: W, fontFamily: sans, fontWeight: 700, fontSize: 16, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Загрузка…' : 'Оформить подписку'}
          </button>
        ) : (
          <div style={{ marginTop: 16 }}>
            {endDate && <div style={{ fontSize: 13, color: INK2, fontFamily: sans, marginBottom: 10 }}>Следующее продление: {endDate}</div>}
            <button onClick={handleCancel}
              style={{ width: '100%', padding: 12, background: 'transparent', border: '1px solid ' + BD, borderRadius: 12, color: INK3, fontFamily: sans, fontSize: 13, cursor: 'pointer' }}>
              Отменить подписку
            </button>
          </div>
        )}
      </div>

      {/* Free picks info */}
      {!isClub && subData && (
        <div style={{ background: OW, borderRadius: 14, padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: INK2, fontFamily: sans }}>
            Бесплатных продуктов: <b>{subData.freePicksCount}/{subData.freePicksMax}</b>
          </div>
          <div style={{ fontSize: 12, color: INK3, fontFamily: sans, marginTop: 4 }}>
            Выбирай в разделе «Программы»
          </div>
        </div>
      )}

      {onClose && (
        <button onClick={onClose}
          style={{ width: '100%', marginTop: 16, padding: 14, background: OW, border: '1px solid ' + BD, borderRadius: 14, color: INK2, fontFamily: sans, fontSize: 14, cursor: 'pointer' }}>
          Назад
        </button>
      )}
    </div>
  );
}
