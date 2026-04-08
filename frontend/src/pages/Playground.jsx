import { useState, useEffect, useMemo, useRef } from 'react';
import { G, GL, GLL, GOLD, GOLDD, BD, INK, INK2, INK3, W, sans, serif } from '../utils/theme';

// ─── Зоны ────────────────────────────────────────────────────
export const ZONES = [
  { id: 'brain',       label: 'Сон', icon: '🧠', hint: 'Сон, стресс, восстановление' },
  { id: 'thyroid',     label: 'Энергия',     icon: '⚡', hint: 'Щитовидка, митохондрии' },
  { id: 'gut',         label: 'ЖКТ',         icon: '🍽️', hint: 'Желудок, кишечник, пищеварение' },
  { id: 'hormones',    label: 'Гормоны',     icon: '🌸', hint: 'Репродукция, цикл, кожа' },
  { id: 'composition', label: 'Тело',        icon: '💪', hint: 'Мышцы, активность, вес' },
];

// ─── Вопросы (анкета Кристины) ───────────────────────────────
export const QUESTIONS = [
  { id: 'gender', type: 'choice',
    label: 'Какой у тебя пол?',
    weights: {},
    options: [
      { v: 'male',   label: 'М', emoji: '👨', impact: 0 },
      { v: 'female', label: 'Ж', emoji: '👩', impact: 0 },
    ]},
  { id: 'sleep',    type: 'scale', direction: 'higher-better',
    label: 'Насколько ты довольна своим сном?',
    label_m: 'Насколько ты доволен своим сном?',
    hint: '0 — совсем плохо, 10 — высыпаюсь отлично',
    low: '😣', high: '😴',
    weights: { brain: 35, thyroid: 12, hormones: 10 } },
  { id: 'stress',   type: 'scale', direction: 'higher-worse',
    label: 'Уровень стресса в последнее время?',
    hint: '0 — спокойно, 10 — сильный ежедневный стресс',
    low: '🧘', high: '😵',
    weights: { brain: 28, hormones: 18, gut: 12 } },
  { id: 'energy',   type: 'scale', direction: 'higher-better',
    label: 'Сколько у тебя энергии в течение дня?',
    hint: '0 — совсем нет сил, 10 — энергия через край',
    low: '🪫', high: '⚡',
    weights: { thyroid: 38, composition: 14 } },
  { id: 'activity', type: 'scale', direction: 'higher-better',
    label: 'Уровень физической активности?',
    hint: '0 — почти не двигаюсь, 10 — тренировки 3–5 раз в неделю',
    low: '🛋️', high: '🏃‍♀️',
    weights: { composition: 40, thyroid: 10 } },
  { id: 'skin',     type: 'scale', direction: 'higher-better',
    label: 'Как бы ты оценила состояние кожи?',
    label_m: 'Как бы ты оценил состояние кожи?',
    hint: '0 — высыпания и сухость, 10 — всё отлично',
    low: '😔', high: '✨',
    weights: { hormones: 22, gut: 18 } },
  { id: 'headaches', type: 'choice',
    label: 'Бывают головные боли или мигрени?',
    weights: { brain: 20 },
    options: [
      { v: 'often', label: 'Часто',  emoji: '🤕', impact: 1 },
      { v: 'some',  label: 'Иногда', emoji: '😐', impact: 0.5 },
      { v: 'never', label: 'Нет',    emoji: '🙂', impact: 0 },
    ]},
  { id: 'gut', type: 'choice',
    label: 'Есть ли проблемы с ЖКТ — вздутие, тяжесть?',
    weights: { gut: 35 },
    options: [
      { v: 'often', label: 'Часто',  emoji: '😖', impact: 1 },
      { v: 'some',  label: 'Иногда', emoji: '🤔', impact: 0.5 },
      { v: 'never', label: 'Всё ок', emoji: '🙂', impact: 0 },
    ]},
];

