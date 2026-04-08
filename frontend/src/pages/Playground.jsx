import { useState, useEffect, useMemo } from 'react';
import { G, GL, GLL, GOLD, GOLDD, BD, INK, INK2, INK3, W, sans, serif } from '../utils/theme';

// ─── Данные зон ──────────────────────────────────────────────
// viewBox="0 0 320 720" — женский силуэт. cx=160 — центр.
const ZONES = [
  { id: 'brain',       label: 'Сон и нервная',   icon: '🧠', hint: 'Голова, сон, стресс',          shape: { cx: 160, cy: 72,  rx: 36, ry: 44 } },
  { id: 'thyroid',     label: 'Энергия',         icon: '⚡', hint: 'Щитовидка, митохондрии',       shape: { cx: 160, cy: 134, rx: 16, ry: 10 } },
  { id: 'lungs',       label: 'Дыхание',         icon: '🫁', hint: 'Лёгкие, кислород',             shape: { cx: 160, cy: 200, rx: 56, ry: 28 } },
  { id: 'heart',       label: 'Сердце',          icon: '❤️', hint: 'Сердце, сосуды',               shape: { cx: 160, cy: 186, rx: 20, ry: 14 } },
  { id: 'liver',       label: 'Детокс',          icon: '🌿', hint: 'Печень, очищение',             shape: { cx: 185, cy: 240, rx: 22, ry: 14 } },
  { id: 'gut',         label: 'ЖКТ',             icon: '🍽️', hint: 'Желудок, кишечник',            shape: { cx: 160, cy: 290, rx: 40, ry: 28 } },
  { id: 'hormones',    label: 'Гормоны',         icon: '🌸', hint: 'Репродукция, таз',             shape: { cx: 160, cy: 360, rx: 46, ry: 22 } },
  { id: 'composition', label: 'Тело',            icon: '💪', hint: 'Мышцы, композиция',            shape: { cx: 160, cy: 510, rx: 72, ry: 130 } },
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
// Женский силуэт: голова + шея + торс с талией + бёдра + ноги + руки.
// Всё собрано из чистых примитивов и одного path для торса с bezier-талией.
function Silhouette({ levels, focusId, onZoneClick, pulse = true, uid = '' }) {
  const gid = `glow-${uid}`;
  const bgid = `body-${uid}`;
  return (
    <svg viewBox="0 0 320 720" style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
      <defs>
        <filter id={gid} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <linearGradient id={bgid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#F4F0E8" />
          <stop offset="55%"  stopColor="#EAE3D5" />
          <stop offset="100%" stopColor="#DFD6C3" />
        </linearGradient>
        <radialGradient id={`shine-${uid}`} cx="35%" cy="25%" r="70%">
          <stop offset="0%"  stopColor="rgba(255,255,255,0.55)" />
          <stop offset="60%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>

      {/* Мягкая тень под фигурой */}
      <ellipse cx="160" cy="700" rx="80" ry="8" fill="rgba(45, 74, 45, 0.08)" />

      <g>
        {/* Голова */}
        <ellipse cx="160" cy="70" rx="36" ry="44" fill={`url(#${bgid})`} stroke="#CFC7B3" strokeWidth="1.2" />

        {/* Шея */}
        <path d="M 148 108 Q 148 126, 140 136 L 180 136 Q 172 126, 172 108 Z"
              fill={`url(#${bgid})`} stroke="#CFC7B3" strokeWidth="1.2" />

        {/* Торс + талия (женская форма с cinched waist) */}
        <path d="
          M 96 140
          Q 86 145, 88 158
          L 100 220
          Q 108 262, 116 300
          Q 108 320, 112 350
          L 124 410
          L 196 410
          L 208 350
          Q 212 320, 204 300
          Q 212 262, 220 220
          L 232 158
          Q 234 145, 224 140
          Q 205 132, 190 132
          L 130 132
          Q 115 132, 96 140 Z"
          fill={`url(#${bgid})`} stroke="#CFC7B3" strokeWidth="1.2"
        />

        {/* Бёдра */}
        <path d="
          M 112 340
          Q 96 380, 100 430
          Q 106 470, 120 480
          L 200 480
          Q 214 470, 220 430
          Q 224 380, 208 340 Z"
          fill={`url(#${bgid})`} stroke="#CFC7B3" strokeWidth="1.2"
        />

        {/* Левая нога */}
        <path d="
          M 118 470
          Q 114 560, 118 640
          Q 120 680, 130 690
          L 154 692
          Q 160 680, 156 620
          Q 154 540, 152 470 Z"
          fill={`url(#${bgid})`} stroke="#CFC7B3" strokeWidth="1.2"
        />

        {/* Правая нога */}
        <path d="
          M 168 470
          Q 166 540, 164 620
          Q 160 680, 166 692
          L 190 690
          Q 200 680, 202 640
          Q 206 560, 202 470 Z"
          fill={`url(#${bgid})`} stroke="#CFC7B3" strokeWidth="1.2"
        />

        {/* Левая рука */}
        <path d="
          M 92 150
          Q 74 162, 68 200
          Q 62 250, 64 310
          Q 66 345, 76 352
          L 92 350
          Q 96 340, 94 310
          Q 94 250, 100 200
          Q 102 175, 102 155 Z"
          fill={`url(#${bgid})`} stroke="#CFC7B3" strokeWidth="1.2"
        />

        {/* Правая рука */}
        <path d="
          M 228 150
          Q 246 162, 252 200
          Q 258 250, 256 310
          Q 254 345, 244 352
          L 228 350
          Q 224 340, 226 310
          Q 226 250, 220 200
          Q 218 175, 218 155 Z"
          fill={`url(#${bgid})`} stroke="#CFC7B3" strokeWidth="1.2"
        />

        {/* Свет сверху-слева — объём */}
        <ellipse cx="160" cy="280" rx="140" ry="360" fill={`url(#shine-${uid})`} pointerEvents="none" />
      </g>

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
              strokeWidth={active ? 2.4 : 1}
              filter={active && pulse ? `url(#${gid})` : undefined}
              style={active && pulse ? { animation: 'pulse 2.8s ease-in-out infinite', transformOrigin: `${z.shape.cx}px ${z.shape.cy}px` } : undefined}
            />
          </g>
        );
      })}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.85; transform: scale(1); }
          50%      { opacity: 1;    transform: scale(1.05); }
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
// Вопросы из анкеты Кристины. type: 'scale' = 0-10 слайдер; 'choice' = карточки с вариантами.
// direction: 'higher-better' — большой балл хорошо; 'higher-worse' — большой балл плохо (стресс).
// weights — вклад в уровни зон. Итоговый уровень зоны = 60 + сумма вкладов вопросов.
const QUESTIONS = [
  {
    id: 'sleep', type: 'scale', direction: 'higher-better',
    label: 'Насколько ты довольна своим сном?',
    hint: '0 — совсем плохо, 10 — высыпаюсь отлично',
    low: '😣', high: '😴',
    weights: { brain: 35, thyroid: 10, hormones: 8 },
  },
  {
    id: 'stress', type: 'scale', direction: 'higher-worse',
    label: 'Уровень стресса в последнее время?',
    hint: '0 — спокойно, 10 — сильный ежедневный стресс',
    low: '🧘', high: '😵',
    weights: { brain: 25, hormones: 15, heart: 10, gut: 8 },
  },
  {
    id: 'energy', type: 'scale', direction: 'higher-better',
    label: 'Сколько у тебя энергии в течение дня?',
    hint: '0 — совсем нет сил, 10 — энергия через край',
    low: '🪫', high: '⚡',
    weights: { thyroid: 35, heart: 10, composition: 10 },
  },
  {
    id: 'activity', type: 'scale', direction: 'higher-better',
    label: 'Уровень физической активности?',
    hint: '0 — почти не двигаюсь, 10 — тренировки 3–5 раз в неделю',
    low: '🛋️', high: '🏃‍♀️',
    weights: { composition: 30, lungs: 20, heart: 15 },
  },
  {
    id: 'skin', type: 'scale', direction: 'higher-better',
    label: 'Как бы ты оценила состояние кожи?',
    hint: '0 — высыпания и сухость, 10 — всё отлично',
    low: '😔', high: '✨',
    weights: { liver: 20, hormones: 15, gut: 10 },
  },
  {
    id: 'swelling', type: 'choice',
    label: 'Замечаешь отёчность утром?',
    weights: { liver: 20, heart: 8 },
    options: [
      { v: 'often',  label: 'Часто',   emoji: '💧', impact: 1 },
      { v: 'some',   label: 'Иногда',  emoji: '🌤', impact: 0.5 },
      { v: 'never',  label: 'Нет',     emoji: '☀️', impact: 0 },
    ],
  },
  {
    id: 'headaches', type: 'choice',
    label: 'Бывают головные боли или мигрени?',
    weights: { brain: 18, liver: 6 },
    options: [
      { v: 'often',  label: 'Часто',   emoji: '🤕', impact: 1 },
      { v: 'some',   label: 'Иногда',  emoji: '😐', impact: 0.5 },
      { v: 'never',  label: 'Нет',     emoji: '🙂', impact: 0 },
    ],
  },
  {
    id: 'gut', type: 'choice',
    label: 'Есть ли проблемы с ЖКТ — вздутие, тяжесть?',
    weights: { gut: 30, liver: 10 },
    options: [
      { v: 'often',  label: 'Часто',   emoji: '😖', impact: 1 },
      { v: 'some',   label: 'Иногда',  emoji: '🤔', impact: 0.5 },
      { v: 'never',  label: 'Всё ок',  emoji: '🙂', impact: 0 },
    ],
  },
];

