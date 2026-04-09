import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { profile as profileApi } from '../api';
import { ScoreSlider } from '../components/UI';
import { G, GOLD, BD, INK, INK2, INK3, GLL, W, sans, serif } from '../utils/theme';
import Privacy from './Privacy';

const QUESTIONNAIRE = [
  { id: 'basics', title: 'О себе', fields: [
    { id: 'name', type: 'text', label: 'Как тебя зовут?', placeholder: 'Имя' },
    { id: 'age', type: 'number', label: 'Возраст', placeholder: '30' },
    { id: 'city', type: 'text', label: 'Город', placeholder: 'Москва' },
    { id: 'height', type: 'number', label: 'Рост (см)', placeholder: '165' },
  ]},
  { id: 'body', title: 'Параметры тела', subtitle: 'Вопросы 1–2 из анкеты Кристины', fields: [
    { id: 'weight', type: 'number', label: '1. Текущий вес (кг)', placeholder: '65' },
    { id: 'goal_weight', type: 'number', label: 'Желаемый вес (кг)', placeholder: '58' },
    { id: 'waist', type: 'number', label: '2. Объём талии (см)', placeholder: '72' },
    { id: 'hips', type: 'number', label: 'Объём бёдер (см)', placeholder: '96' },
  ]},
  { id: 'complaints', title: 'Главные жалобы', subtitle: 'Вопрос 3: Что беспокоит больше всего?', fields: [
    { id: 'main_complaints', type: 'textarea', label: 'Опиши своими словами', placeholder: 'Например: сильное вздутие после еды, постоянная усталость...' },
    { id: 'priority_symptoms', type: 'multicheck', label: 'Также отметь всё, что есть', options: [
      'Лишний вес, от которого сложно избавиться', 'Вздутие, метеоризм, тяжесть после еды',
      'Изжога или отрыжка', 'Запоры или нестабильный стул', 'Выпадение волос, ломкость ногтей',
      'Тяга к сладкому, невозможно остановиться', 'Неконтролируемый аппетит',
      'Отёки, особенно по утрам', 'Частые простуды и ОРВИ', 'Снижение либидо', 'ПМС, болезненные месячные',
    ]},
  ]},
  { id: 'scores', title: 'Оцени состояние', subtitle: 'Вопросы 4–10 из анкеты Кристины', fields: [
    { id: 'sleep_problems', type: 'radio', label: '4. Есть ли проблемы со сном?', options: ['Нет, сплю хорошо', 'Иногда сложно заснуть', 'Часто не высыпаюсь', 'Хронический недосып'] },
    { id: 'sleep_score', type: 'slider', min: 0, max: 10, label: 'Оцени качество сна (0 — плохо, 10 — отлично)' },
    { id: 'edema', type: 'radio', label: '5. Отёчность лица и тела по утрам?', options: ['Нет', 'Иногда', 'Да, регулярно', 'Да, сильная'] },
    { id: 'skin_problems', type: 'radio', label: '6. Высыпания на лице или теле? Сухость?', options: ['Нет, кожа чистая', 'Небольшие высыпания', 'Регулярные высыпания', 'Сильное хроническое воспаление'] },
    { id: 'skin_score', type: 'slider', min: 0, max: 10, label: 'Оцени состояние кожи (0 — очень плохое, 10 — отличное)' },
    { id: 'anxiety', type: 'multicheck', label: '7. Замечаешь за собой (отметь всё):', options: ['Тревожность', 'Склонность к панике', 'Нервозность', 'Повышенная агрессия', 'Перепады настроения'] },
    { id: 'stress_score', type: 'slider', min: 0, max: 10, label: 'Уровень стресса (0 — нет стресса, 10 — очень высокий)' },
    { id: 'headaches', type: 'radio', label: '8. Частые головные боли или мигрени?', options: ['Нет', 'Редко', 'Иногда', 'Часто, несколько раз в неделю'] },
    { id: 'activity_score', type: 'slider', min: 0, max: 10, label: '9. Физическая активность (0 — не занимаюсь, 10 — тренировки каждый день)' },
    { id: 'energy_score', type: 'slider', min: 0, max: 10, label: '10. Уровень энергии (0 — нет сил, 10 — энергия через край)' },
  ]},
  { id: 'goals', title: 'Твоя цель', fields: [
    { id: 'main_goals', type: 'multicheck', label: 'Чего хочешь достичь за 3 месяца?', options: [
      'Снизить вес', 'Улучшить состояние кожи', 'Избавиться от проблем с ЖКТ',
      'Повысить уровень энергии', 'Наладить сон', 'Укрепить иммунитет',
      'Улучшить состояние волос и ногтей', 'Избавиться от отёков', 'Снизить тревожность',
    ]},
    { id: 'motivation', type: 'textarea', label: 'Что для тебя самое важное в этой программе?', placeholder: 'Напиши своими словами...' },
  ]},
];

