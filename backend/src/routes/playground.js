// Playground — прототип атласа здоровья.
// Эндпоинт без авторизации: принимает ответы анкеты и возвращает
// короткое сообщение от имени Кристины + рекомендации.
const router = require('express').Router();
const https = require('https');

function openrouter(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const opts = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://app.nutrikris.ru',
        'X-Title': 'V Forme Playground',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const ZONE_LABELS = {
  brain: 'Сон и нервная система',
  thyroid: 'Энергия и щитовидка',
  gut: 'ЖКТ и пищеварение',
  hormones: 'Гормоны и цикл',
  composition: 'Композиция тела',
};

function buildUserPrompt(answers, complaints, levels, weakest) {
  const fmtScale = (v) => v == null ? '—' : `${v}/10`;
  const fmtChoice = (v) => ({ often: 'часто', some: 'иногда', never: 'нет' }[v] || '—');
  const zonesList = weakest.map(z => `${ZONE_LABELS[z.id]} (${z.level}%)`).join(', ');

  return `Клиентка прошла диагностическую анкету. Её ответы:

- Сон: ${fmtScale(answers.sleep)}
- Уровень стресса: ${fmtScale(answers.stress)}
- Энергия в течение дня: ${fmtScale(answers.energy)}
- Физическая активность: ${fmtScale(answers.activity)}
- Состояние кожи: ${fmtScale(answers.skin)}
- Головные боли/мигрени: ${fmtChoice(answers.headaches)}
- Проблемы с ЖКТ (вздутие, тяжесть): ${fmtChoice(answers.gut)}

Дополнительно клиентка написала о том, что её беспокоит:
"${complaints || '(не указала)'}"

По её ответам карта здоровья показывает самые слабые зоны: ${zonesList}.

Напиши тёплое личное сообщение как будто ты пишешь ей в личку в мессенджер. Коротко, 3–4 небольших абзаца. Начни с обращения "Привет!". Структура:
1. Мягко отметь основные точки роста (без диагнозов и медицинских терминов).
2. Скажи с какой зоны имеет смысл начать в первую очередь и почему.
3. Дай 1–2 простых превентивных шага через питание/режим/образ жизни, которые можно начать уже сегодня.
4. В конце — тёплая поддерживающая фраза.

Верни строго JSON без markdown-обёрток в формате:
{
  "message": "текст сообщения с переводами строк через \\n\\n",
  "focusZoneIds": ["brain", "gut"],
  "recommendedTitles": ["Протокол спокойного сна", "ЖКТ от А до Я"]
}

Доступные зоны: brain (сон/нервная), thyroid (энергия/щитовидка), gut (ЖКТ/пищеварение), hormones (гормоны/цикл/кожа), composition (тело/активность/вес). Оставайся в рамках нутрициологии — питание, режим, сон, активность, образ жизни.`;
}

router.post('/analyze', async (req, res) => {
  try {
    const { answers = {}, complaints = '', levels = {} } = req.body || {};

    // Топ-3 самые слабые зоны
    const weakest = Object.entries(levels)
      .map(([id, level]) => ({ id, level }))
      .sort((a, b) => a.level - b.level)
      .slice(0, 3);

    const systemPrompt = `Ты — Кристина Виноградова, нутрициолог и эксперт по здоровью. Общаешься тёплым дружелюбным тоном, как близкий специалист который заботится о клиентке. На "ты". Без медицинских диагнозов, без назначения препаратов, только мягкие рекомендации по образу жизни, сну, питанию и маленьким шагам. Всегда отвечай строго в формате JSON без пояснений вокруг.`;

    const userPrompt = buildUserPrompt(answers, complaints, levels, weakest);

    const response = await openrouter({
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
      max_tokens: 900,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices?.[0]?.message?.content;
    if (!raw) {
      return res.status(502).json({ error: 'Нейросеть не вернула ответ' });
    }

    // Парсим JSON, на всякий случай чистим возможные markdown-обёртки
    let parsed;
    try {
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { message: raw, focusZoneIds: [weakest[0]?.id].filter(Boolean), recommendedTitles: [] };
    }

    res.json({
      message: parsed.message || '',
      focusZoneIds: Array.isArray(parsed.focusZoneIds) ? parsed.focusZoneIds : [weakest[0]?.id].filter(Boolean),
      recommendedTitles: Array.isArray(parsed.recommendedTitles) ? parsed.recommendedTitles : [],
      weakest,
    });
  } catch (e) {
    console.error('Playground analyze error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Список рекомендуемого контента — берём реальные программы и протоколы
router.get('/content', async (req, res) => {
  try {
    const Program = require('../models/Program');
    const Protocol = require('../models/Protocol');
    const [programs, protocols] = await Promise.all([
      Program.findAll({ where: { available: true }, order: [['order', 'ASC']] }),
      Protocol.findAll({ where: { available: true }, order: [['order', 'ASC']] }),
    ]);
    const items = [
      ...programs.map(p => ({
        id: p.id, kind: 'program', title: p.title, desc: p.desc,
        price: Number(p.price) || 0, icon: p.icon || '📚',
      })),
      ...protocols.map(p => ({
        id: p.id, kind: 'protocol', title: p.title, desc: p.description || '',
        price: Number(p.price) || 0, icon: '📋',
      })),
    ];
    res.json(items);
  } catch (e) {
    console.error('Playground content error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