// ─── Служебные функции ───────────────────────────────────────
export function answerScore(q, value) {
  if (value == null) return 0.5;
  if (q.type === 'scale') {
    const n = Math.max(0, Math.min(10, value)) / 10;
    return q.direction === 'higher-worse' ? 1 - n : n;
  }
  if (q.type === 'choice') {
    const opt = q.options.find(o => o.v === value);
    return opt ? 1 - opt.impact : 0.5;
  }
  return 0.5;
}

export function computeLevels(answers) {
  const BASELINE = 60;
  const levels = {};
  ZONES.forEach(z => { levels[z.id] = BASELINE; });
  QUESTIONS.forEach(q => {
    const score = answerScore(q, answers[q.id]);
    const delta = (score - 0.5) * 2;
    Object.entries(q.weights || {}).forEach(([zone, w]) => {
      levels[zone] = (levels[zone] ?? BASELINE) + w * delta;
    });
  });
  Object.keys(levels).forEach(k => {
    levels[k] = Math.round(Math.max(5, Math.min(100, levels[k])));
  });
  return levels;
}

export function zoneColor(level) {
  if (level >= 75) return '#3D6B3D';
  if (level >= 50) return '#7AAE7A';
  if (level >= 25) return '#D4A94A';
  return '#C88A5E';
}
export function zoneSoftFill(level) {
  if (level >= 75) return 'rgba(61, 107, 61, 0.78)';
  if (level >= 50) return 'rgba(122, 174, 122, 0.72)';
  if (level >= 25) return 'rgba(212, 169, 74, 0.72)';
  return 'rgba(200, 138, 94, 0.68)';
}

const STORAGE = 'vforme_playground_v2';
const loadState = () => { try { return JSON.parse(localStorage.getItem(STORAGE) || 'null'); } catch { return null; } };
const saveState = (s) => { try { localStorage.setItem(STORAGE, JSON.stringify(s)); } catch {} };

