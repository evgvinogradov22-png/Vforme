import { useState, useEffect } from 'react';
import { profile as profileApi, points as pointsApi } from '../api';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from '../components/UI';
import { G, GL, GLL, GOLD, GOLDD, BD, INK, INK2, INK3, OW, W, RED, REDBG, sans, serif } from '../utils/theme';

function ScoreBadge({ label, value }) {
  if (value === undefined || value === null) return null;
  const pct = (value / 10) * 100;
  const color = pct < 30 ? RED : pct < 60 ? GOLD : G;
  return (
    <div style={{ border: '1px solid ' + BD, borderRadius: 14, padding: '14px 16px', marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 14, color: INK2, fontFamily: sans }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: serif }}>{value}<span style={{ fontSize: 13, color: INK3 }}>/10</span></div>
      </div>
      <div style={{ height: 4, background: BD, borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct + '%', background: color, borderRadius: 4 }} />
      </div>
    </div>
  );
}

export default function Cabinet() {
  const { user, logout, refreshUser } = useAuth();
  const [answers, setAnswers] = useState({});
  const [totalPoints, setTotalPoints] = useState(0);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tgLoading, setTgLoading] = useState(false);
  const [maxLoading, setMaxLoading] = useState(false);
  const [maxCode, setMaxCode] = useState(null);

  const unlinkTelegram = async () => {
    if (!confirm('Отключить Telegram от аккаунта?')) return;
    try {
      await fetch('/api/telegram/unlink', { method: 'POST', headers: { 'Authorization': 'Bearer ' + localStorage.getItem('vforme_token') } });
      if (refreshUser) await refreshUser(); else window.location.reload();
    } catch(e) {}
  };

  const connectTelegram = async () => {
    setTgLoading(true);
    try {
      const res = await fetch('/api/telegram/link-token', { method: 'POST', headers: { 'Authorization': 'Bearer ' + localStorage.getItem('vforme_token') } });
      const data = await res.json();
      if (data.url) window.open(data.url, '_blank');
    } catch(e) {}
    setTgLoading(false);
  };

  useEffect(() => {
    Promise.all([profileApi.get(), pointsApi.get()])
      .then(([p, pts]) => {
        if (p?.answers) setAnswers(p.answers);
        setTotalPoints(pts.total || 0);
        setPointsHistory(pts.history || []);
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const a = answers;
  const symptoms = a.priority_symptoms || [];
  const goals = a.main_goals || [];
  const anxiety = a.anxiety || [];

  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{ background: G, padding: '20px 24px 32px', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: GOLD, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
          {a.name ? a.name[0].toUpperCase() : '🌿'}
        </div>
        <div style={{ fontFamily: serif, fontSize: 24, color: W, fontWeight: 600 }}>{a.name || user?.name || 'Участница'}</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 4, fontFamily: sans }}>{user?.email || '—'}</div>
        {a.city && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2, fontFamily: sans }}>📍 {a.city}</div>}

        {/* БАЛЛЫ */}
        <div style={{ marginTop: 20, display: 'inline-block', background: 'rgba(196,162,107,0.2)', border: '1px solid rgba(196,162,107,0.4)', borderRadius: 20, padding: '10px 24px' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: GOLD, fontFamily: serif }}>{totalPoints}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: sans, letterSpacing: 1 }}>БАЛЛОВ</div>
        </div>
      </div>

      <div style={{ padding: '24px 20px' }}>

        {/* ПОДПИСКА */}
        <div onClick={() => window.dispatchEvent(new Event('vforme:open-subscription'))} style={{ margin: '0 0 20px', background: (user?.subscription?.plan === 'club') ? '#FBF5EB' : OW, border: `1px solid ${(user?.subscription?.plan === 'club') ? GOLD : BD}`, borderRadius: 20, padding: '20px', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: INK, fontFamily: sans }}>
                {user?.subscription?.plan === 'club' ? 'Клуб V Форме' : 'Бесплатный план'}
              </div>
              <div style={{ fontSize: 12, color: INK3, marginTop: 2, fontFamily: sans }}>
                {user?.subscription?.plan === 'club'
                  ? `Активна до ${new Date(user.subscription.currentPeriodEnd).toLocaleDateString('ru-RU')}`
                  : `${(user?.freePicks || []).length}/3 бесплатных продукта • Нажми для апгрейда`}
              </div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: user?.subscription?.plan === 'club' ? GOLD : G, fontFamily: sans }}>
              {user?.subscription?.plan === 'club' ? 'Активна' : 'Free →'}
            </div>
          </div>
        </div>

        {/* TELEGRAM */}
      <div style={{ margin: '0 20px 20px', background: user?.telegramId ? '#EBF0EB' : '#F9F7F4', border: `1px solid ${user?.telegramId ? G : BD}`, borderRadius: 20, padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 32 }}>✈️</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: INK }}>
              {user?.telegramId ? 'Telegram подключён' : 'Подключи Telegram'}
            </div>
            <div style={{ fontSize: 13, color: INK2, marginTop: 3, lineHeight: 1.4 }}>
              {user?.telegramId
                ? `@${user.telegramUsername || 'подключён'} — получай уведомления`
                : user?.telegramBonusGiven ? 'Подключи для получения уведомлений' : 'Получи +100 баллов и уведомления'}
            </div>
          </div>
          {user?.telegramId ? (
            <button onClick={unlinkTelegram}
              style={{ padding: '8px 14px', background: 'none', border: '1px solid ' + BD, borderRadius: 20, color: INK3, fontFamily: sans, fontSize: 12, cursor: 'pointer' }}>
              Отключить
            </button>
          ) : (
            <button onClick={connectTelegram} disabled={tgLoading}
              style={{ padding: '10px 18px', background: GOLD, border: 'none', borderRadius: 20, color: W, fontFamily: sans, fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {tgLoading ? '...' : user?.telegramBonusGiven ? 'Подключить' : '+100 💎'}
            </button>
          )}
        </div>
      </div>

      {/* MAX МЕССЕНДЖЕР */}
      <div style={{ margin: '0 20px 20px', background: user?.maxId ? '#EBF0EB' : '#F9F7F4', border: `1px solid ${user?.maxId ? G : BD}`, borderRadius: 20, padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: '#5B6CEA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: W, fontSize: 16, fontWeight: 700, fontFamily: sans }}>M</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: INK }}>
              {user?.maxId ? 'MAX подключён' : 'Подключи MAX'}
            </div>
            <div style={{ fontSize: 13, color: INK2, marginTop: 3, lineHeight: 1.4 }}>
              {user?.maxId
                ? `${user.maxUsername ? '@' + user.maxUsername : 'подключён'} — получай уведомления`
                : user?.maxBonusGiven ? 'Подключи для уведомлений' : 'Получи +100 баллов'}
            </div>
          </div>
          {user?.maxId ? (
            <button onClick={async () => {
              if (!confirm('Отключить MAX от аккаунта?')) return;
              try {
                await fetch('/api/max/unlink', { method: 'POST', headers: { 'Authorization': 'Bearer ' + localStorage.getItem('vforme_token') } });
                if (refreshUser) await refreshUser(); else window.location.reload();
              } catch {}
            }}
              style={{ padding: '8px 14px', background: 'none', border: '1px solid ' + BD, borderRadius: 20, color: INK3, fontFamily: sans, fontSize: 12, cursor: 'pointer' }}>
              Отключить
            </button>
          ) : (
            {maxCode ? (
              <div style={{ textAlign: 'center' }}>
                <div onClick={() => { navigator.clipboard?.writeText(maxCode); }} style={{ padding: '8px 16px', background: W, border: '2px dashed #5B6CEA', borderRadius: 12, color: '#5B6CEA', fontFamily: 'monospace', fontSize: 18, fontWeight: 700, cursor: 'pointer', letterSpacing: 2 }}>
                  {maxCode}
                </div>
                <div style={{ fontSize: 10, color: INK3, marginTop: 4, fontFamily: sans }}>нажми чтобы скопировать</div>
              </div>
            ) : (
              <button onClick={async () => {
                setMaxLoading(true);
                try {
                  const res = await fetch('/api/max/link-token', { method: 'POST', headers: { 'Authorization': 'Bearer ' + localStorage.getItem('vforme_token') } });
                  const data = await res.json();
                  if (data.url) window.open(data.url, '_blank');
                  if (data.code) setMaxCode(data.code);
                } catch {}
                setMaxLoading(false);
              }} disabled={maxLoading}
                style={{ padding: '10px 18px', background: '#5B6CEA', border: 'none', borderRadius: 20, color: W, fontFamily: sans, fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {maxLoading ? '...' : user?.maxBonusGiven ? 'Подключить' : '+100'}
              </button>
            )}
          )}
        </div>
      </div>

      {pointsHistory.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: INK3, letterSpacing: 1.5, fontWeight: 700, marginBottom: 12, fontFamily: sans }}>ИСТОРИЯ БАЛЛОВ</div>
            {pointsHistory.slice(0, 5).map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid ' + BD }}>
                <div style={{ fontSize: 14, color: INK, fontFamily: sans }}>{
                  p.reason === 'lecture_complete' ? '✓ Урок завершён' :
                  p.reason === 'module_complete' ? '🏆 Модуль завершён' :
                  p.reason === 'program_purchase' ? '💳 Покупка программы' :
                  p.reason === 'telegram_link' ? '✈️ Подключение Telegram' :
                  p.reason === 'free_program' ? '🎁 Бесплатная программа' :
                  p.reason === 'protocol_purchase' ? '📋 Покупка протокола' :
                  p.reason || 'Начисление'
                }</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: GOLD, fontFamily: sans }}>+{p.amount}</div>
              </div>
            ))}
          </div>
        )}

        {(a.weight || a.height || a.goal_weight || a.waist || a.hips) && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: INK3, letterSpacing: 1.5, fontWeight: 700, marginBottom: 14, fontFamily: sans }}>МОИ ПАРАМЕТРЫ</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 10 }}>
              {a.height && <div style={{ background: GLL, borderRadius: 14, padding: '14px 8px', textAlign: 'center' }}><div style={{ fontFamily: serif, fontSize: 24, fontWeight: 700, color: G }}>{a.height}</div><div style={{ fontSize: 11, color: GL, marginTop: 3, fontFamily: sans }}>рост (см)</div></div>}
              {a.weight && <div style={{ background: GLL, borderRadius: 14, padding: '14px 8px', textAlign: 'center' }}><div style={{ fontFamily: serif, fontSize: 24, fontWeight: 700, color: G }}>{a.weight}</div><div style={{ fontSize: 11, color: GL, marginTop: 3, fontFamily: sans }}>вес (кг)</div></div>}
              {a.goal_weight && <div style={{ background: '#FBF5EB', borderRadius: 14, padding: '14px 8px', textAlign: 'center' }}><div style={{ fontFamily: serif, fontSize: 24, fontWeight: 700, color: GOLDD }}>{a.goal_weight}</div><div style={{ fontSize: 11, color: GOLDD, marginTop: 3, fontFamily: sans }}>цель (кг)</div></div>}
            </div>
            {(a.waist || a.hips) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                {a.waist && <div style={{ background: GLL, borderRadius: 14, padding: '14px', textAlign: 'center' }}><div style={{ fontFamily: serif, fontSize: 22, fontWeight: 700, color: G }}>{a.waist}</div><div style={{ fontSize: 11, color: GL, marginTop: 3, fontFamily: sans }}>талия (см)</div></div>}
                {a.hips && <div style={{ background: GLL, borderRadius: 14, padding: '14px', textAlign: 'center' }}><div style={{ fontFamily: serif, fontSize: 22, fontWeight: 700, color: G }}>{a.hips}</div><div style={{ fontSize: 11, color: GL, marginTop: 3, fontFamily: sans }}>бёдра (см)</div></div>}
              </div>
            )}
            {a.weight && a.goal_weight && (
              <div style={{ padding: '12px 16px', background: OW, borderRadius: 12, fontSize: 14, color: INK2, fontFamily: sans }}>
                До цели: <span style={{ fontWeight: 700, color: G }}>{Math.abs(a.weight - a.goal_weight)} кг</span>
              </div>
            )}
          </div>
        )}

        {(a.sleep_score !== undefined || a.energy_score !== undefined) && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: INK3, letterSpacing: 1.5, fontWeight: 700, marginBottom: 14, fontFamily: sans }}>ОЦЕНКИ ИЗ АНКЕТЫ</div>
            <ScoreBadge label="Качество сна" value={a.sleep_score} />
            <ScoreBadge label="Состояние кожи" value={a.skin_score} />
            <ScoreBadge label="Уровень стресса" value={a.stress_score} />
            <ScoreBadge label="Физическая активность" value={a.activity_score} />
            <ScoreBadge label="Уровень энергии" value={a.energy_score} />
          </div>
        )}

        {symptoms.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: INK3, letterSpacing: 1.5, fontWeight: 700, marginBottom: 12, fontFamily: sans }}>МОИ СИМПТОМЫ</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {symptoms.map((s, i) => <span key={i} style={{ background: REDBG, color: RED, fontSize: 13, borderRadius: 20, padding: '6px 14px', border: '1px solid #FFCCCC', fontFamily: sans }}>{s}</span>)}
            </div>
          </div>
        )}

        {a.main_complaints && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: INK3, letterSpacing: 1.5, fontWeight: 700, marginBottom: 12, fontFamily: sans }}>ГЛАВНЫЕ ЖАЛОБЫ</div>
            <div style={{ background: REDBG, border: '1px solid #FFCCCC', borderRadius: 14, padding: '14px 16px', fontSize: 15, color: INK, lineHeight: 1.6, fontStyle: 'italic', fontFamily: sans }}>«{a.main_complaints}»</div>
          </div>
        )}

        {anxiety.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: INK3, letterSpacing: 1.5, fontWeight: 700, marginBottom: 12, fontFamily: sans }}>ЭМОЦИОНАЛЬНЫЙ ФОН</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {anxiety.map((s, i) => <span key={i} style={{ background: '#F0EEF8', color: '#6B5EA8', fontSize: 13, borderRadius: 20, padding: '6px 14px', border: '1px solid #D0C8E8', fontFamily: sans }}>{s}</span>)}
            </div>
          </div>
        )}

        {goals.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: INK3, letterSpacing: 1.5, fontWeight: 700, marginBottom: 12, fontFamily: sans }}>МОИ ЦЕЛИ</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {goals.map((g, i) => <span key={i} style={{ background: GLL, color: G, fontSize: 13, borderRadius: 20, padding: '6px 14px', border: '1px solid #C8D8C8', fontFamily: sans }}>{g}</span>)}
            </div>
          </div>
        )}

        {a.motivation && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: INK3, letterSpacing: 1.5, fontWeight: 700, marginBottom: 12, fontFamily: sans }}>МОЯ МОТИВАЦИЯ</div>
            <div style={{ background: GLL, borderLeft: '4px solid ' + G, borderRadius: '0 14px 14px 0', padding: '14px 16px', fontSize: 15, color: INK, lineHeight: 1.6, fontStyle: 'italic', fontFamily: sans }}>«{a.motivation}»</div>
          </div>
        )}

        <button onClick={logout} style={{ width: '100%', padding: '16px', background: W, border: '1px solid ' + BD, borderRadius: 30, color: INK2, fontFamily: sans, fontWeight: 600, fontSize: 15, cursor: 'pointer', marginTop: 8 }}>
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}
