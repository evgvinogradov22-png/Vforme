import { useState, useEffect, useMemo } from 'react';
import {
  ZONES, QUESTIONS, computeLevels,
  BalanceWheel, ZoneSheet, ContentCard, Onboarding,
} from './Playground';
import { G, GL, GLL, GOLD, BD, INK, INK2, INK3, W, sans, serif } from '../utils/theme';

const TOKEN = () => localStorage.getItem('vforme_token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKEN() });

// ─── Главный экран вкладки Атлас ─────────────────────────────
function AtlasMain({ result, onRetake, onGoChat }) {
  const [zoneOpen, setZoneOpen] = useState(null);
  const [content, setContent] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch('/api/atlas/content', { headers: authHeaders() })
      .then(r => r.json())
      .then(items => Array.isArray(items) && setContent(items))
      .catch(() => {});
  }, []);

  const focusZoneId = result.focusZoneIds?.[0]
    || [...Object.entries(result.levels || {})].sort((a, b) => a[1] - b[1])[0]?.[0];
  const focusZone = ZONES.find(z => z.id === focusZoneId);

  const recommended = useMemo(() => {
    if (!content.length) return [];
    const byFree = (a, b) => (Number(a.price) || 0) - (Number(b.price) || 0);
    const titles = (result.recommendedTitles || []).map(t => t.toLowerCase());
    if (!titles.length) return [...content].sort(byFree);
    const matched = content.filter(c => titles.some(t =>
      c.title?.toLowerCase().includes(t) || t.includes(c.title?.toLowerCase() || '')
    ));
    const rest = content.filter(c => !matched.includes(c));
    return [...matched.sort(byFree), ...rest.sort(byFree)];
  }, [result, content]);

  const filtered = recommended.filter(it => {
    if (filter === 'free') return Number(it.price) === 0;
    if (filter === 'paid') return Number(it.price) > 0;
    return true;
  });

  const contentWithZones = useMemo(() => {
    const KW = {
      brain: ['сон', 'нерв', 'стресс', 'успоко', 'медит', 'голов'],
      thyroid: ['энерги', 'щитовидк', 'митохон', 'усталост'],
      gut: ['жкт', 'кишеч', 'желуд', 'вздут', 'пищеварен', 'детокс', 'печен'],
      hormones: ['гормон', 'цикл', 'менстр', 'репродук', 'женск', 'кож'],
      composition: ['тело', 'компози', 'мышц', 'вес', 'стройн', 'жир', 'активн'],
    };
    return content.map(it => {
      const t = `${it.title || ''} ${it.desc || ''}`.toLowerCase();
      const zones = Object.entries(KW).filter(([, kws]) => kws.some(k => t.includes(k))).map(([z]) => z);
      return { ...it, zones: zones.length ? zones : ['composition'] };
    });
  }, [content]);

  return (
    <div style={{ background: '#F9F7F4', paddingBottom: 30 }}>
      {/* Колесо */}
      <div style={{ padding: '10px 4px 0', maxWidth: 600, margin: '0 auto' }}>
        <BalanceWheel levels={result.levels || {}} focusId={focusZoneId} onZoneClick={z => setZoneOpen(z)} />
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
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
            }}>
              <img src="/img/kristina.jpg" alt="Кристина"
                   onError={e => { e.currentTarget.style.display = 'none'; }}
                   style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <div style={{ fontFamily: serif, fontSize: 15, fontWeight: 700, color: INK }}>Кристина Виноградова</div>
              <div style={{ fontSize: 11, color: INK3, fontFamily: sans }}>нутрициолог · персональный ответ</div>
            </div>
          </div>

          <div style={{ fontFamily: sans, fontSize: 14, color: INK, lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 14 }}>
            {result.message || '—'}
          </div>

          <button onClick={onGoChat} style={{
            width: '100%', textAlign: 'center',
            padding: '13px', background: G, border: 'none', borderRadius: 22,
            color: W, fontFamily: sans, fontWeight: 700, fontSize: 14, cursor: 'pointer',
            letterSpacing: 0.5,
          }}>💬 Ответить Кристине</button>
        </div>
      </div>

      {/* Рекомендации */}
      {recommended.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ padding: '0 20px', marginBottom: 12 }}>
            <div style={{ fontFamily: serif, fontSize: 18, fontWeight: 700, color: INK }}>Рекомендуем начать</div>
          </div>

          <div style={{ padding: '0 20px', marginBottom: 14, display: 'flex', gap: 8 }}>
            {[{ id: 'all', label: 'Всё' }, { id: 'free', label: 'Бесплатные' }, { id: 'paid', label: 'Платные' }].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)} style={{
                padding: '8px 16px', borderRadius: 18,
                background: filter === f.id ? G : W,
                color: filter === f.id ? W : INK2,
                border: `1px solid ${filter === f.id ? G : BD}`,
                fontFamily: sans, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>{f.label}</button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 20px 20px' }}>
            {filtered.length === 0 && (
              <div style={{ fontSize: 13, color: INK3, fontFamily: sans, padding: '12px 0', textAlign: 'center' }}>
                В этом фильтре пока ничего нет
              </div>
            )}
            {filtered.map(item => <ContentCard key={item.id} item={item} />)}
          </div>
        </div>
      )}

      <div style={{ padding: '12px 20px 10px' }}>
        <button onClick={onRetake} style={{
          width: '100%', padding: '16px',
          background: 'transparent', border: `1.5px solid ${BD}`, borderRadius: 24,
          color: INK2, fontFamily: sans, fontWeight: 600, fontSize: 14, cursor: 'pointer',
        }}>↺ Пройти анкету заново</button>
      </div>

      {zoneOpen && (
        <ZoneSheet
          zone={zoneOpen}
          level={result.levels?.[zoneOpen.id] ?? 0}
          content={contentWithZones}
          onClose={() => setZoneOpen(null)}
        />
      )}
    </div>
  );
}

// ─── Корневой компонент вкладки Атлас ────────────────────────
export default function Atlas({ onGoChat }) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);      // последний результат из БД
  const [retaking, setRetaking] = useState(false); // режим прохождения анкеты
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/atlas/me', { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(data => setResult(data || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (answers, complaints) => {
    setSubmitting(true);
    const levels = computeLevels(answers);
    try {
      const r = await fetch('/api/atlas/submit', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ answers, complaints, levels }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || 'Ошибка сервера');
      setResult(data);
      setRetaking(false);
    } catch (e) {
      alert('Не удалось сохранить: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: INK3, fontFamily: sans }}>
        Загружаю твой атлас…
      </div>
    );
  }

  if (submitting) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <div style={{ fontFamily: serif, fontSize: 20, color: INK, marginBottom: 10 }}>Кристина изучает твою анкету…</div>
        <div style={{ fontFamily: sans, fontSize: 13, color: INK3 }}>Это займёт 5–10 секунд</div>
      </div>
    );
  }

  if (!result || retaking) {
    return <Onboarding onDone={handleSubmit} />;
  }

  return (
    <AtlasMain
      result={result}
      onRetake={() => setRetaking(true)}
      onGoChat={onGoChat}
    />
  );
}
