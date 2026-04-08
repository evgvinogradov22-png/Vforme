import { useState, useEffect, useMemo } from 'react';
import { G, GL, GLL, GOLD, GOLDD, BD, INK, INK2, INK3, W, sans, serif } from '../utils/theme';

// ─── Данные зон ──────────────────────────────────────────────
const ZONES = [
  { id: 'brain',       label: 'Сон и нервная',   icon: '🧠', hint: 'Голова, сон, стресс',         shape: { cx: 150, cy: 52,  rx: 34, ry: 40 } },
  { id: 'thyroid',     label: 'Энергия',         icon: '⚡', hint: 'Щитовидка, митохондрии',      shape: { cx: 150, cy: 108, rx: 14, ry: 9  } },
  { id: 'heart',       label: 'Сердце',          icon: '❤️', hint: 'Сердце, сосуды',              shape: { cx: 150, cy: 160, rx: 22, ry: 18 } },
  { id: 'lungs',       label: 'Дыхание',         icon: '🫁', hint: 'Лёгкие, кислород',            shape: { cx: 150, cy: 190, rx: 48, ry: 24 } },
  { id: 'liver',       label: 'Детокс',          icon: '🫛', hint: 'Печень, очищение',            shape: { cx: 175, cy: 218, rx: 18, ry: 13 } },
  { id: 'gut',         label: 'ЖКТ',             icon: '🍽️', hint: 'Желудок, кишечник',           shape: { cx: 150, cy: 260, rx: 34, ry: 22 } },
  { id: 'hormones',    label: 'Гормоны',         icon: '🌸', hint: 'Репродукция, таз',            shape: { cx: 150, cy: 310, rx: 26, ry: 14 } },
  { id: 'composition', label: 'Тело',            icon: '💪', hint: 'Мышцы, композиция',          shape: { cx: 150, cy: 430, rx: 68, ry: 110 } },
];

// Связанный контент — mock
const CONTENT = {
  brain: [
    { type: 'program',  title: 'Протокол спокойного сна',   meta: '12 уроков · 8 дней в фокусе' },
    { type: 'protocol', title: 'Перезагрузка нервной',      meta: 'Короткий сезон · 3 недели' },
    { type: 'recipe',   title: 'Ромашка с магнием',         meta: 'Вечерний ритуал' },
  ],
  thyroid: [
    { type: 'program',  title: 'Энергия без кофе',          meta: '8 уроков · базовый курс' },
    { type: 'supplement', title: 'Селен + йод',             meta: 'Схема БАД' },
  ],
  heart: [
    { type: 'program', title: 'Чистое сердце', meta: '10 уроков' },
    { type: 'recipe',  title: 'Омега-боул',    meta: 'Для сосудов' },
  ],
  lungs: [
    { type: 'protocol', title: 'Дыхание 4-7-8', meta: '2 минуты утром' },
  ],
  liver: [
    { type: 'program',  title: 'Мягкий детокс',    meta: '14 дней' },
    { type: 'recipe',   title: 'Зелёный смузи',     meta: 'Утро' },
  ],
  gut: [
    { type: 'program', title: 'ЖКТ от А до Я',              meta: '20 уроков' },
    { type: 'program', title: 'Без вздутия',                meta: '3 недели' },
    { type: 'supplement', title: 'Пробиотики базовые',       meta: 'Схема' },
  ],
  hormones: [
    { type: 'program', title: 'Женский цикл в балансе', meta: '15 уроков' },
  ],
  composition: [
    { type: 'program', title: 'Композиция тела',  meta: '30 дней' },
    { type: 'recipe',  title: 'Белковый завтрак', meta: 'Для мышц' },
  ],
};

// Цвет зоны от уровня
function zoneColor(level) {
  if (level >= 75) return '#3D6B3D';
  if (level >= 50) return '#7AAE7A';
  if (level >= 25) return '#D4A94A';
  return '#BDB8AF';
}
function zoneFill(level) {
  if (level >= 75) return 'rgba(61, 107, 61, 0.75)';
  if (level >= 50) return 'rgba(122, 174, 122, 0.65)';
  if (level >= 25) return 'rgba(212, 169, 74, 0.6)';
  return 'rgba(189, 184, 175, 0.45)';
}

