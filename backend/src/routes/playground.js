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

function buildUserPrompt(answers, complaints, levels, weakest, catalog) {
  const fmtScale = (v) => v == null ? '—' : `${v}/10`;
  const fmtChoice = (v) => ({ often: 'часто', some: 'иногда', never: 'нет/всё ок' }[v] || '—');
  const isMale = answers.gender === 'male';
  const voc = isMale ? 'мужской' : 'женский';
  const verbBe = isMale ? 'ты доволен' : 'ты довольна';
  const addr = isMale ? 'обращайся в мужском роде (ты доволен, ты заметил, ты готов)' : 'обращайся в женском роде (ты довольна, ты заметила, ты готова)';

  const zonesList = weakest.map(z => `${ZONE_LABELS[z.id] || z.id} (${z.level}%)`).join(', ');
  const levelsAll = Object.entries(levels).map(([k, v]) => `${ZONE_LABELS[k] || k}: ${v}%`).join(', ');
  const catalogList = catalog.length
    ? catalog.map(c => `- "${c.title}" (${c.kind === 'program' ? 'программа' : 'протокол'}${Number(c.price) > 0 ? `, ${c.price} ₽` : ', бесплатно'})`).join('\n')
    : '(каталог пуст)';

  return `Клиент прошёл анкету. Пол: ${voc}. В сообщении ${addr}.

ВСЕ его ответы с цифрами — ты ОБЯЗАН учесть каждый из них, не обобщать:

- Сон (0 плохо, 10 отлично): ${fmtScale(answers.sleep)}
- Стресс (0 спокойно, 10 сильный): ${fmtScale(answers.stress)}
- Энергия (0 нет сил, 10 через край): ${fmtScale(answers.energy)}
- Физическая активность (0 лежит, 10 тренировки 3–5 раз): ${fmtScale(answers.activity)}
- Кожа (0 плохо, 10 отлично): ${fmtScale(answers.skin)}
- Головные боли / мигрени: ${fmtChoice(answers.headaches)}
- Проблемы с ЖКТ (вздутие, тяжесть): ${fmtChoice(answers.gut)}

Жалобы своими словами: "${complaints || '(не указал)'}"

Карта здоровья (уровни всех зон): ${levelsAll}.
Самые слабые зоны: ${zonesList}.

Наши программы и протоколы (выбирай ТОЛЬКО из этого списка, заголовки слово-в-слово):
${catalogList}

Напиши короткое персональное сообщение в мессенджере. ОЧЕНЬ ВАЖНО:
1. Процитируй минимум 3 конкретных ответа с цифрами или выбранными вариантами — чтобы клиент(ка) увидел что ты реально прочитала его анкету. Например: "сон ты оценила на 3/10, а энергию всего на 4 — это связано". Не используй общие фразы типа "у тебя есть точки роста".
2. Если клиент(ка) написал(а) жалобу в свободной форме — обязательно отреагируй на неё отдельным предложением.
3. Свяжи ответы между собой — покажи КАК они влияют друг на друга (например: стресс 8 + ЖКТ часто = логическая связь).
4. Назови конкретную зону с которой стоит начать и почему именно она.
5. В конце одним предложением сошлись на подборку ниже.

Формат: 3 абзаца по 2–3 строки каждый. Тёплый живой тон, ${addr}. Без диагнозов, без медицинских терминов.

В recommendedTitles верни 3–5 заголовков ИЗ СПИСКА ВЫШЕ, которые ТОЧНО подходят к ответам клиент(ки).

Верни строго JSON без markdown:
{
  "message": "текст с \\n\\n между абзацами",
  "focusZoneIds": ["brain", "gut"],
  "recommendedTitles": ["точный заголовок 1", "точный заголовок 2"]
}

Доступные зоны: brain, thyroid, gut, hormones, composition.`;
}

router.post('/analyze', async (req, res) => {
  try {
    const { answers = {}, complaints = '', levels = {} } = req.body || {};

    // Топ-3 самые слабые зоны
    const weakest = Object.entries(levels)
      .map(([id, level]) => ({ id, level }))
      .sort((a, b) => a.level - b.level)
      .slice(0, 3);

    // Подтягиваем каталог доступных программ и протоколов
    const Program = require('../models/Program');
    const Protocol = require('../models/Protocol');
    const [programs, protocols] = await Promise.all([
      Program.findAll({ where: { available: true }, order: [['order', 'ASC']] }).catch(() => []),
      Protocol.findAll({ where: { available: true }, order: [['order', 'ASC']] }).catch(() => []),
    ]);
    const catalog = [
      ...programs.map(p => ({ title: p.title, kind: 'program',  price: Number(p.price) || 0 })),
      ...protocols.map(p => ({ title: p.title, kind: 'protocol', price: Number(p.price) || 0 })),
    ];

    const systemPrompt = `Ты — Кристина Виноградова, нутрициолог и эксперт по здоровью. Общаешься тёплым дружелюбным тоном, на "ты". Твоя задача — коротко поддержать клиентку и направить её к конкретным продуктам из нашего каталога. Без диагнозов, без лекарств. Отвечай строго в формате JSON.`;

    const userPrompt = buildUserPrompt(answers, complaints, levels, weakest, catalog);

    const response = await openrouter({
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
      max_tokens: 1400,
      temperature: 0.55,
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