// ─── Анимированные уровни ────────────────────────────────────
function useAnimatedLevels(targetLevels, duration = 1000) {
  const [displayed, setDisplayed] = useState(() => {
    const zeros = {};
    ZONES.forEach(z => { zeros[z.id] = 0; });
    return zeros;
  });

  useEffect(() => {
    const start = performance.now();
    const from = { ...displayed };
    let raf;
    const ease = (t) => 1 - Math.pow(1 - t, 3); // easeOutCubic
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const e = ease(t);
      const next = {};
      ZONES.forEach(z => {
        const target = targetLevels[z.id] ?? 0;
        next[z.id] = from[z.id] + (target - from[z.id]) * e;
      });
      setDisplayed(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(targetLevels)]);

  return displayed;
}

// ─── Колесо баланса ──────────────────────────────────────────
export function BalanceWheel({ levels, focusId, onZoneClick, uid = 'w' }) {
  const animated = useAnimatedLevels(levels, 1100);

  const SIZE = 520;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const R = 158;
  const INNER = 26;
  const N = ZONES.length;
  const SLICE = (Math.PI * 2) / N;
  const GAP = 0.018; // небольшой зазор между секторами

  const pt = (r, a) => [CX + r * Math.cos(a), CY + r * Math.sin(a)];

  const sectorPath = (innerR, outerR, a1, a2) => {
    const [x1, y1] = pt(outerR, a1);
    const [x2, y2] = pt(outerR, a2);
    const [x3, y3] = pt(innerR, a2);
    const [x4, y4] = pt(innerR, a1);
    const large = a2 - a1 > Math.PI ? 1 : 0;
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)}
            A ${outerR} ${outerR} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}
            L ${x3.toFixed(2)} ${y3.toFixed(2)}
            A ${innerR} ${innerR} 0 ${large} 0 ${x4.toFixed(2)} ${y4.toFixed(2)} Z`;
  };

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible', fontFamily: sans }}>
      <defs>
        <radialGradient id={`bg-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#FFFFFF" />
          <stop offset="60%"  stopColor="#F6F2EA" />
          <stop offset="100%" stopColor="#EAE3D1" />
        </radialGradient>
        {ZONES.map((z, i) => {
          const level = animated[z.id] ?? 0;
          const c = zoneColor(level);
          return (
            <radialGradient key={z.id} id={`sect-${uid}-${z.id}`} cx="50%" cy="50%" r="100%">
              <stop offset="0%"  stopColor={c} stopOpacity="0.22" />
              <stop offset="75%" stopColor={c} stopOpacity="0.82" />
              <stop offset="100%" stopColor={c} stopOpacity="0.92" />
            </radialGradient>
          );
        })}
        <filter id={`shadow-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" result="b" />
          <feComposite in="b" in2="SourceAlpha" operator="in" result="bs" />
          <feMerge><feMergeNode in="bs" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Фон-круг с мягкой тенью */}
      <circle cx={CX} cy={CY} r={R + 10} fill={`url(#bg-${uid})`} />
      <circle cx={CX} cy={CY} r={R + 10} fill="none" stroke="#E6DFCE" strokeWidth="1" />

      {/* Концентрические сетки 25/50/75/100 */}
      {[0.25, 0.5, 0.75, 1].map(p => (
        <circle key={p} cx={CX} cy={CY} r={R * p}
          fill="none" stroke="#D9D2C0" strokeWidth="1"
          strokeDasharray={p === 1 ? 'none' : '3 4'} />
      ))}

      {/* Сектора */}
      {ZONES.map((z, i) => {
        const level = animated[z.id] ?? 0;
        const a1 = -Math.PI / 2 + i * SLICE + GAP / 2;
        const a2 = -Math.PI / 2 + (i + 1) * SLICE - GAP / 2;
        const outer = INNER + (R - INNER) * (level / 100);
        const active = z.id === focusId;
        const c = zoneColor(level);

        return (
          <g key={z.id} style={{ cursor: 'pointer' }} onClick={() => onZoneClick?.(z)}>
            {/* Невидимая хит-область на весь радиус */}
            <path d={sectorPath(INNER, R, a1, a2)} fill="transparent" />
            {/* Сама заливка сектора */}
            <path
              d={sectorPath(INNER, outer, a1, a2)}
              fill={`url(#sect-${uid}-${z.id})`}
              stroke={c}
              strokeWidth={active ? 2.2 : 0.8}
              style={{ transition: 'stroke-width .3s' }}
            />
          </g>
        );
      })}

      {/* Центральный круг */}
      <circle cx={CX} cy={CY} r={INNER} fill="#FFFFFF" stroke="#D9D2C0" strokeWidth="1.2" />
      <text x={CX} y={CY - 2} textAnchor="middle" fontSize="9" fill={INK3} letterSpacing="1">
        АТЛАС
      </text>
      <text x={CX} y={CY + 11} textAnchor="middle" fontSize="11" fontWeight="700" fill={G}>
        {Math.round(Object.values(animated).reduce((s, v) => s + v, 0) / N)}%
      </text>

      {/* Метки зон — белые плашки снаружи кольца, полностью за окружностью */}
      {ZONES.map((z, i) => {
        const level = Math.round(animated[z.id] ?? 0);
        const a = -Math.PI / 2 + (i + 0.5) * SLICE;
        // R + 36 — плашки чуть снаружи фонового круга (R + 6)
        const [lx, ly] = pt(R + 36, a);
        const active = z.id === focusId;
        const c = zoneColor(level);

        const w = Math.max(96, z.label.length * 10 + 50);
        const h = 46;

        return (
          <g key={z.id + '-lbl'} style={{ cursor: 'pointer' }} onClick={() => onZoneClick?.(z)}>
            <rect
              x={lx - w / 2} y={ly - h / 2} width={w} height={h} rx={h / 2} ry={h / 2}
              fill="#FFFFFF"
              stroke={active ? c : '#E5E0D0'}
              strokeWidth={active ? 2.2 : 1}
              style={{ filter: 'drop-shadow(0 2px 6px rgba(45,74,45,0.10))' }}
            />
            <text
              x={lx - w / 2 + 22} y={ly + 7}
              textAnchor="middle" fontSize="20"
              style={{ pointerEvents: 'none' }}
            >{z.icon}</text>
            <text
              x={lx - w / 2 + 40} y={ly - 2}
              textAnchor="start" fontSize="14"
              fontWeight={700} fill={INK}
              style={{ pointerEvents: 'none', fontFamily: sans }}
            >{z.label}</text>
            <text
              x={lx - w / 2 + 40} y={ly + 14}
              textAnchor="start" fontSize="12"
              fontWeight={700} fill={c}
              style={{ pointerEvents: 'none', fontFamily: sans }}
            >{level}%</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Шторка зоны (без изменений) ─────────────────────────────
export function ZoneSheet({ zone, level, content, onClose }) {
  if (!zone) return null;
  const items = (content || []).filter(it => it.zones?.includes(zone.id));
  const c = zoneColor(level);

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(26,26,26,0.55)',
      zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      animation: 'fadein .25s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: W, width: '100%', maxWidth: 480,
        borderRadius: '24px 24px 0 0', padding: '28px 22px 100px',
        maxHeight: '75vh', overflowY: 'auto',
        animation: 'slideup .3s ease',
      }}>
        <div style={{ width: 40, height: 4, background: '#E5E1D8', borderRadius: 2, margin: '0 auto 22px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 18,
            background: zoneSoftFill(level), display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, border: `1.5px solid ${c}`,
          }}>{zone.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 700, color: INK }}>{zone.label}</div>
            <div style={{ fontSize: 13, color: INK3, fontFamily: sans }}>{zone.hint}</div>
          </div>
        </div>

        <div style={{ background: '#F9F7F4', borderRadius: 16, padding: '14px 16px', marginBottom: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: INK3, letterSpacing: 1, fontFamily: sans }}>УРОВЕНЬ</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: c, fontFamily: serif }}>
              {level}<span style={{ fontSize: 13, color: INK3 }}>/100</span>
            </div>
          </div>
          <div style={{ height: 6, background: '#EDE9E2', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${level}%`, background: c, borderRadius: 3, transition: 'width .6s ease' }} />
          </div>
        </div>

        {items.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: INK3, letterSpacing: 1, marginBottom: 10, fontFamily: sans }}>
              ЧТО ПОДДЕРЖИВАЕТ
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {items.map((it, i) => (
                <ContentCard key={i} item={it} />
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes fadein  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideup { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}

// ─── Карточка контента ───────────────────────────────────────
export function ContentCard({ item }) {
  const tag = item.kind === 'program' ? 'ПРОГРАММА' : 'ПРОТОКОЛ';
  const free = Number(item.price) === 0;
  return (
    <div style={{
      background: W, border: `1px solid ${BD}`, borderRadius: 16, padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14, background: GLL,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0,
      }}>{item.icon || '📚'}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: G, letterSpacing: 1, fontFamily: sans }}>{tag}</div>
          <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: 0.5, fontFamily: sans,
            background: free ? '#E7F0E7' : '#FBF2DB',
            color: free ? G : GOLDD,
            padding: '2px 7px', borderRadius: 6,
          }}>
            {free ? 'БЕСПЛАТНО' : `${item.price} ₽`}
          </div>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: INK, fontFamily: sans, lineHeight: 1.3 }}>
          {item.title}
        </div>
        {item.desc && (
          <div style={{ fontSize: 12, color: INK3, fontFamily: sans, marginTop: 3, lineHeight: 1.4 }}>
            {item.desc}
          </div>
        )}
      </div>
      <div style={{ color: INK3, fontSize: 20, flexShrink: 0 }}>›</div>
    </div>
  );
}

// Отдельный компонент ВНЕ Onboarding — иначе React пересоздаёт его
// на каждом наборе символа и textarea теряет фокус.
// Position fixed — чтобы не зависеть от родителя (шапка, баннер telegram,
// навбар приложения) и не оставлять белую полосу снизу.
function OnboardingShell({ step, onBack, stepLabel, footer, children }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 480,
      height: '100dvh',
      background: '#F9F7F4',
      display: 'flex', flexDirection: 'column',
      zIndex: 200,
    }}>
      <div style={{ padding: '14px 20px 6px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button onClick={onBack} disabled={step === 1} style={{ background: 'none', border: 'none', fontSize: 22, color: step === 1 ? '#E0DACC' : INK3, cursor: step === 1 ? 'default' : 'pointer', padding: 0 }}>‹</button>
        <div style={{ flex: 1 }}>
          <div style={{ height: 4, background: '#EDE9E2', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(step / (QUESTIONS.length + 1)) * 100}%`, background: G, borderRadius: 2, transition: 'width .4s ease' }} />
          </div>
          <div style={{ fontSize: 11, color: INK3, fontFamily: sans, marginTop: 5 }}>{stepLabel}</div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 22px', minHeight: 0, overflow: 'auto' }}>
        {children}
      </div>

      {footer && <div style={{ padding: '12px 22px max(16px, env(safe-area-inset-bottom))', flexShrink: 0 }}>{footer}</div>}
    </div>
  );
}

