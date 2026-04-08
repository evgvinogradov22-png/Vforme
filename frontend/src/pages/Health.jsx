import { useState, useEffect, useMemo } from 'react';
import { G, GL, GLL, GOLD, GOLDD, BD, INK, INK2, INK3, W, sans, serif } from '../utils/theme';
import { Spinner } from '../components/UI';

const TOKEN = () => localStorage.getItem('vforme_token');

// Тэги зон — те же что в атласе
const TAG_OPTIONS = [
  { id: 'brain',       label: 'Сон и нервы', icon: '🧠' },
  { id: 'thyroid',     label: 'Энергия',     icon: '⚡' },
  { id: 'gut',         label: 'ЖКТ',         icon: '🍽️' },
  { id: 'hormones',    label: 'Гормоны',     icon: '🌸' },
  { id: 'composition', label: 'Тело',        icon: '💪' },
];

const KIND_LABELS = {
  program:  { label: 'ПРОГРАММА', color: G },
  protocol: { label: 'ПРОТОКОЛ',  color: GOLDD },
  scheme:   { label: 'СХЕМА БАД', color: '#7E4EB8' },
};

function FeedCard({ item }) {
  const free = Number(item.price) === 0;
  const kind = KIND_LABELS[item.kind] || { label: 'ПРОДУКТ', color: INK2 };

  return (
    <div style={{
      background: W, border: `1px solid ${BD}`, borderRadius: 20,
      padding: '16px 18px', display: 'flex', gap: 14, alignItems: 'flex-start',
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16, background: GLL,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28, flexShrink: 0,
      }}>
        {item.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
          <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: 1, fontFamily: sans,
            color: kind.color,
          }}>{kind.label}</div>
          <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: 0.5, fontFamily: sans,
            background: free ? '#E7F0E7' : '#FBF2DB',
            color: free ? G : GOLDD,
            padding: '2px 7px', borderRadius: 6,
          }}>
            {free ? 'БЕСПЛАТНО' : `${item.price} ₽`}
          </div>
        </div>

        <div style={{ fontSize: 16, fontWeight: 700, color: INK, fontFamily: serif, lineHeight: 1.3, marginBottom: 3 }}>
          {item.title}
        </div>

        {(item.desc || item.subtitle) && (
          <div style={{
            fontSize: 12, color: INK3, fontFamily: sans, marginBottom: 8,
            lineHeight: 1.4,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {item.subtitle || item.desc}
          </div>
        )}

        {item.tags && item.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
            {item.tags.map(t => {
              const tag = TAG_OPTIONS.find(x => x.id === t);
              if (!tag) return null;
              return (
                <div key={t} style={{
                  fontSize: 10, color: INK2, fontFamily: sans, fontWeight: 600,
                  background: '#F3EFE6', padding: '3px 8px', borderRadius: 10,
                }}>
                  {tag.icon} {tag.label}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Health() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kindFilter, setKindFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');

  useEffect(() => {
    fetch('/api/health/feed', { headers: { Authorization: 'Bearer ' + TOKEN() } })
      .then(r => r.json())
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return items.filter(it => {
      if (kindFilter !== 'all' && it.kind !== kindFilter) return false;
      if (priceFilter === 'free' && Number(it.price) > 0) return false;
      if (priceFilter === 'paid' && Number(it.price) === 0) return false;
      if (tagFilter !== 'all' && !(it.tags || []).includes(tagFilter)) return false;
      return true;
    });
  }, [items, kindFilter, priceFilter, tagFilter]);

  return (
    <div style={{ background: '#F9F7F4', minHeight: '100%', paddingBottom: 40 }}>
      {/* Заголовок */}
      <div style={{ padding: '18px 20px 10px' }}>
        <div style={{ fontFamily: serif, fontSize: 26, fontWeight: 700, color: INK }}>Здоровье</div>
        <div style={{ fontSize: 13, color: INK3, fontFamily: sans, marginTop: 2 }}>
          Программы, протоколы и схемы БАДов
        </div>
      </div>

      {/* Фильтр по типу */}
      <div style={{ padding: '6px 20px 10px', display: 'flex', gap: 8, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {[
          { id: 'all',      label: 'Всё' },
          { id: 'program',  label: 'Программы' },
          { id: 'protocol', label: 'Протоколы' },
          { id: 'scheme',   label: 'Схемы БАД' },
        ].map(f => (
          <button key={f.id} onClick={() => setKindFilter(f.id)} style={{
            padding: '8px 16px', borderRadius: 20, flexShrink: 0,
            background: kindFilter === f.id ? G : W,
            color: kindFilter === f.id ? W : INK2,
            border: `1px solid ${kindFilter === f.id ? G : BD}`,
            fontFamily: sans, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>{f.label}</button>
        ))}
      </div>

      {/* Фильтр по цене */}
      <div style={{ padding: '4px 20px 10px', display: 'flex', gap: 8 }}>
        {[
          { id: 'all',  label: 'Цена: всё' },
          { id: 'free', label: 'Бесплатно' },
          { id: 'paid', label: 'Платно' },
        ].map(f => (
          <button key={f.id} onClick={() => setPriceFilter(f.id)} style={{
            padding: '7px 14px', borderRadius: 18,
            background: priceFilter === f.id ? GOLD : W,
            color: priceFilter === f.id ? W : INK2,
            border: `1px solid ${priceFilter === f.id ? GOLD : BD}`,
            fontFamily: sans, fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>{f.label}</button>
        ))}
      </div>

      {/* Фильтр по тэгу-зоне */}
      <div style={{ padding: '4px 20px 14px', display: 'flex', gap: 8, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <button onClick={() => setTagFilter('all')} style={{
          padding: '7px 14px', borderRadius: 18, flexShrink: 0,
          background: tagFilter === 'all' ? INK : W,
          color: tagFilter === 'all' ? W : INK2,
          border: `1px solid ${tagFilter === 'all' ? INK : BD}`,
          fontFamily: sans, fontSize: 12, fontWeight: 600, cursor: 'pointer',
        }}>Все зоны</button>
        {TAG_OPTIONS.map(t => (
          <button key={t.id} onClick={() => setTagFilter(t.id)} style={{
            padding: '7px 14px', borderRadius: 18, flexShrink: 0,
            background: tagFilter === t.id ? INK : W,
            color: tagFilter === t.id ? W : INK2,
            border: `1px solid ${tagFilter === t.id ? INK : BD}`,
            fontFamily: sans, fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>{t.icon} {t.label}</button>
        ))}
      </div>

      {/* Лента */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading && <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: INK3, fontSize: 14, fontFamily: sans }}>
            В этом фильтре пока ничего нет
          </div>
        )}
        {!loading && filtered.map(item => <FeedCard key={`${item.kind}-${item.id}`} item={item} />)}
      </div>
    </div>
  );
}
