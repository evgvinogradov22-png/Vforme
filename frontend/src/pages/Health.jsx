import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
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

const KIND_LABELS = {
  program:  'ПРОГРАММА',
  protocol: 'ПРОТОКОЛ',
  scheme:   'СХЕМА БАД',
};

// ─── Карточка ────────────────────────────────────────────────
function FeedCard({ item, onClick }) {
  const free = Number(item.price) === 0;
  const kindLabel = KIND_LABELS[item.kind] || 'ПРОДУКТ';

  return (
    <div onClick={onClick} style={{
      background: W, border: `1px solid ${BD}`, borderRadius: 20,
      padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10,
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
      cursor: 'pointer',
      transition: 'transform .12s, box-shadow .12s',
    }}
      onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.99)'; }}
      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {/* Тип слева, цена справа */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: 1, fontFamily: sans,
          color: F_TXT_ACT,
          background: F_BG,
          border: `1px solid ${F_BD}`,
          padding: '6px 12px', borderRadius: 10,
        }}>{kindLabel}</div>
        <div style={{
          fontSize: 14, fontWeight: 700, fontFamily: sans,
          color: F_TXT_ACT,
          background: F_BG_ACT,
          border: `1px solid ${F_BD}`,
          padding: '6px 14px', borderRadius: 10,
        }}>
          {free ? 'БЕСПЛАТНО' : `${item.price} ₽`}
        </div>
      </div>

      <div style={{ fontSize: 19, fontWeight: 700, color: INK, fontFamily: serif, lineHeight: 1.3 }}>
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
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