// ─── Онбординг ───────────────────────────────────────────────
export function Onboarding({ onDone }) {
  // step 1..QUESTIONS.length = вопросы, N+1 = complaints textarea
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({});
  const [complaints, setComplaints] = useState('');

  const answer = (q, val) => setAnswers(prev => ({ ...prev, [q.id]: val }));
  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => Math.max(1, s - 1));

  // Вопросы
  if (step >= 1 && step <= QUESTIONS.length) {
    const q = QUESTIONS[step - 1];
    const current = answers[q.id];
    const isScale = q.type === 'scale';

    const qLabel = (answers.gender === 'male' && q.label_m) ? q.label_m : q.label;
    const body = (
      <>
        <div style={{ fontFamily: serif, fontSize: 21, fontWeight: 700, color: INK, textAlign: 'center', marginBottom: 6, lineHeight: 1.25 }}>
          {qLabel}
        </div>
        {q.hint && (
          <div style={{ fontFamily: sans, fontSize: 12, color: INK3, textAlign: 'center', marginBottom: 16, lineHeight: 1.45 }}>{q.hint}</div>
        )}

        {isScale && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <div style={{ fontFamily: serif, fontSize: 64, fontWeight: 700, color: G, lineHeight: 1, textAlign: 'center' }}>
                {current ?? 5}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, padding: '0 4px' }}>
              <div style={{ fontSize: 26 }}>{q.low}</div>
              <div style={{ fontSize: 26 }}>{q.high}</div>
            </div>
            <input
              type="range" min="0" max="10" step="1"
              value={current ?? 5}
              onChange={e => answer(q, Number(e.target.value))}
              style={{
                width: '100%', height: 8, borderRadius: 4,
                background: `linear-gradient(to right, ${G} 0%, ${G} ${((current ?? 5) * 10)}%, #EDE9E2 ${((current ?? 5) * 10)}%, #EDE9E2 100%)`,
                appearance: 'none', WebkitAppearance: 'none', outline: 'none', cursor: 'pointer',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: INK3, fontFamily: sans }}>
              <span>0</span><span>5</span><span>10</span>
            </div>
          </div>
        )}

        {!isScale && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.options.map(o => {
              const selected = current === o.v;
              return (
                <button key={o.v} onClick={() => { answer(q, o.v); setTimeout(next, 180); }} style={{
                  padding: '14px 18px',
                  background: selected ? GLL : W,
                  border: `1.5px solid ${selected ? G : BD}`,
                  borderRadius: 16,
                  display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', textAlign: 'left',
                }}>
                  <div style={{ fontSize: 26 }}>{o.emoji}</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: INK, fontFamily: sans }}>{o.label}</div>
                </button>
              );
            })}
          </div>
        )}

        <style>{`
          input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 26px; height: 26px; border-radius: 50%; background: ${G}; border: 4px solid ${W}; box-shadow: 0 2px 8px rgba(45,74,45,0.35); cursor: pointer; }
          input[type=range]::-moz-range-thumb { width: 26px; height: 26px; border-radius: 50%; background: ${G}; border: 4px solid ${W}; box-shadow: 0 2px 8px rgba(45,74,45,0.35); cursor: pointer; }
        `}</style>
      </>
    );

    return (
      <OnboardingShell
        step={step}
        onBack={back}
        stepLabel={`Шаг ${step} из ${QUESTIONS.length + 1}`}
        footer={isScale ? (
          <button onClick={() => { if (current == null) answer(q, 5); next(); }} style={{
            width: '100%', padding: '15px', background: G, border: 'none', borderRadius: 28,
            color: W, fontFamily: sans, fontWeight: 700, fontSize: 15, cursor: 'pointer', letterSpacing: 1,
          }}>ДАЛЬШЕ</button>
        ) : null}
      >
        {body}
      </OnboardingShell>
    );
  }

  // Последний шаг — жалобы
  if (step === QUESTIONS.length + 1) {
    return (
      <OnboardingShell
        step={step}
        onBack={back}
        stepLabel="Последний шаг"
        footer={
          <button onClick={() => onDone(answers, complaints)} style={{
            width: '100%', padding: '15px', background: G, border: 'none', borderRadius: 28,
            color: W, fontFamily: sans, fontWeight: 700, fontSize: 15, cursor: 'pointer', letterSpacing: 1,
          }}>ПОКАЗАТЬ АТЛАС</button>
        }
      >
        <div style={{ fontFamily: serif, fontSize: 21, fontWeight: 700, color: INK, textAlign: 'center', marginBottom: 6, lineHeight: 1.25 }}>
          Что ещё тебя беспокоит?
        </div>
        <div style={{ fontFamily: sans, fontSize: 12, color: INK3, textAlign: 'center', marginBottom: 14, lineHeight: 1.45 }}>
          Опиши своими словами. Можно пропустить.
        </div>
        <textarea
          value={complaints}
          onChange={e => setComplaints(e.target.value)}
          placeholder="Например: постоянная усталость, вздутие после еды, тяжело засыпать..."
          rows={4}
          style={{
            width: '100%', padding: '14px', border: `1.5px solid ${BD}`, borderRadius: 16,
            fontFamily: sans, fontSize: 14, lineHeight: 1.5, color: INK,
            outline: 'none', resize: 'none', background: W,
          }}
        />
      </OnboardingShell>
    );
  }
  return null;
}