// Преобразует ответ в коэффициент 0..1, где 1 = всё хорошо (полный бонус), 0 = совсем плохо (полный штраф)
function answerToScore(q, value) {
  if (value == null) return 0.5;
  if (q.type === 'scale') {
    const normalized = Math.max(0, Math.min(10, value)) / 10;
    return q.direction === 'higher-worse' ? 1 - normalized : normalized;
  }
  if (q.type === 'choice') {
    const opt = q.options.find(o => o.v === value);
    return opt ? 1 - opt.impact : 0.5;
  }
  return 0.5;
}

// Считает уровни зон по ответам
function computeLevels(answers) {
  const BASELINE = 60;
  const levels = { brain: BASELINE, thyroid: BASELINE, heart: BASELINE, lungs: BASELINE,
                   liver: BASELINE, gut: BASELINE, hormones: BASELINE, composition: BASELINE };
  QUESTIONS.forEach(q => {
    const score = answerToScore(q, answers[q.id]);      // 0..1
    const delta = (score - 0.5) * 2;                     // -1..+1
    Object.entries(q.weights || {}).forEach(([zone, w]) => {
      levels[zone] = (levels[zone] ?? BASELINE) + w * delta;
    });
  });
  Object.keys(levels).forEach(k => {
    levels[k] = Math.round(Math.max(5, Math.min(100, levels[k])));
  });
  return levels;
}

