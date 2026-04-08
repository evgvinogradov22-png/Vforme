// Объединённая лента "Здоровье": программы + протоколы + схемы БАДов
const router = require('express').Router();
const Program = require('../models/Program');
const Protocol = require('../models/Protocol');
const SupplementScheme = require('../models/SupplementScheme');
const Supplement = require('../models/Supplement');

// Авто-тэги по ключевым словам, если у записи пусто
const TAG_KEYWORDS = {
  brain:       ['сон', 'нерв', 'стресс', 'успоко', 'медит', 'голов', 'тревож'],
  thyroid:     ['энерги', 'щитовидк', 'митохон', 'усталост', 'вялост'],
  gut:         ['жкт', 'кишеч', 'желуд', 'вздут', 'пищеварен', 'детокс', 'печен'],
  hormones:    ['гормон', 'цикл', 'менстр', 'репродук', 'женск', 'кож', 'мужск'],
  composition: ['тело', 'компози', 'мышц', 'вес', 'стройн', 'жир', 'актив'],
};

function autoTags(title, desc) {
  const t = `${title || ''} ${desc || ''}`.toLowerCase();
  return Object.entries(TAG_KEYWORDS)
    .filter(([, kws]) => kws.some(k => t.includes(k)))
    .map(([z]) => z);
}

function tagsFor(existing, title, desc) {
  if (Array.isArray(existing) && existing.length > 0) return existing;
  return autoTags(title, desc);
}

router.get('/feed', async (req, res) => {
  try {
    const [programs, protocols, schemes] = await Promise.all([
      Program.findAll({ where: { available: true }, order: [['order', 'ASC']] }),
      Protocol.findAll({ where: { available: true }, order: [['order', 'ASC']] }),
      SupplementScheme.findAll({ where: { available: true } }).catch(() => []),
    ]);

    // Для схем подтягиваем количество БАДов внутри
    const schemeItems = schemes.length
      ? await Supplement.findAll({ where: { schemeId: schemes.map(s => s.id) } }).catch(() => [])
      : [];
    const supCount = {};
    schemeItems.forEach(s => { supCount[s.schemeId] = (supCount[s.schemeId] || 0) + 1; });

    const items = [
      ...programs.map(p => ({
        id: p.id, kind: 'program',
        title: p.title, subtitle: p.subtitle || '', desc: p.desc || '',
        icon: p.icon || '📚', color: p.color || null,
        coverImage: p.coverImage || null,
        price: Number(p.price) || 0,
        tags: tagsFor(p.tags, p.title, p.desc),
        meta: '',
      })),
      ...protocols.map(p => ({
        id: p.id, kind: 'protocol',
        title: p.title, subtitle: '', desc: p.description || '',
        icon: '📋', color: null,
        coverImage: p.coverImage || null,
        price: Number(p.price) || 0,
        tags: tagsFor(p.tags, p.title, p.description),
        meta: '',
      })),
      ...schemes.map(s => ({
        id: s.id, kind: 'scheme',
        title: s.title, subtitle: '', desc: s.desc || '',
        icon: '💊', color: null,
        coverImage: s.coverImage || null,
        price: Number(s.price) || 0,
        tags: tagsFor(s.tags, s.title, s.desc),
        meta: supCount[s.id] ? `${supCount[s.id]} БАДов` : '',
      })),
    ];

    res.json(items);
  } catch (e) {
    console.error('Health feed error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