// ─── Главный экран ───────────────────────────────────────────
function MainScreen({ state, onZoneClick, onReset }) {
  const [analysis, setAnalysis] = useState(state.analysis || null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(!state.analysis);
  const [content, setContent] = useState([]);
  const [filter, setFilter] = useState('all'); // all | free | paid

  // Запрос анализа
  useEffect(() => {
    if (state.analysis) return;
    let cancelled = false;
    fetch('/api/playground/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: state.answers, complaints: state.complaints, levels: state.levels }),
    })
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (data?.error) {
          setAnalysis({ message: '⚠️ ' + data.error, recommendedTitles: [], focusZoneIds: [] });
        } else {
          setAnalysis(data);
          // сохраняем в state чтобы не перезапрашивать
          const merged = { ...state, analysis: data };
          saveState(merged);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setAnalysis({ message: '⚠️ Не удалось получить ответ. Попробуй позже.', recommendedTitles: [], focusZoneIds: [] });
      })
      .finally(() => !cancelled && setLoadingAnalysis(false));
    return () => { cancelled = true; };
  }, []);

  // Загрузка каталога контента
  useEffect(() => {
    fetch('/api/playground/content')
      .then(r => r.json())
      .then(items => {
        if (Array.isArray(items)) setContent(items);
      })
      .catch(() => {});
  }, []);

  const focusZoneId = analysis?.focusZoneIds?.[0] || [...Object.entries(state.levels || {})].sort((a, b) => a[1] - b[1])[0]?.[0];
  const focusZone = ZONES.find(z => z.id === focusZoneId);

  // Сопоставление рекомендаций по заголовкам + сортировка: сначала бесплатные
  const recommended = useMemo(() => {
    if (!content.length) return [];
    const byFree = (a, b) => (Number(a.price) || 0) - (Number(b.price) || 0);
    const titles = (analysis?.recommendedTitles || []).map(t => t.toLowerCase());
    if (!titles.length) return [...content].sort(byFree);
    const matched = content.filter(c => titles.some(t =>
      c.title?.toLowerCase().includes(t) || t.includes(c.title?.toLowerCase() || '')
    ));
    const rest = content.filter(c => !matched.includes(c));
    // Сначала matched (бесплатные → платные), потом остальные (бесплатные → платные)
    return [...matched.sort(byFree), ...rest.sort(byFree)];
  }, [analysis, content]);

  const filtered = recommended.filter(it => {
    if (filter === 'free') return Number(it.price) === 0;
    if (filter === 'paid') return Number(it.price) > 0;
    return true;
  });

  return (
    <div style={{ background: '#F9F7F4', minHeight: '100vh', paddingBottom: 60 }}>
      {/* Хедер */}
      <div style={{ background: G, padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ color: W, fontFamily: serif, fontSize: 18, fontWeight: 700, letterSpacing: 3 }}>
          V ФОРМЕ <span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.6)', letterSpacing: 1 }}> · АТЛАС</span>
        </div>
      </div>

      {/* Колесо */}
      <div style={{ padding: '20px 4px 0', maxWidth: 600, margin: '0 auto' }}>
        <BalanceWheel levels={state.levels} focusId={focusZoneId} onZoneClick={onZoneClick} />
      </div>

      {/* Сообщение от Кристины */}
      <div style={{ padding: '0 18px', marginTop: 12 }}>
        <div style={{
          background: W, borderRadius: 22, padding: '18px 20px 20px',
          border: `1px solid ${BD}`, boxShadow: '0 2px 14px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%', overflow: 'hidden',
              background: G, border: `2px solid ${G}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              flexShrink: 0,
            }}>
              <img
                src="/img/kristina.jpg"
                alt="Кристина"
                onError={e => { e.currentTarget.style.display = 'none'; }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div>
              <div style={{ fontFamily: serif, fontSize: 15, fontWeight: 700, color: INK }}>Кристина Виноградова</div>
              <div style={{ fontSize: 11, color: INK3, fontFamily: sans }}>нутрициолог · персональный ответ</div>
            </div>
          </div>

          {loadingAnalysis ? (
            <div style={{ display: 'flex', gap: 6, padding: '10px 0' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 10, height: 10, borderRadius: '50%', background: G,
                  animation: `dotbounce 1s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          ) : (
            <>
              <div style={{ fontFamily: sans, fontSize: 14, color: INK, lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 14 }}>
                {analysis?.message || '—'}
              </div>
              <a href="/" style={{
                display: 'block', textAlign: 'center',
                padding: '13px', background: G, border: 'none', borderRadius: 22,
                color: W, fontFamily: sans, fontWeight: 700, fontSize: 14, cursor: 'pointer',
                letterSpacing: 0.5, textDecoration: 'none',
              }}>💬 Ответить Кристине</a>
            </>
          )}
        </div>
      </div>

      {/* Рекомендации с фильтром */}
      {recommended.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontFamily: serif, fontSize: 18, fontWeight: 700, color: INK }}>Рекомендуем начать</div>
          </div>

          <div style={{ padding: '0 20px', marginBottom: 14, display: 'flex', gap: 8 }}>
            {[
              { id: 'all',  label: 'Всё' },
              { id: 'free', label: 'Бесплатные' },
              { id: 'paid', label: 'Платные' },
            ].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)} style={{
                padding: '8px 16px', borderRadius: 18,
                background: filter === f.id ? G : W,
                color: filter === f.id ? W : INK2,
                border: `1px solid ${filter === f.id ? G : BD}`,
                fontFamily: sans, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>{f.label}</button>
            ))}
          </div>

          <div style={{
            display: 'flex', flexDirection: 'column', gap: 10,
            padding: '4px 20px 20px',
          }}>
            {filtered.length === 0 && (
              <div style={{ fontSize: 13, color: INK3, fontFamily: sans, padding: '12px 0', textAlign: 'center' }}>
                В этом фильтре пока ничего нет
              </div>
            )}
            {filtered.map(item => (
              <ContentCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: '24px 20px 10px' }}>
        <button onClick={onReset} style={{
          width: '100%', padding: '16px',
          background: 'transparent', border: `1.5px solid ${BD}`, borderRadius: 24,
          color: INK2, fontFamily: sans, fontWeight: 600, fontSize: 14, cursor: 'pointer', letterSpacing: 0.5,
        }}>↺ Пройти анкету заново</button>
      </div>

      <div style={{ textAlign: 'center', fontSize: 11, color: INK3, fontFamily: sans, marginTop: 8, letterSpacing: 0.3 }}>
        Прототип · ответы хранятся только на твоём устройстве
      </div>

      <style>{`
        @keyframes dotbounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%           { transform: scale(1);    opacity: 1;   }
        }
      `}</style>
    </div>
  );
}