function Onboarding({ onDone }) {
  const [step, setStep] = useState(0); // 0 = welcome, 1..N = вопросы, N+1 = результат
  const [answers, setAnswers] = useState({});

  const answer = (q, val) => {
    setAnswers(prev => ({ ...prev, [q.id]: val }));
  };
  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => Math.max(0, s - 1));

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
    const current = answers[q.id];
    const isScale = q.type === 'scale';
    const canNext = current != null || isScale; // для scale есть default 5

    return (
      <div style={{ background: '#F9F7F4', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 24px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={back} style={{ background: 'none', border: 'none', fontSize: 22, color: INK3, cursor: 'pointer', padding: 0 }}>‹</button>
          <div style={{ flex: 1 }}>
            <div style={{ height: 4, background: '#EDE9E2', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: G, borderRadius: 2, transition: 'width .4s ease' }} />
            </div>
            <div style={{ fontSize: 12, color: INK3, fontFamily: sans, marginTop: 8 }}>Шаг {step} из {QUESTIONS.length}</div>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 28px' }}>
          <div style={{ fontFamily: serif, fontSize: 24, fontWeight: 700, color: INK, textAlign: 'center', marginBottom: 12, lineHeight: 1.3 }}>
            {q.label}
          </div>
          {q.hint && (
            <div style={{ fontFamily: sans, fontSize: 13, color: INK3, textAlign: 'center', marginBottom: 30, lineHeight: 1.5 }}>
              {q.hint}
            </div>
          )}

          {isScale && (
            <div style={{ padding: '10px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                <div style={{
                  fontFamily: serif, fontSize: 72, fontWeight: 700, color: G, lineHeight: 1,
                  minWidth: 100, textAlign: 'center',
                }}>
                  {current ?? 5}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, padding: '0 4px' }}>
                <div style={{ fontSize: 28 }}>{q.low}</div>
                <div style={{ fontSize: 28 }}>{q.high}</div>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: INK3, fontFamily: sans }}>
                <span>0</span><span>5</span><span>10</span>
              </div>
            </div>
          )}

          {!isScale && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {q.options.map(o => {
                const selected = current === o.v;
                return (
                  <button key={o.v} onClick={() => { answer(q, o.v); setTimeout(next, 180); }} style={{
                    padding: '18px 20px',
                    background: selected ? GLL : W,
                    border: `1.5px solid ${selected ? G : BD}`,
                    borderRadius: 18,
                    display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', textAlign: 'left',
                    transition: 'all .15s ease',
                  }}>
                    <div style={{ fontSize: 32 }}>{o.emoji}</div>
                    <div style={{ fontSize: 17, fontWeight: 600, color: INK, fontFamily: sans }}>{o.label}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {isScale && (
          <div style={{ padding: '0 28px 30px' }}>
            <button onClick={() => { if (current == null) answer(q, 5); next(); }} style={{
              width: '100%', padding: '18px', background: G, border: 'none', borderRadius: 30,
              color: W, fontFamily: sans, fontWeight: 700, fontSize: 16, cursor: 'pointer', letterSpacing: 1,
            }}>ДАЛЬШЕ</button>
          </div>
        )}

        <style>{`
          input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: ${G};
            border: 4px solid ${W};
            box-shadow: 0 2px 8px rgba(45,74,45,0.35);
            cursor: pointer;
          }
          input[type=range]::-moz-range-thumb {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: ${G};
            border: 4px solid ${W};
            box-shadow: 0 2px 8px rgba(45,74,45,0.35);
            cursor: pointer;
          }
        `}</style>
      </div>
    );
  }

  // Результат
  const levels = computeLevels(answers);
  let worstZone = 'brain';
  let worstLevel = 101;
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