// ─── Модалка с деталями продукта ─────────────────────────────
function DetailModal({ item, user, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openLecture, setOpenLecture] = useState(null);
  const [payUrl, setPayUrl] = useState(null);
  const [payLoading, setPayLoading] = useState(false);

  // Проверка доступа: бесплатно ИЛИ программа уже куплена
  const free = Number(item.price) === 0;
  const programAccess = user?.programAccess || [];
  const ownedProgram = item.kind === 'program' && programAccess.includes(item.id);
  const ownedProtocol = item.kind === 'protocol' && data?.hasAccess;
  const hasAccess = free || ownedProgram || ownedProtocol || item.kind === 'scheme';

  useEffect(() => {
    let url = '';
    if (item.kind === 'program')  url = `/api/programs/${item.id}`;
    if (item.kind === 'protocol') url = `/api/protocols/${item.id}`;
    if (item.kind === 'scheme')   url = `/api/supplements/schemes/${item.id}`;
    fetch(url, { headers: { Authorization: 'Bearer ' + TOKEN() } })
      .then(r => r.json())
      .then(d => setData(d && !d.error ? d : item))
      .catch(() => setData(item))
      .finally(() => setLoading(false));
  }, [item]);

  const handlePay = async () => {
    setPayLoading(true);
    try {
      const endpoint = item.kind === 'protocol' ? '/api/payment/create-protocol' : '/api/payment/create';
      const body = item.kind === 'protocol' ? { protocolId: item.id } : { programId: item.id };
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKEN() },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (d?.payUrl) setPayUrl(d.payUrl);
      else alert('Не удалось получить ссылку на оплату');
    } catch (e) {
      alert('Ошибка: ' + e.message);
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(26,26,26,0.6)',
      zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      animation: 'fadein .2s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: W, width: '100%', maxWidth: 480,
        borderRadius: '24px 24px 0 0', padding: '24px 22px max(40px, env(safe-area-inset-bottom))',
        maxHeight: '90vh', overflowY: 'auto',
        animation: 'slideup .25s ease',
      }}>
        <div style={{ width: 40, height: 4, background: '#E5E1D8', borderRadius: 2, margin: '0 auto 18px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 1, fontFamily: sans,
            color: F_TXT_ACT, background: F_BG, border: `1px solid ${F_BD}`,
            padding: '6px 12px', borderRadius: 10, alignSelf: 'flex-start',
          }}>{KIND_LABELS[item.kind]}</div>
          <div style={{
            fontSize: 14, fontWeight: 700, fontFamily: sans,
            color: F_TXT_ACT, background: F_BG_ACT, border: `1px solid ${F_BD}`,
            padding: '6px 14px', borderRadius: 10, alignSelf: 'flex-start',
          }}>
            {free ? 'БЕСПЛАТНО' : `${item.price} ₽`}
          </div>
        </div>

        <div style={{ fontFamily: serif, fontSize: 24, fontWeight: 700, color: INK, lineHeight: 1.25, marginBottom: 8 }}>
          {item.title}
        </div>
        {item.subtitle && (
          <div style={{ fontSize: 14, color: INK3, fontFamily: sans, marginBottom: 14 }}>{item.subtitle}</div>
        )}

        {item.tags && item.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
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

        {loading && <div style={{ padding: 30, textAlign: 'center' }}><Spinner /></div>}

        {/* Платный продукт без доступа — Paywall */}
        {!loading && data && !hasAccess && (
          <div>
            {(data.desc || data.description || item.desc) && (
              <div style={{ fontSize: 14, color: INK2, lineHeight: 1.55, fontFamily: sans, marginBottom: 18, whiteSpace: 'pre-wrap' }}>
                {data.desc || data.description || item.desc}
              </div>
            )}

            {payUrl ? (
              <div style={{ width: '100%', height: 540, borderRadius: 16, overflow: 'hidden', border: `1px solid ${BD}` }}>
                <iframe src={payUrl} style={{ width: '100%', height: '100%', border: 'none' }} allow="payment" />
              </div>
            ) : (
              <button onClick={handlePay} disabled={payLoading} style={{
                width: '100%', padding: '18px', background: GOLD, border: 'none', borderRadius: 28,
                color: W, fontFamily: sans, fontWeight: 700, fontSize: 16, cursor: 'pointer', letterSpacing: 1,
                marginTop: 8,
              }}>
                {payLoading ? 'Загрузка…' : `ОПЛАТИТЬ ${item.price} ₽`}
              </button>
            )}
          </div>
        )}

        {/* Бесплатный или купленный — открываем контент */}
        {!loading && data && hasAccess && item.kind === 'program' && (
          <div>
            {data.desc && (
              <div style={{ fontSize: 14, color: INK2, lineHeight: 1.55, fontFamily: sans, marginBottom: 18, whiteSpace: 'pre-wrap' }}>
                {data.desc}
              </div>
            )}
            {data.modules && data.modules.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: INK3, letterSpacing: 1, marginBottom: 10, fontFamily: sans }}>
                  СОДЕРЖИМОЕ
                </div>
                {data.modules.map((m, i) => (
                  <div key={m.id || i} style={{ marginBottom: 14 }}>
                    <div style={{ fontFamily: serif, fontSize: 16, fontWeight: 700, color: INK, marginBottom: 6 }}>
                      {i + 1}. {m.title}
                    </div>
                    {m.lectures && m.lectures.length > 0 && (
                      <div style={{ paddingLeft: 0 }}>
                        {m.lectures.map((l, j) => (
                          <button
                            key={l.id || j}
                            onClick={() => setOpenLecture(l)}
                            style={{
                              width: '100%', textAlign: 'left',
                              background: '#F9F7F4', border: `1px solid ${BD}`, borderRadius: 12,
                              padding: '12px 14px', marginBottom: 6, cursor: 'pointer',
                              fontSize: 13, color: INK, fontFamily: sans,
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            }}>
                            <span>📖 {l.title}</span>
                            <span style={{ color: INK3 }}>›</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && data && hasAccess && item.kind === 'protocol' && (
          <div>
            {data.description && (
              <div style={{ fontSize: 14, color: INK2, lineHeight: 1.55, fontFamily: sans, marginBottom: 14, whiteSpace: 'pre-wrap' }}>
                {data.description}
              </div>
            )}
            {data.content?.html && (
              <div style={{ fontSize: 14, color: INK, lineHeight: 1.6, fontFamily: sans }}
                   dangerouslySetInnerHTML={{ __html: data.content.html }} />
            )}
          </div>
        )}

        {!loading && data && hasAccess && item.kind === 'scheme' && (
          <div>
            {data.desc && (
              <div style={{ fontSize: 14, color: INK2, lineHeight: 1.55, fontFamily: sans, marginBottom: 14 }}>
                {data.desc}
              </div>
            )}
            {data.items && data.items.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: INK3, letterSpacing: 1, marginBottom: 10, fontFamily: sans }}>
                  СОСТАВ
                </div>
                {data.items.map((s, i) => (
                  <div key={s.id || i} style={{
                    background: '#F9F7F4', borderRadius: 12, padding: '12px 14px', marginBottom: 8,
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: INK, fontFamily: sans }}>{s.name}</div>
                    {s.desc && <div style={{ fontSize: 12, color: INK3, marginTop: 2, fontFamily: sans }}>{s.desc}</div>}
                    {s.link && <a href={s.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: G, fontFamily: sans, marginTop: 4, display: 'inline-block' }}>Купить ↗</a>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <button onClick={onClose} style={{
          width: '100%', padding: '14px', marginTop: 22,
          background: 'transparent', border: `1.5px solid ${BD}`, borderRadius: 22,
          color: INK2, fontFamily: sans, fontWeight: 600, fontSize: 14, cursor: 'pointer',
        }}>Закрыть</button>

        {/* Подмодалка лекции */}
        {openLecture && (
          <div onClick={() => setOpenLecture(null)} style={{
            position: 'fixed', inset: 0, background: 'rgba(26,26,26,0.7)',
            zIndex: 600, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}>
            <div onClick={e => e.stopPropagation()} style={{
              background: W, width: '100%', maxWidth: 480,
              borderRadius: '24px 24px 0 0', padding: '24px 22px max(40px, env(safe-area-inset-bottom))',
              maxHeight: '92vh', overflowY: 'auto',
            }}>
              <div style={{ width: 40, height: 4, background: '#E5E1D8', borderRadius: 2, margin: '0 auto 18px' }} />
              <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 700, color: INK, marginBottom: 14, lineHeight: 1.25 }}>
                {openLecture.title}
              </div>
              {openLecture.videoUrl && (
                <div style={{ marginBottom: 14, borderRadius: 12, overflow: 'hidden', background: '#000' }}>
                  <video src={openLecture.videoUrl} controls style={{ width: '100%', display: 'block' }} />
                </div>
              )}
              {openLecture.content && (
                <div style={{ fontSize: 14, color: INK, lineHeight: 1.6, fontFamily: sans }}
                     dangerouslySetInnerHTML={{ __html: openLecture.content }} />
              )}
              <button onClick={() => setOpenLecture(null)} style={{
                width: '100%', padding: '14px', marginTop: 22,
                background: 'transparent', border: `1.5px solid ${BD}`, borderRadius: 22,
                color: INK2, fontFamily: sans, fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}>Закрыть</button>
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes fadein  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideup { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
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
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kindFilter, setKindFilter] = useState([]); // multi
  const [onlyFree, setOnlyFree] = useState(false);  // checkbox
  const [tagFilter, setTagFilter] = useState([]);   // multi
  const [openItem, setOpenItem] = useState(null);   // модалка

  useEffect(() => {
    fetch('/api/health/feed', { headers: { Authorization: 'Bearer ' + TOKEN() } })
      .then(r => r.json())
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return items.filter(it => {
      if (kindFilter.length > 0 && !kindFilter.includes(it.kind)) return false;
      if (onlyFree && Number(it.price) > 0) return false;
      if (tagFilter.length > 0 && !tagFilter.some(t => (it.tags || []).includes(t))) return false;
      return true;
    });
  }, [items, kindFilter, onlyFree, tagFilter]);

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
      <div style={{ padding: '8px 20px 14px', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <FilterDropdown
          label="Тип" options={KIND_OPTIONS}
          selected={kindFilter} multi={true}
          onChange={setKindFilter}
        />
        <FilterDropdown
          label="Зоны" options={TAG_OPTIONS}
          selected={tagFilter} multi={true}
          onChange={setTagFilter}
        />

        {/* Чекбокс «Бесплатно» */}
        <button onClick={() => setOnlyFree(v => !v)} style={{
          padding: '9px 16px', borderRadius: 22,
          background: onlyFree ? F_BG_ACT : F_BG,
          color: onlyFree ? F_TXT_ACT : F_TXT,
          border: `1px solid ${F_BD}`,
          fontFamily: sans, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{
            width: 18, height: 18, borderRadius: 5,
            border: `1.5px solid ${onlyFree ? G : F_BD}`,
            background: onlyFree ? G : W,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {onlyFree && <span style={{ color: W, fontSize: 12, lineHeight: 1 }}>✓</span>}
          </span>
          Бесплатно
        </button>
      </div>

      {/* Лента */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading && <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: INK3, fontSize: 14, fontFamily: sans }}>
            В этом фильтре пока ничего нет
          </div>
        )}
        {!loading && filtered.map(item => (
          <FeedCard
            key={`${item.kind}-${item.id}`}
            item={item}
            onClick={() => setOpenItem(item)}
          />
        ))}
      </div>

      {openItem && <DetailModal item={openItem} user={user} onClose={() => setOpenItem(null)} />}
    </div>
  );
}