// ─── Root ────────────────────────────────────────────────────
export default function Playground() {
  const [state, setState] = useState(() => loadState());
  const [zoneOpen, setZoneOpen] = useState(null);
  const [content, setContent] = useState([]);

  // Нужен для ZoneSheet, чтобы показывать список контента
  useEffect(() => {
    fetch('/api/playground/content')
      .then(r => r.json())
      .then(items => {
        if (!Array.isArray(items)) return;
        // Распределяем контент по зонам через простую эвристику по названию/описанию,
        // чтобы карточки появлялись в ZoneSheet без AI-маппинга.
        const KEYWORDS = {
          brain: ['сон', 'нерв', 'стресс', 'успоко', 'медит', 'голов'],
          thyroid: ['энерги', 'щитовидк', 'митохон', 'усталост'],
          gut: ['жкт', 'кишеч', 'желуд', 'вздут', 'пищеварен', 'детокс', 'печен'],
          hormones: ['гормон', 'цикл', 'менстр', 'репродук', 'женск', 'кож'],
          composition: ['тело', 'компози', 'мышц', 'вес', 'стройн', 'жир', 'активн'],
        };
        const tagged = items.map(it => {
          const t = `${it.title || ''} ${it.desc || ''}`.toLowerCase();
          const zones = Object.entries(KEYWORDS)
            .filter(([, kws]) => kws.some(k => t.includes(k)))
            .map(([z]) => z);
          return { ...it, zones: zones.length ? zones : ['composition'] };
        });
        setContent(tagged);
      })
      .catch(() => {});
  }, []);

  useEffect(() => { if (state) saveState(state); }, [state]);

  if (!state) {
    return <Onboarding onDone={(answers, complaints) => {
      const levels = computeLevels(answers);
      setState({ days: 1, answers, complaints, levels });
    }} />;
  }

  const handleReset = () => {
    if (!confirm('Сбросить прототип и пройти анкету заново?')) return;
    localStorage.removeItem(STORAGE);
    setState(null);
  };

  return (
    <>
      <MainScreen
        state={state}
        onZoneClick={z => setZoneOpen(z)}
        onReset={handleReset}
      />
      {zoneOpen && (
        <ZoneSheet
          zone={zoneOpen}
          level={state.levels[zoneOpen.id] ?? 0}
          content={content}
          onClose={() => setZoneOpen(null)}
        />
      )}
    </>
  );
}