const STORAGE = 'vforme_playground_v1';

function loadState() {
  try { return JSON.parse(localStorage.getItem(STORAGE) || 'null'); } catch { return null; }
}
function saveState(s) {
  try { localStorage.setItem(STORAGE, JSON.stringify(s)); } catch {}
}

const DEFAULT_LEVELS = {
  brain: 20, thyroid: 30, heart: 55, lungs: 45, liver: 40, gut: 25, hormones: 35, composition: 50,
};

// ─── Силуэт SVG ──────────────────────────────────────────────
function Silhouette({ levels, focusId, onZoneClick, pulse = true }) {
  return (
    <svg viewBox="0 0 300 640" style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F9F7F4" />
          <stop offset="100%" stopColor="#EDE9E2" />
        </linearGradient>
      </defs>

      {/* Контур тела */}
      <path
        d="M 150 12
           C 124 12 108 33 108 58
           C 108 78 116 93 130 103
           L 130 120
           L 96 132
           L 72 170
           L 62 215
           L 58 290
           L 52 340
           L 64 344
           L 74 295
           L 82 240
           L 92 200
           L 104 184
           L 108 380
           L 98 480
           L 94 620
           L 128 628
           L 138 500
           L 148 385
           L 152 385
           L 162 500
           L 172 628
           L 206 620
           L 202 480
           L 192 380
           L 196 184
           L 208 200
           L 218 240
           L 226 295
           L 236 344
           L 248 340
           L 242 290
           L 238 215
           L 228 170
           L 204 132
           L 170 120
           L 170 103
           C 184 93 192 78 192 58
           C 192 33 176 12 150 12 Z"
        fill="url(#bodyGrad)"
        stroke="#D9D5CC"
        strokeWidth="1.5"
      />

      {/* Зоны */}
      {ZONES.map(z => {
        const level = levels[z.id] ?? 0;
        const active = z.id === focusId;
        return (
          <g key={z.id} style={{ cursor: 'pointer' }} onClick={() => onZoneClick?.(z)}>
            <ellipse
              cx={z.shape.cx}
              cy={z.shape.cy}
              rx={z.shape.rx}
              ry={z.shape.ry}
              fill={zoneFill(level)}
              stroke={zoneColor(level)}
              strokeWidth={active ? 2.5 : 1.2}
              filter={active && pulse ? 'url(#glow)' : undefined}
              style={active && pulse ? { animation: 'pulse 2.8s ease-in-out infinite' } : undefined}
            />
          </g>
        );
      })}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.85; transform: scale(1); transform-origin: center; }
          50%      { opacity: 1;    transform: scale(1.06); }
        }
      `}</style>
    </svg>
  );
}

// ─── Экран «Путь» (таймлайн) ─────────────────────────────────
function JourneyScreen({ state, onBack }) {
  // Фейковые снимки: берём последние 6 месяцев, искусственно уменьшая уровни
  const snapshots = useMemo(() => {
    const months = ['Нояб', 'Дек', 'Янв', 'Фев', 'Март', 'Апр'];
    return months.map((m, i) => {
      const fade = (6 - i) * 6;
      const levels = Object.fromEntries(
        Object.entries(state.levels).map(([k, v]) => [k, Math.max(0, v - fade)])
      );
      return { month: m, levels, active: i === months.length - 1 };
    });
  }, [state.levels]);

  return (
    <div style={{ background: '#F9F7F4', minHeight: '100vh', paddingBottom: 100 }}>
      <div style={{ background: G, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: W, fontSize: 24, cursor: 'pointer' }}>‹</button>
        <div>
          <div style={{ color: W, fontFamily: serif, fontSize: 17, fontWeight: 600 }}>Твой путь</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: sans }}>{state.days} дней вместе · с ноября</div>
        </div>
      </div>

      <div style={{ padding: '20px 16px' }}>
        <div style={{ fontSize: 13, color: INK2, fontFamily: sans, marginBottom: 16, lineHeight: 1.5 }}>
          Посмотри как менялась твоя карта тела месяц за месяцем. Это не челлендж — это путь.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {snapshots.map(s => (
            <div key={s.month} style={{
              background: W, borderRadius: 16, padding: 12,
              border: s.active ? `2px solid ${G}` : `1px solid ${BD}`,
              boxShadow: s.active ? '0 4px 16px rgba(61,107,61,0.12)' : 'none',
            }}>
              <div style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, color: s.active ? G : INK3, letterSpacing: 1, marginBottom: 4 }}>
                {s.month.toUpperCase()}
              </div>
              <div style={{ transform: 'scale(0.9)', transformOrigin: 'top center' }}>
                <Silhouette levels={s.levels} pulse={false} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, background: W, borderRadius: 16, padding: '16px 18px', border: `1px solid ${BD}` }}>
          <div style={{ fontFamily: serif, fontSize: 16, fontWeight: 700, color: INK, marginBottom: 8 }}>История этой недели</div>
          <div style={{ fontSize: 13, color: INK2, fontFamily: sans, lineHeight: 1.6 }}>
            • Прошла 3 урока в «Протоколе спокойного сна»<br/>
            • Отмечено самочувствие 5 из 7 дней<br/>
            • Зона «Сон и нервная» поднялась +4%
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Экран зоны ─────────────────────────────────────────────
function ZoneSheet({ zone, level, onClose }) {
  if (!zone) return null;
  const items = CONTENT[zone.id] || [];
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
        animation: 'slideup .3s ease',
      }}>
        <div style={{ width: 40, height: 4, background: '#E5E1D8', borderRadius: 2, margin: '0 auto 22px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 18,
            background: zoneFill(level), display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, border: `1.5px solid ${c}`,
          }}>{zone.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 700, color: INK }}>{zone.label}</div>
            <div style={{ fontSize: 13, color: INK3, fontFamily: sans }}>{zone.hint}</div>
          </div>
        </div>

        {/* Уровень */}
        <div style={{ background: '#F9F7F4', borderRadius: 16, padding: '14px 16px', marginBottom: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: INK3, letterSpacing: 1, fontFamily: sans }}>УРОВЕНЬ</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: c, fontFamily: serif }}>{level}<span style={{ fontSize: 13, color: INK3 }}>/100</span></div>
          </div>
          <div style={{ height: 6, background: '#EDE9E2', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${level}%`, background: c, borderRadius: 3, transition: 'width .6s ease' }} />
          </div>
        </div>

        {/* Что влияет на зону */}
        <div style={{ fontSize: 11, fontWeight: 700, color: INK3, letterSpacing: 1, marginBottom: 10, fontFamily: sans }}>
          ЧТО ПОДДЕРЖИВАЕТ
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((it, i) => {
            const tag = { program: 'Программа', protocol: 'Протокол', recipe: 'Рецепт', supplement: 'БАД' }[it.type];
            return (
              <div key={i} style={{
                background: W, border: `1px solid ${BD}`, borderRadius: 14, padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: c, letterSpacing: 1, marginBottom: 2, fontFamily: sans }}>{tag?.toUpperCase()}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: INK, marginBottom: 2, fontFamily: sans }}>{it.title}</div>
                  <div style={{ fontSize: 12, color: INK3, fontFamily: sans }}>{it.meta}</div>
                </div>
                <div style={{ color: INK3, fontSize: 18 }}>›</div>
              </div>
            );
          })}
          {items.length === 0 && (
            <div style={{ fontSize: 13, color: INK3, fontStyle: 'italic', padding: '10px 0', fontFamily: sans }}>
              Скоро здесь появится контент для этой зоны.
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadein { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideup { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}

// ─── Онбординг ──────────────────────────────────────────────
const QUESTIONS = [
  { id: 'sleep',   label: 'Как ты обычно спишь?',         affects: { brain: -30, thyroid: -10 },
    options: [{ v: 0, label: 'Плохо', emoji: '😣' }, { v: 1, label: 'Так себе', emoji: '😐' }, { v: 2, label: 'Хорошо', emoji: '😴' }] },
  { id: 'gut',     label: 'ЖКТ беспокоит?',                affects: { gut: -35, liver: -10 },
    options: [{ v: 0, label: 'Часто', emoji: '😖' }, { v: 1, label: 'Иногда', emoji: '🤔' }, { v: 2, label: 'Всё ок', emoji: '🙂' }] },
  { id: 'energy',  label: 'Энергия в течение дня?',        affects: { thyroid: -30, heart: -10 },
    options: [{ v: 0, label: 'Валюсь', emoji: '🪫' }, { v: 1, label: 'Средняя', emoji: '🔋' }, { v: 2, label: 'Бодрая', emoji: '⚡' }] },
  { id: 'stress',  label: 'Уровень стресса?',              affects: { brain: -20, hormones: -15 },
    options: [{ v: 0, label: 'Высокий', emoji: '😵' }, { v: 1, label: 'Есть', emoji: '😮‍💨' }, { v: 2, label: 'Спокойно', emoji: '🧘' }] },
  { id: 'body',    label: 'Как чувствуешь тело?',          affects: { composition: -25, hormones: -5 },
    options: [{ v: 0, label: 'Вялое', emoji: '🥺' }, { v: 1, label: 'Норм', emoji: '🙂' }, { v: 2, label: 'В форме', emoji: '💪' }] },
];

function Onboarding({ onDone }) {
  const [step, setStep] = useState(0); // 0 = welcome, 1..N = questions, N+1 = result
  const [answers, setAnswers] = useState({});

  const answer = (q, val) => {
    const next = { ...answers, [q.id]: val };
    setAnswers(next);
    setStep(step + 1);
  };

  // Welcome
  if (step === 0) {
    return (
      <div style={{ background: '#F9F7F4', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 28px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>🌿</div>
          <div style={{ fontFamily: serif, fontSize: 30, fontWeight: 700, color: INK, lineHeight: 1.2, marginBottom: 14 }}>
            Твоя карта<br/>здоровья
          </div>
          <div style={{ fontSize: 16, color: INK2, fontFamily: sans, lineHeight: 1.55 }}>
            Расскажи что чувствуешь — я подсвечу<br/>твою карту тела и покажу с чего начать.
          </div>
        </div>
        <button onClick={() => setStep(1)} style={{
          padding: '18px', background: G, border: 'none', borderRadius: 30,
          color: W, fontFamily: sans, fontWeight: 700, fontSize: 16, cursor: 'pointer', letterSpacing: 1,
        }}>НАЧАТЬ</button>
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: INK3, fontFamily: sans }}>
          Займёт меньше минуты
        </div>
      </div>
    );
  }

  // Вопросы
  if (step >= 1 && step <= QUESTIONS.length) {
    const q = QUESTIONS[step - 1];
    const progress = (step / (QUESTIONS.length + 1)) * 100;

    return (
      <div style={{ background: '#F9F7F4', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 24px 8px' }}>
          <div style={{ height: 4, background: '#EDE9E2', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: G, borderRadius: 2, transition: 'width .4s ease' }} />
          </div>
          <div style={{ fontSize: 12, color: INK3, fontFamily: sans, marginTop: 10 }}>Шаг {step} из {QUESTIONS.length}</div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 28px' }}>
          <div style={{ fontFamily: serif, fontSize: 26, fontWeight: 700, color: INK, textAlign: 'center', marginBottom: 36, lineHeight: 1.25 }}>
            {q.label}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {q.options.map(o => (
              <button key={o.v} onClick={() => answer(q, o.v)} style={{
                padding: '18px 20px', background: W, border: `1.5px solid ${BD}`, borderRadius: 18,
                display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', textAlign: 'left',
                transition: 'all .15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = G; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BD; }}
              >
                <div style={{ fontSize: 32 }}>{o.emoji}</div>
                <div style={{ fontSize: 17, fontWeight: 600, color: INK, fontFamily: sans }}>{o.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Результат — вычисляем уровни
  const levels = { ...DEFAULT_LEVELS };
  let worstZone = 'brain';
  let worstLevel = 100;
  QUESTIONS.forEach(q => {
    const v = answers[q.id] ?? 1;
    // v: 0 = плохо (полный штраф), 1 = средне (половина), 2 = хорошо (без штрафа)
    const factor = v === 0 ? 1 : v === 1 ? 0.5 : 0;
    Object.entries(q.affects).forEach(([zone, delta]) => {
      levels[zone] = Math.max(5, (levels[zone] ?? 50) + delta * factor);
    });
  });
  Object.entries(levels).forEach(([k, v]) => {
    if (v < worstLevel) { worstLevel = v; worstZone = k; }
  });
  const focusZone = ZONES.find(z => z.id === worstZone);

  return (
    <div style={{ background: '#F9F7F4', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '30px 24px 10px', textAlign: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, letterSpacing: 1, fontFamily: sans, marginBottom: 6 }}>ТВОЯ КАРТА</div>
        <div style={{ fontFamily: serif, fontSize: 24, fontWeight: 700, color: INK, lineHeight: 1.25 }}>
          Вот что я увидела
        </div>
      </div>

      <div style={{ flex: 1, padding: '10px 20px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 280, width: '100%' }}>
          <Silhouette levels={levels} focusId={worstZone} />
        </div>
      </div>

      <div style={{ background: W, borderRadius: '24px 24px 0 0', padding: '22px 22px 30px', boxShadow: '0 -4px 24px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: 1, fontFamily: sans, marginBottom: 6 }}>
          В ФОКУСЕ
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 30 }}>{focusZone?.icon}</div>
          <div>
            <div style={{ fontFamily: serif, fontSize: 20, fontWeight: 700, color: INK }}>{focusZone?.label}</div>
            <div style={{ fontSize: 13, color: INK2, fontFamily: sans }}>Начнём с одного простого шага</div>
          </div>
        </div>
        <button onClick={() => onDone(levels, worstZone)} style={{
          width: '100%', padding: '18px', background: G, border: 'none', borderRadius: 30,
          color: W, fontFamily: sans, fontWeight: 700, fontSize: 16, cursor: 'pointer', letterSpacing: 1,
        }}>В АТЛАС ЗДОРОВЬЯ</button>
      </div>
    </div>
  );
}

// ─── Главный экран атласа ───────────────────────────────────
function AtlasScreen({ state, onZoneClick, onJourney, onDoneTask, onReset }) {
  const focusZone = ZONES.find(z => z.id === state.focusZoneId) || ZONES[0];

  return (
    <div style={{ background: '#F9F7F4', minHeight: '100vh', paddingBottom: 100 }}>
      {/* Хедер */}
      <div style={{ background: G, padding: '18px 20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 700, letterSpacing: 1.2, fontFamily: sans }}>
              ТЫ В ПУТИ
            </div>
            <div style={{ color: W, fontFamily: serif, fontSize: 28, fontWeight: 700, lineHeight: 1.1, marginTop: 2 }}>
              {state.days} <span style={{ fontSize: 16, fontWeight: 400, color: 'rgba(255,255,255,0.8)' }}>дней</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 700, letterSpacing: 1.2, fontFamily: sans }}>
              В ФОКУСЕ
            </div>
            <div style={{ color: GOLD, fontSize: 15, fontWeight: 700, marginTop: 2, fontFamily: sans }}>
              {focusZone.icon} {focusZone.label}
            </div>
          </div>
        </div>
      </div>

      {/* Силуэт */}
      <div style={{ padding: '10px 16px 0', background: '#F9F7F4', maxWidth: 380, margin: '0 auto' }}>
        <Silhouette levels={state.levels} focusId={state.focusZoneId} onZoneClick={onZoneClick} />
      </div>

      {/* Задача дня */}
      <div style={{ padding: '0 18px' }}>
        <div style={{
          background: W, borderRadius: 20, padding: '18px 20px',
          border: `1.5px solid ${state.taskDone ? '#C8DCC8' : BD}`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: state.taskDone ? G : INK3, letterSpacing: 1, marginBottom: 6, fontFamily: sans }}>
            {state.taskDone ? '✓ СДЕЛАНО СЕГОДНЯ' : 'ТВОЙ СЕГОДНЯШНИЙ ШАГ'}
          </div>
          <div style={{ fontFamily: serif, fontSize: 17, fontWeight: 600, color: INK, lineHeight: 1.4, marginBottom: 14 }}>
            {state.taskDone
              ? 'Увидимся завтра 🌿 Твой путь продолжается.'
              : 'Выпей стакан тёплой воды с лимоном сразу после пробуждения'}
          </div>
          {!state.taskDone && (
            <button onClick={onDoneTask} style={{
              width: '100%', padding: '14px', background: G, border: 'none', borderRadius: 20,
              color: W, fontFamily: sans, fontWeight: 700, fontSize: 14, cursor: 'pointer', letterSpacing: 1,
            }}>СДЕЛАЛА</button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button onClick={onJourney} style={{
            flex: 1, padding: '14px', background: W, border: `1px solid ${BD}`, borderRadius: 18,
            color: INK2, fontFamily: sans, fontWeight: 600, fontSize: 14, cursor: 'pointer',
          }}>📖 Твой путь</button>
          <button onClick={onReset} style={{
            padding: '14px 18px', background: 'transparent', border: `1px solid ${BD}`, borderRadius: 18,
            color: INK3, fontFamily: sans, fontSize: 12, cursor: 'pointer',
          }}>↺ Сброс</button>
        </div>

        <div style={{ textAlign: 'center', fontSize: 11, color: INK3, fontFamily: sans, marginTop: 20, letterSpacing: 0.5 }}>
          Прототип · все данные только на твоём устройстве
        </div>
      </div>
    </div>
  );
}

// ─── Корневой компонент ─────────────────────────────────────
export default function Playground() {
  const [state, setState] = useState(() => loadState());
  const [zoneOpen, setZoneOpen] = useState(null);
  const [view, setView] = useState('atlas'); // atlas | journey

  useEffect(() => { if (state) saveState(state); }, [state]);

  if (!state) {
    return (
      <Onboarding onDone={(levels, focusZoneId) => {
        setState({ days: 1, levels, focusZoneId, taskDone: false });
      }} />
    );
  }

  const handleDoneTask = () => {
    setState(s => {
      const nextLevels = { ...s.levels };
      const focus = s.focusZoneId;
      nextLevels[focus] = Math.min(100, (nextLevels[focus] ?? 0) + 2);
      return { ...s, taskDone: true, days: s.days + 1, levels: nextLevels };
    });
  };

  const handleReset = () => {
    if (confirm('Сбросить прототип и пройти онбординг заново?')) {
      localStorage.removeItem(STORAGE);
      setState(null);
      setView('atlas');
    }
  };

  if (view === 'journey') {
    return <JourneyScreen state={state} onBack={() => setView('atlas')} />;
  }

  return (
    <>
      <AtlasScreen
        state={state}
        onZoneClick={z => setZoneOpen(z)}
        onJourney={() => setView('journey')}
        onDoneTask={handleDoneTask}
        onReset={handleReset}
      />
      {zoneOpen && (
        <ZoneSheet
          zone={zoneOpen}
          level={state.levels[zoneOpen.id] ?? 0}
          onClose={() => setZoneOpen(null)}
        />
      )}
    </>
  );
}
