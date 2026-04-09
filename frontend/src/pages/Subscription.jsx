import { useState, useEffect } from 'react';
import { subscription as subApi } from '../api';
import { useAuth } from '../hooks/useAuth';
import { G, GL, GLL, GOLD, GOLDD, BD, INK, INK2, INK3, OW, W, sans, serif } from '../utils/theme';

export default function Subscription({ onClose }) {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [subData, setSubData] = useState(null);

  const plan = user?.subscription?.plan || 'free';
  const isClub = plan === 'club';
  const freePicks = user?.freePicks || [];

  useEffect(() => { subApi.get().then(setSubData).catch(console.error); }, []);

  async function handleSubscribe() {
    setLoading(true);
    try {
      const r = await subApi.subscribe();
      if (r?.payUrl && typeof window.payformWidget === 'function') window.payformWidget(r.payUrl);
      else if (r?.payUrl) window.location.href = r.payUrl;
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
    <div style={{ background: '#F9F7F4', minHeight: '100dvh', paddingBottom: 100 }}>

      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg, ${G} 0%, #3D6B3D 100%)`, padding: '40px 24px 48px', borderRadius: '0 0 32px 32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        {onClose && (
          <button onClick={onClose} style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10, padding: '8px 14px', color: W, fontFamily: sans, fontSize: 14, cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
            Назад
          </button>
        )}
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, paddingTop: onClose ? 24 : 0 }}>
          <div style={{ fontFamily: serif, fontSize: 28, fontWeight: 700, color: W, marginBottom: 8 }}>
            Клуб V Форме
          </div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', fontFamily: sans, lineHeight: 1.5, maxWidth: 320, margin: '0 auto' }}>
            Персональный нутрициолог в кармане.{'\n'}Все знания Кристины — в одном месте.
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px', marginTop: -24, position: 'relative', zIndex: 2 }}>

        {/* Features */}
        <div style={{ background: W, borderRadius: 22, padding: '24px 20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', marginBottom: 16 }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <span style={{ fontFamily: serif, fontSize: 36, fontWeight: 700, color: GOLD }}>399</span>
            <span style={{ fontSize: 16, color: INK2, fontFamily: sans }}> руб/мес</span>
          </div>

          <div style={{ fontSize: 11, color: INK3, letterSpacing: 1.5, fontWeight: 700, marginBottom: 14, fontFamily: sans, textAlign: 'center' }}>
            ЧТО ВХОДИТ В КЛУБ
          </div>

          {[
            { text: 'Все протоколы здоровья', sub: 'Без ограничений по количеству' },
            { text: 'Все схемы БАДов', sub: 'Персональные рекомендации' },
            { text: 'Все лекции Кристины', sub: 'Аудио + расшифровка' },
            { text: 'Безлимитный AI-чат', sub: 'Вопросы 24/7, персональные ответы' },
            { text: 'Чек-лист добавок', sub: 'Создай удобный список из БАДов' },
            { text: 'Рецепты под твоё питание', sub: 'Подбор рецептов специально для тебя' },
            { text: 'Скидка 10% на программы', sub: 'На все платные курсы' },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0', borderBottom: i < 6 ? '1px solid ' + BD : 'none' }}>
              <div style={{ width: 24, height: 24, borderRadius: 7, background: GLL, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <span style={{ color: G, fontSize: 12, fontWeight: 700 }}>+</span>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: INK, fontFamily: sans }}>{f.text}</div>
                <div style={{ fontSize: 12, color: INK3, fontFamily: sans, marginTop: 2 }}>{f.sub}</div>
              </div>
            </div>
          ))}

          {!isClub ? (
            <button onClick={handleSubscribe} disabled={loading}
              style={{
                width: '100%', marginTop: 20, padding: '18px',
                background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLDD} 100%)`,
                border: 'none', borderRadius: 16, color: W,
                fontFamily: sans, fontWeight: 700, fontSize: 17,
                cursor: 'pointer', opacity: loading ? 0.6 : 1,
                boxShadow: '0 4px 16px rgba(196, 162, 107, 0.4)',
                letterSpacing: 0.5,
              }}>
              {loading ? 'Загрузка...' : 'Присоединиться к Клубу'}
            </button>
          ) : (
            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <div style={{ display: 'inline-block', padding: '10px 20px', background: GLL, borderRadius: 12, marginBottom: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: G, fontFamily: sans }}>Ты в Клубе</span>
              </div>
              {endDate && <div style={{ fontSize: 13, color: INK2, fontFamily: sans }}>Следующее продление: {endDate}</div>}
              <button onClick={handleCancel}
                style={{ marginTop: 12, padding: '10px 20px', background: 'transparent', border: '1px solid ' + BD, borderRadius: 10, color: INK3, fontFamily: sans, fontSize: 13, cursor: 'pointer' }}>
                Отменить подписку
              </button>
            </div>
          )}
        </div>

        {/* Free plan */}
        <div style={{ background: OW, borderRadius: 18, padding: '18px 20px', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: INK3, fontFamily: sans, marginBottom: 12, letterSpacing: 1 }}>
            БЕСПЛАТНЫЙ ДОСТУП
          </div>
          {[
            '3 продукта на выбор',
            'Все рецепты с КБЖУ',
            'Трекер привычек',
            'Атлас здоровья',
            '10 сообщений в чате / день',
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
              <span style={{ color: INK3, fontSize: 12 }}>--</span>
              <span style={{ fontSize: 13, color: INK2, fontFamily: sans }}>{f}</span>
            </div>
          ))}
          {!isClub && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: W, borderRadius: 10, textAlign: 'center' }}>
              <span style={{ fontSize: 13, color: G, fontFamily: sans, fontWeight: 600 }}>
                Использовано: {freePicks.length}/3 продуктов
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
