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
  const addr = isMale
    ? 'обращайся в МУЖСКОМ роде (ты доволен, ты заметил, ты готов, тебе нужно)'
    : 'обращайся в ЖЕНСКОМ роде (ты довольна, ты заметила, ты готова, тебе нужно)';

  const zonesList = weakest.map(z => `${ZONE_LABELS[z.id] || z.id} (${z.level}%)`).join(', ');
  const levelsAll = Object.entries(levels).map(([k, v]) => `${ZONE_LABELS[k] || k}: ${v}%`).join(', ');

  const catalogList = catalog.length
    ? catalog.map(c => {
        const kind = c.kind === 'program' ? 'программа' : 'протокол';
        const price = Number(c.price) > 0 ? `${c.price} ₽` : 'БЕСПЛАТНО';
        const descLine = c.desc ? `  описание: ${c.desc}` : '';
        const modsLine = c.modules ? `  о чём внутри: ${c.modules}` : '';
        return `- "${c.title}" [${kind}, ${price}]\n${descLine}${descLine && modsLine ? '\n' : ''}${modsLine}`.trimEnd();
      }).join('\n')
    : '(каталог пуст)';

  const hasComplaint = complaints && complaints.trim().length > 2;

  return `Клиент прошёл анкету. Пол: ${voc}. В ответе ${addr}.

Все ответы — ты ОБЯЗАН учесть каждый, ссылаться на конкретные цифры, НЕ обобщать:

- Сон (0 плохо, 10 отлично): ${fmtScale(answers.sleep)}
- Стресс (0 спокойно, 10 сильный ежедневный): ${fmtScale(answers.stress)}
- Энергия (0 нет сил, 10 через край): ${fmtScale(answers.energy)}
- Физическая активность (0 лежит, 10 тренировки 3–5 раз в неделю): ${fmtScale(answers.activity)}
- Кожа (0 плохо, 10 отлично): ${fmtScale(answers.skin)}
- Головные боли / мигрени: ${fmtChoice(answers.headaches)}
- Проблемы с ЖКТ (вздутие, тяжесть): ${fmtChoice(answers.gut)}

${hasComplaint
  ? `⚠️ КЛИЕНТ НАПИСАЛ ЛИЧНУЮ ЖАЛОБУ СВОИМИ СЛОВАМИ — это САМОЕ ВАЖНОЕ в сообщении, отреагируй на каждую упомянутую проблему:\n"""\n${complaints.trim()}\n"""`
  : 'Свободной жалобы нет.'
}

Карта здоровья (уровни ВСЕХ зон): ${levelsAll}.
Самые слабые зоны: ${zonesList}.

Наши программы и протоколы. Для каждой есть описание и состав — ИЗУЧИ их внимательно и выбирай ТО, что РЕАЛЬНО решает озвученные проблемы. Заголовки используй слово-в-слово.

${catalogList}

Напиши персональное сообщение в мессенджере. ЖЁСТКИЕ ТРЕБОВАНИЯ:
1. Процитируй минимум 3 конкретных цифры или выбранных варианта из ответов. Примеры: "сон ты поставила 3/10", "ЖКТ беспокоит часто", "стресс 8 из 10".
${hasComplaint ? '2. ОБЯЗАТЕЛЬНО отреагируй отдельным предложением на то что клиент написал в свободной форме. Прямо перефразируй или упомяни его слова — чтобы он видел что ты это прочитала.' : '2. Если жалобы нет — сделай акцент на самой слабой зоне.'}
3. Свяжи ответы причинно: покажи как одно влияет на другое (стресс 8 → ЖКТ, плохой сон → энергия, и т.п.).
4. Назови конкретную зону (одну) с которой разумно начать, и объясни почему именно она.
5. Рекомендации (recommendedTitles): читай ОПИСАНИЕ и СОСТАВ каждой программы/протокола и выбирай ТОЛЬКО те, что реально попадают в озвученные проблемы. НЕ бери всё подряд. Приоритет — бесплатные программы и протоколы (их предлагай первыми), дальше платные. Если в каталоге ничего не подходит под проблему клиента — лучше верни меньше рекомендаций, но точных.
6. В конце сообщения — одна строка со ссылкой на подборку: "Ниже я собрала для тебя — начни с ...".

Формат: 3–4 короткие абзаца, живой дружелюбный тон, ${addr}. Без диагнозов, без медицинских терминов, без "рекомендую проконсультироваться с врачом".

Верни строго JSON без markdown:
{
  "message": "текст с \\n\\n между абзацами",
  "focusZoneIds": ["brain", "gut"],
  "recommendedTitles": ["точный заголовок 1", "точный заголовок 2", "точный заголовок 3"]
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

    // Подтягиваем каталог доступных программ и протоколов с описаниями
    const Program = require('../models/Program');
    const Protocol = require('../models/Protocol');
    const Module = require('../models/Module');
    const Lecture = require('../models/Lecture');
    const [programs, protocols] = await Promise.all([
      Program.findAll({ where: { available: true }, order: [['order', 'ASC']] }).catch(() => []),
      Protocol.findAll({ where: { available: true }, order: [['order', 'ASC']] }).catch(() => []),
    ]);

    // Для каждой программы подтягиваем первые модули с названиями — даёт контекст чем она наполнена
    const enrichProgram = async (p) => {
      try {
        const modules = await Module.findAll({
          where: { programId: p.id }, order: [['order', 'ASC']], limit: 5,
        });
        const moduleTitles = modules.map(m => m.title).filter(Boolean).join(' · ');
        return {
          title: p.title,
          kind: 'program',
          price: Number(p.price) || 0,
          desc: (p.desc || '').slice(0, 240),
          modules: moduleTitles.slice(0, 280),
        };
      } catch {
        return { title: p.title, kind: 'program', price: Number(p.price) || 0, desc: (p.desc || '').slice(0, 240), modules: '' };
      }
    };

    const enrichedPrograms = await Promise.all(programs.map(enrichProgram));
    const enrichedProtocols = protocols.map(p => ({
      title: p.title,
      kind: 'protocol',
      price: Number(p.price) || 0,
      desc: (p.description || '').slice(0, 240),
      modules: '',
    }));

    const catalog = [...enrichedPrograms, ...enrichedProtocols];

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