export default function Register({ onBack, onSwitchToLogin, onRegistered }) {
  const { register } = useAuth();
  const [step, setStep] = useState('form'); // 'form' | 'verify' | 'questionnaire'
  const [qStep, setQStep] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [consent, setConsent] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const validateName = (n) => n.trim().length >= 2 && /^[a-zA-Zа-яёА-ЯЁ\s\-]+$/.test(n.trim());

  const updateAnswer = (id, val) => setAnswers(a => ({ ...a, [id]: val }));
  const toggleMulti = (id, opt) => {
    const cur = answers[id] || [];
    updateAnswer(id, cur.includes(opt) ? cur.filter(x => x !== opt) : [...cur, opt]);
  };

  const handleRegister = async () => {
    if (!email || !password) return;
    if (name && !validateName(name)) return setError('Имя должно содержать минимум 2 буквы и только буквы');
    if (!validateEmail(email)) return setError('Введи корректный email');
    setError('');
    setLoading(true);
    try {
      await register(email, password, name);
      if (onRegistered) onRegistered();
      setStep('verify');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    try {
      await profileApi.save(answers);
    } catch (e) {
      // profile save is non-blocking
    }
    // AuthContext user is already set, app will re-render to main
  };

  const inputStyle = {
    width: '100%', border: '1px solid ' + BD, borderRadius: 14,
    padding: '14px 16px', fontSize: 16, fontFamily: sans,
    color: INK, background: W, outline: 'none', boxSizing: 'border-box',
  };

  if (showPrivacy) return <Privacy onClose={() => setShowPrivacy(false)} />;

  if (step === 'form') return (
    <div style={{ fontFamily: sans, background: W, minHeight: '100vh', color: INK }}>
      <div style={{ background: G, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: W, fontSize: 22, cursor: 'pointer' }}>←</button>
        <div style={{ fontFamily: serif, fontSize: 20, color: W, fontWeight: 600 }}>Регистрация</div>
      </div>
      <div style={{ padding: '32px 24px' }}>
        <div style={{ fontFamily: serif, fontSize: 30, fontWeight: 600, color: G, marginBottom: 6 }}>Создай аккаунт</div>
        <div style={{ fontSize: 15, color: INK2, marginBottom: 32, lineHeight: 1.5 }}></div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: INK2, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>ИМЯ</div>
          <input type="text" placeholder="Как тебя зовут?" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: INK2, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>EMAIL</div>
          <input type="email" placeholder="example@mail.ru" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: INK2, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>ПАРОЛЬ</div>
          <input type="password" placeholder="Минимум 6 символов" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRegister()}
            style={inputStyle} />
        </div>

        {error && <div style={{ background: '#FFF0F0', border: '1px solid #FFCCCC', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: '#CC4444', marginBottom: 16 }}>{error}</div>}

        <div onClick={() => setConsent(c => !c)} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 16, cursor: 'pointer' }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${consent ? G : BD}`, background: consent ? G : W, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
            {consent && <span style={{ color: W, fontSize: 13 }}>✓</span>}
          </div>
          <div style={{ fontSize: 13, color: INK2, fontFamily: sans, lineHeight: 1.5 }}>
            Я соглашаюсь с{' '}
            <span onClick={e => { e.stopPropagation(); setShowPrivacy(true); }} style={{ color: G, fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}>
              политикой конфиденциальности
            </span>
            {' '}и даю согласие на обработку персональных данных, включая данные о здоровье
          </div>
        </div>

        <button onClick={handleRegister} disabled={!email || !password || !consent || loading}
          style={{ width: '100%', padding: '18px', background: email && password && consent && !loading ? GOLD : '#EDE8E0', border: 'none', borderRadius: 30, color: email && password && consent && !loading ? W : INK3, fontFamily: sans, fontWeight: 700, fontSize: 16, cursor: email && password && consent && !loading ? 'pointer' : 'not-allowed', marginTop: 8 }}>
          {loading ? 'СОЗДАЁМ АККАУНТ...' : 'ЗАРЕГИСТРИРОВАТЬСЯ'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: INK3 }}>
          Уже есть аккаунт?{' '}
          <span onClick={onSwitchToLogin} style={{ color: G, fontWeight: 700, cursor: 'pointer' }}>Войти</span>
        </div>
      </div>
    </div>
  );


  if (step === 'verify') return (
    <div style={{ fontFamily: sans, background: W, minHeight: '100vh', color: INK, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 24 }}>📬</div>
      <div style={{ fontFamily: serif, fontSize: 28, fontWeight: 600, color: G, marginBottom: 12 }}>Проверь почту</div>
      <div style={{ fontSize: 16, color: INK2, lineHeight: 1.7, marginBottom: 32, maxWidth: 320 }}>
        Мы отправили письмо на <strong>{email}</strong>.<br/>
        Перейди по ссылке в письме чтобы активировать аккаунт.
      </div>
      <div style={{ background: GLL, borderRadius: 16, padding: '20px 24px', marginBottom: 32, maxWidth: 320, width: '100%' }}>
        <div style={{ fontSize: 14, color: G, lineHeight: 1.6 }}>
          ✉️ Письмо может прийти в течение 2–3 минут.<br/>
          Проверь папку «Спам» если не видишь письма.
        </div>
      </div>
      <button onClick={() => setStep('questionnaire')}
        style={{ width: '100%', maxWidth: 320, padding: '16px', background: GOLD, border: 'none', borderRadius: 30, color: W, fontFamily: sans, fontWeight: 700, fontSize: 15, cursor: 'pointer', marginBottom: 12 }}>
        УЖЕ ПОДТВЕРДИЛ — ПРОДОЛЖИТЬ
      </button>
      <div style={{ fontSize: 13, color: INK3 }}>
        Не получили письмо?{' '}
        <span onClick={async () => {
          try {
            await fetch('/api/auth/resend-verify', { method: 'POST', headers: { 'Authorization': 'Bearer ' + localStorage.getItem('vforme_token') } });
            alert('Письмо отправлено повторно');
          } catch(e) {}
        }} style={{ color: G, fontWeight: 700, cursor: 'pointer' }}>Отправить ещё раз</span>
      </div>
    </div>
  );

  // QUESTIONNAIRE
  const section = QUESTIONNAIRE[qStep];
  const isLast = qStep === QUESTIONNAIRE.length - 1;
  const pct = Math.round(((qStep + 1) / QUESTIONNAIRE.length) * 100);

  const renderField = (field) => {
    const a = answers;
    if (field.type === 'text' || field.type === 'number') return (
      <div key={field.id} style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 15, color: INK, fontWeight: 600, marginBottom: 10 }}>{field.label}</div>
        <input type={field.type} placeholder={field.placeholder} value={a[field.id] || ''}
          onChange={e => updateAnswer(field.id, e.target.value)} style={inputStyle} />
      </div>
    );
    if (field.type === 'textarea') return (
      <div key={field.id} style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 15, color: INK, fontWeight: 600, marginBottom: 10, lineHeight: 1.5 }}>{field.label}</div>
        <textarea placeholder={field.placeholder} value={a[field.id] || ''} onChange={e => updateAnswer(field.id, e.target.value)} rows={4}
          style={{ ...inputStyle, resize: 'none' }} />
      </div>
    );
    if (field.type === 'radio') return (
      <div key={field.id} style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 15, color: INK, fontWeight: 600, marginBottom: 12, lineHeight: 1.5 }}>{field.label}</div>
        {field.options.map(opt => { const sel = a[field.id] === opt; return (
          <div key={opt} onClick={() => updateAnswer(field.id, opt)}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', border: '1px solid ' + (sel ? G : BD), borderRadius: 14, marginBottom: 8, cursor: 'pointer', background: sel ? GLL : W }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid ' + (sel ? G : BD), background: sel ? G : W, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {sel && <div style={{ width: 8, height: 8, borderRadius: '50%', background: W }} />}
            </div>
            <div style={{ fontSize: 15, color: INK }}>{opt}</div>
          </div>
        ); })}
      </div>
    );
    if (field.type === 'multicheck') return (
      <div key={field.id} style={{ marginBottom: 16 }}>
        {field.label && <div style={{ fontSize: 15, color: INK, fontWeight: 600, marginBottom: 12, lineHeight: 1.5 }}>{field.label}</div>}
        {field.options.map(opt => { const sel = (a[field.id] || []).includes(opt); return (
          <div key={opt} onClick={() => toggleMulti(field.id, opt)}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', border: '1px solid ' + (sel ? G : BD), borderRadius: 14, marginBottom: 8, cursor: 'pointer', background: sel ? GLL : W }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, border: '2px solid ' + (sel ? G : BD), background: sel ? G : W, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {sel && <span style={{ color: W, fontSize: 13, fontWeight: 700 }}>✓</span>}
            </div>
            <div style={{ fontSize: 15, color: INK, lineHeight: 1.4 }}>{opt}</div>
          </div>
        ); })}
      </div>
    );
    if (field.type === 'slider') return (
      <ScoreSlider key={field.id} label={field.label} value={a[field.id]} min={field.min} max={field.max} onChange={v => updateAnswer(field.id, v)} />
    );
    return null;
  };

  return (
    <div style={{ fontFamily: sans, background: W, minHeight: '100vh', color: INK }}>
      <div style={{ background: G, padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontFamily: serif, fontSize: 18, color: W, fontWeight: 600 }}>Анкета-опросник</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Кристина Виноградова</div>
          </div>
          <div style={{ color: GOLD, fontSize: 15, fontWeight: 700 }}>{qStep + 1}/{QUESTIONNAIRE.length}</div>
        </div>
        <div style={{ height: 5, background: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: pct + '%', background: GOLD, borderRadius: 4, transition: 'width .4s' }} />
        </div>
      </div>
      <div style={{ padding: '28px 24px', paddingBottom: 110 }}>
        <div style={{ fontFamily: serif, fontSize: 28, fontWeight: 600, color: G, marginBottom: 4 }}>{section.title}</div>
        {section.subtitle && <div style={{ fontSize: 15, color: INK2, marginBottom: 24, lineHeight: 1.6 }}>{section.subtitle}</div>}
        {!section.subtitle && <div style={{ marginBottom: 24 }} />}
        {section.fields.map(renderField)}
      </div>
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: W, borderTop: '1px solid ' + BD, padding: '16px 24px', display: 'flex', gap: 12, maxWidth: 480, margin: '0 auto' }}>
        {qStep > 0 && <button onClick={() => setQStep(q => q - 1)} style={{ flex: 1, padding: '16px', background: '#F9F7F4', border: '1px solid ' + BD, borderRadius: 30, color: INK2, fontFamily: sans, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Назад</button>}
        <button onClick={() => { if (isLast) { handleFinish(); } else { setQStep(q => q + 1); } }}
          style={{ flex: 2, padding: '16px', background: GOLD, border: 'none', borderRadius: 30, color: W, fontFamily: sans, fontWeight: 700, fontSize: 16, letterSpacing: 1, cursor: 'pointer' }}>
          {isLast ? 'НАЧАТЬ ПРОГРАММУ ✓' : 'ДАЛЕЕ'}
        </button>
      </div>
    </div>
  );
}
