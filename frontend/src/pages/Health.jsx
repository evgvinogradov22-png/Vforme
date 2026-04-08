import { useState, useEffect, useMemo, useRef } from 'react';
import { G, GL, GLL, GOLD, GOLDD, BD, INK, INK2, INK3, W, sans, serif } from '../utils/theme';
import { Spinner } from '../components/UI';

const TOKEN = () => localStorage.getItem('vforme_token');

// Бежевая палитра для фильтров
const F_BG     = '#F3EFE6';
const F_BG_ACT = '#E8DDC0';
const F_BD     = '#D9D2C0';
const F_TXT    = '#5A4D34';
const F_TXT_ACT = '#3D3217';

const TAG_OPTIONS = [
  { id: 'brain',       label: 'Сон и нервы', icon: '🧠' },
  { id: 'thyroid',     label: 'Энергия',     icon: '⚡' },
  { id: 'gut',         label: 'ЖКТ',         icon: '🍽️' },
  { id: 'hormones',    label: 'Гормоны',     icon: '🌸' },
  { id: 'composition', label: 'Тело',        icon: '💪' },
];

const KIND_OPTIONS = [
  { id: 'program',  label: 'Программы' },
  { id: 'protocol', label: 'Протоколы' },
  { id: 'scheme',   label: 'Схемы БАД' },
];

const PRICE_OPTIONS = [
  { id: 'free', label: 'Бесплатно' },
  { id: 'paid', label: 'Платно' },
];

const KIND_LABELS = {
  program:  { label: 'ПРОГРАММА', color: G },
  protocol: { label: 'ПРОТОКОЛ',  color: GOLDD },
  scheme:   { label: 'СХЕМА БАД', color: '#7E4EB8' },
};

// ─── Карточка ────────────────────────────────────────────────
function FeedCard({ item }) {
  const free = Number(item.price) === 0;
  const kind = KIND_LABELS[item.kind] || { label: 'ПРОДУКТ', color: INK2 };

  return (
    <div style={{
      background: W, border: `1px solid ${BD}`, borderRadius: 20,
      padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 8,
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: 1, fontFamily: sans,
          color: kind.color,
          background: kind.color + '15',
          padding: '5px 11px', borderRadius: 8,
        }}>{kind.label}</div>
        <div style={{
          fontSize: 13, fontWeight: 700, fontFamily: sans,
          background: free ? '#E7F0E7' : '#FBF2DB',
          color: free ? G : GOLDD,
          padding: '5px 12px', borderRadius: 8,
        }}>
          {free ? 'БЕСПЛАТНО' : `${item.price} ₽`}
        </div>
      </div>

      <div style={{ fontSize: 18, fontWeight: 700, color: INK, fontFamily: serif, lineHeight: 1.3 }}>
        {item.title}
      </div>

      {(item.desc || item.subtitle) && (
        <div style={{
          fontSize: 13, color: INK2, fontFamily: sans,
          lineHeight: 1.45,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {item.subtitle || item.desc}
        </div>
      )}

      {item.tags && item.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
          {item.tags.map(t => {
            const tag = TAG_OPTIONS.find(x => x.id === t);
            if (!tag) return null;
            return (
              <div key={t} style={{
                fontSize: 11, color: F_TXT, fontFamily: sans, fontWeight: 600,
                background: F_BG, border: `1px solid ${F_BD}`,
                padding: '4px 10px', borderRadius: 12,
              }}>
                {tag.icon} {tag.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Дропдаун-фильтр с галочками ─────────────────────────────
function FilterDropdown({ label, options, selected, multi, onChange, anchor }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('touchstart', onDocClick);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('touchstart', onDocClick);
    };
  }, [open]);

  const isAll = multi ? selected.length === 0 : !selected;
  const display = isAll
    ? label
    : multi
      ? `${label} · ${selected.length}`
      : (options.find(o => o.id === selected)?.label || label);

  const toggle = (id) => {
    if (multi) {
      const next = selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id];
      onChange(next);
    } else {
      onChange(selected === id ? null : id);
      setOpen(false);
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        padding: '9px 16px', borderRadius: 22,
        background: isAll ? F_BG : F_BG_ACT,
        color: isAll ? F_TXT : F_TXT_ACT,
        border: `1px solid ${F_BD}`,
        fontFamily: sans, fontSize: 13, fontWeight: 600, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {display}
        <span style={{ fontSize: 10, opacity: 0.6 }}>▼</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)',
          [anchor === 'right' ? 'right' : 'left']: 0,
          background: W, border: `1px solid ${F_BD}`, borderRadius: 14,
          padding: 6, minWidth: 180,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          zIndex: 50,
        }}>
          {options.map(opt => {
            const checked = multi ? selected.includes(opt.id) : selected === opt.id;
            return (
              <button key={opt.id} onClick={() => toggle(opt.id)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10,
                background: checked ? F_BG : 'transparent', border: 'none',
                cursor: 'pointer', textAlign: 'left',
              }}>
                <span style={{
                  width: 18, height: 18, borderRadius: 5,
                  border: `1.5px solid ${checked ? G : F_BD}`,
                  background: checked ? G : W,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {checked && <span style={{ color: W, fontSize: 12, lineHeight: 1 }}>✓</span>}
                </span>
                <span style={{ fontSize: 14, color: INK, fontFamily: sans, fontWeight: checked ? 600 : 500 }}>
                  {opt.icon ? `${opt.icon} ` : ''}{opt.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Главная страница ────────────────────────────────────────
export default function Health() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kindFilter, setKindFilter] = useState(null);    // single
  const [priceFilter, setPriceFilter] = useState(null);  // single
  const [tagFilter, setTagFilter] = useState([]);        // multi

  useEffect(() => {
    fetch('/api/health/feed', { headers: { Authorization: 'Bearer ' + TOKEN() } })
      .then(r => r.json())
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return items.filter(it => {
      if (kindFilter && it.kind !== kindFilter) return false;
      if (priceFilter === 'free' && Number(it.price) > 0) return false;
      if (priceFilter === 'paid' && Number(it.price) === 0) return false;
      if (tagFilter.length > 0 && !tagFilter.some(t => (it.tags || []).includes(t))) return false;
      return true;
    });
  }, [items, kindFilter, priceFilter, tagFilter]);

  return (
    <div style={{
      background: '#F9F7F4',
      minHeight: 'calc(100dvh - 60px)',
      paddingBottom: 100,
    }}>
      {/* Заголовок */}
      <div style={{ padding: '18px 20px 10px' }}>
        <div style={{ fontFamily: serif, fontSize: 26, fontWeight: 700, color: INK }}>Здоровье</div>
        <div style={{ fontSize: 13, color: INK3, fontFamily: sans, marginTop: 2 }}>
          Программы, протоколы и схемы БАДов
        </div>
      </div>

      {/* Фильтры */}
      <div style={{ padding: '8px 20px 14px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <FilterDropdown
          label="Тип" options={KIND_OPTIONS}
          selected={kindFilter} multi={false}
          onChange={setKindFilter}
        />
        <FilterDropdown
          label="Цена" options={PRICE_OPTIONS}
          selected={priceFilter} multi={false}
          onChange={setPriceFilter}
        />
        <FilterDropdown
          label="Зоны" options={TAG_OPTIONS}
          selected={tagFilter} multi={true}
          onChange={setTagFilter}
        />
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
