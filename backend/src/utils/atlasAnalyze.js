// Общая логика для /playground/analyze и /atlas/submit:
// принимаем ответы анкеты, строим промпт, вызываем gpt-4o через OpenRouter,
// кешируем ответ на диск.
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const CACHE_DIR = path.join(__dirname, '../../.cache/atlas');
try { fs.mkdirSync(CACHE_DIR, { recursive: true }); } catch {}

// Поднимаем версию при смене модели или промпта — автоматически инвалидирует кеш
const AI_VERSION = 'claude-sonnet-4-6-v2-utf8';

const ZONE_LABELS = {
  brain:       'Сон и нервная система',
  thyroid:     'Энергия и щитовидка',
  gut:         'ЖКТ и пищеварение',
  hormones:    'Гормоны и цикл',
  composition: 'Композиция тела',
};

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
        'X-Title': 'V Forme Atlas',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(opts, res => {
      res.setEncoding('utf8');
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function cacheKey(payload) {
  const stable = JSON.stringify(payload, Object.keys(payload).sort());
  return crypto.createHash('sha256').update(stable).digest('hex');
}
function cacheGet(key) {
  try {
    const file = path.join(CACHE_DIR, `${key}.json`);
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch { return null; }
}
function cacheSet(key, value) {
  try { fs.writeFileSync(path.join(CACHE_DIR, `${key}.json`), JSON.stringify(value)); } catch {}
}

async function loadCatalog() {
  const Program = require('../models/Program');
  const Protocol = require('../models/Protocol');
  const Module = require('../models/Module');
  const [programs, protocols] = await Promise.all([
    Program.findAll({ where: { available: true }, order: [['order', 'ASC']] }).catch(() => []),
    Protocol.findAll({ where: { available: true }, order: [['order', 'ASC']] }).catch(() => []),
  ]);

  const enrichProgram = async (p) => {
    try {
      const modules = await Module.findAll({ where: { programId: p.id }, order: [['order', 'ASC']], limit: 5 });
      const moduleTitles = modules.map(m => m.title).filter(Boolean).join(' · ');
      return { title: p.title, kind: 'program', price: Number(p.price) || 0,
               desc: (p.desc || '').slice(0, 240), modules: moduleTitles.slice(0, 280) };
    } catch {
      return { title: p.title, kind: 'program', price: Number(p.price) || 0, desc: (p.desc || '').slice(0, 240), modules: '' };
    }
  };

  const enrichedPrograms = await Promise.all(programs.map(enrichProgram));
  const enrichedProtocols = protocols.map(p => ({
    title: p.title, kind: 'protocol', price: Number(p.price) || 0,
    desc: (p.description || '').slice(0, 240), modules: '',
  }));
  return [...enrichedPrograms, ...enrichedProtocols];
}

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
1. Процитируй минимум 3 конкретных цифры или выбранных варианта из ответов.
${hasComplaint ? '2. ОБЯЗАТЕЛЬНО отреагируй отдельным предложением на то что клиент написал в свободной форме. Перефразируй или упомяни его слова — чтобы он видел что ты это прочитала.' : '2. Если жалобы нет — сделай акцент на самой слабой зоне.'}
3. Свяжи ответы причинно: покажи как одно влияет на другое.
4. Назови конкретную зону (одну) с которой разумно начать, и объясни почему именно она.
5. Рекомендации (recommendedTitles): читай ОПИСАНИЕ и СОСТАВ каждой программы/протокола и выбирай ТОЛЬКО те, что реально попадают в озвученные проблемы. Приоритет — бесплатные (их первыми), дальше платные. Если ничего не подходит — лучше меньше, но точных.
6. В конце — одна строка со ссылкой на подборку: "Ниже я собрала для тебя — начни с ...".

Формат: 3–4 короткие абзаца, живой тон, ${addr}. Без диагнозов и медицинских терминов.

Верни строго JSON без markdown:
{
  "message": "текст с \\n\\n между абзацами",
  "focusZoneIds": ["brain", "gut"],
  "recommendedTitles": ["точный заголовок 1", "точный заголовок 2"]
}

Доступные зоны: brain, thyroid, gut, hormones, composition.`;
}

/**
 * Анализирует ответы через gpt-4o, с дисковым кешем.
 * @returns {Promise<{message, focusZoneIds, recommendedTitles, weakest, cached}>}
 */
async function analyzeAnswers({ answers = {}, complaints = '', levels = {} }) {
  const key = cacheKey({ v: AI_VERSION, answers, complaints: (complaints || '').trim(), levels });
  const cached = cacheGet(key);
  if (cached) return { ...cached, cached: true };

  const weakest = Object.entries(levels)
    .map(([id, level]) => ({ id, level }))
    .sort((a, b) => a.level - b.level)
    .slice(0, 3);

  const catalog = await loadCatalog();

  const systemPrompt = `Ты — Кристина Виноградова, нутрициолог и эксперт по здоровью. Общаешься тёплым дружелюбным тоном, на "ты". Твоя задача — коротко поддержать клиента и направить его к конкретным продуктам из нашего каталога. Без диагнозов, без лекарств. Отвечай строго в формате JSON.`;
  const userPrompt = buildUserPrompt(answers, complaints, levels, weakest, catalog);

  const response = await openrouter({
    model: 'anthropic/claude-sonnet-4.6',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt },
    ],
    max_tokens: 1800,
    temperature: 0.6,
  });

  const raw = response.choices?.[0]?.message?.content;
  if (!raw) throw new Error('Нейросеть не вернула ответ');

  // Claude иногда оборачивает JSON в ```json ... ``` или добавляет текст до/после.
  // Вытаскиваем первую валидную JSON-структуру.
  let parsed;
  try {
    let cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleaned = cleaned.slice(firstBrace, lastBrace + 1);
    }
    parsed = JSON.parse(cleaned);
  } catch (e) {
    console.error('Atlas JSON parse failed, raw:', raw.slice(0, 500));
    parsed = { message: raw, focusZoneIds: [weakest[0]?.id].filter(Boolean), recommendedTitles: [] };
  }

  const result = {
    message: parsed.message || '',
    focusZoneIds: Array.isArray(parsed.focusZoneIds) ? parsed.focusZoneIds : [weakest[0]?.id].filter(Boolean),
    recommendedTitles: Array.isArray(parsed.recommendedTitles) ? parsed.recommendedTitles : [],
    weakest,
  };
  cacheSet(key, result);
  return result;
}

module.exports = { analyzeAnswers, loadCatalog, ZONE_LABELS };
