import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { G, GL, GLL, GOLD, GOLDD, BD, INK, INK2, INK3, W, sans, serif } from '../utils/theme';
import { Spinner } from '../components/UI';

const TOKEN = () => localStorage.getItem('vforme_token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKEN() });

// Бежевая палитра
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

// ─── Шапка страницы (back + метки) ───────────────────────────
function PageHeader({ onBack, kindLabel, statusLabel }) {
  return (
    <div style={{ padding: '14px 18px 6px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <button onClick={onBack} style={{
        background: W, border: `1px solid ${BD}`, borderRadius: 12,
        width: 40, height: 40, fontSize: 18, cursor: 'pointer', color: INK,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>‹</button>
      {kindLabel && (
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: 1, fontFamily: sans,
          color: F_TXT_ACT, background: F_BG, border: `1px solid ${F_BD}`,
          padding: '6px 12px', borderRadius: 10,
        }}>{kindLabel}</div>
      )}
      <div style={{ flex: 1 }} />
      {statusLabel && (
        <div style={{
          fontSize: 14, fontWeight: 700, fontFamily: sans,
          color: F_TXT_ACT, background: F_BG_ACT, border: `1px solid ${F_BD}`,
          padding: '6px 14px', borderRadius: 10,
        }}>{statusLabel}</div>
      )}
    </div>
  );
}

// ─── Cover image (опционально) ───────────────────────────────
function Cover({ src }) {
  if (!src) return null;
  return (
    <div style={{
      width: '100%',
      height: 160,
      backgroundImage: `url(${src})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }} />
  );
}

// ─── Hero (заголовок + теги) ─────────────────────────────────
function Hero({ title, subtitle, tags }) {
  return (
    <div style={{ padding: '14px 22px 8px' }}>
      <div style={{ fontFamily: serif, fontSize: 28, fontWeight: 700, color: INK, lineHeight: 1.2, marginBottom: 6 }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: 14, color: INK3, fontFamily: sans, marginBottom: 10 }}>{subtitle}</div>
      )}
      {tags && tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {tags.map(t => {
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

// ─── Описание без рамки ──────────────────────────────────────
function PlainDesc({ children }) {
  if (!children) return null;
  return (
    <div style={{
      padding: '4px 22px 18px',
      fontSize: 15, color: INK2, lineHeight: 1.65, fontFamily: sans, whiteSpace: 'pre-wrap',
    }}>
      {children}
    </div>
  );
}

// ─── HTML-контент без рамки (для протоколов и лекций) ────────
function PlainHtml({ html }) {
  if (!html) return null;
  return (
    <div style={{
      padding: '4px 22px 18px',
      fontSize: 15, color: INK, lineHeight: 1.65, fontFamily: sans,
    }} dangerouslySetInnerHTML={{ __html: html }} />
  );
}

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
      transition: 'transform .12s',
    }}
      onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.99)'; }}
      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: 1, fontFamily: sans,
          color: F_TXT_ACT, background: F_BG, border: `1px solid ${F_BD}`,
          padding: '6px 12px', borderRadius: 10,
        }}>{kindLabel}</div>
        <div style={{
          fontSize: 14, fontWeight: 700, fontFamily: sans,
          color: F_TXT_ACT, background: F_BG_ACT, border: `1px solid ${F_BD}`,
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

// ─── Дропдаун-фильтр с галочками ─────────────────────────────
function FilterDropdown({ label, options, selected, multi, onChange }) {
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
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
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

// ─── Paywall карточка с iframe ───────────────────────────────
function PaywallCard({ price, payUrl, payLoading, onPay, ctaTitle = 'Открой полный курс', ctaHint = 'После оплаты материалы откроются автоматически' }) {
  return (
    <div style={{
      background: W, border: `1px solid ${BD}`, borderRadius: 18, padding: '20px 18px', marginBottom: 16,
    }}>
      {payUrl ? (
        <div style={{ width: '100%', height: 540, borderRadius: 14, overflow: 'hidden', border: `1px solid ${BD}` }}>
          <iframe src={payUrl} style={{ width: '100%', height: '100%', border: 'none' }} allow="payment" />
        </div>
      ) : (
        <>
          <div style={{ fontFamily: serif, fontSize: 18, fontWeight: 700, color: INK, marginBottom: 6 }}>
            {ctaTitle}
          </div>
          <div style={{ fontSize: 13, color: INK3, fontFamily: sans, marginBottom: 16 }}>
            {ctaHint}
          </div>
          <button onClick={onPay} disabled={payLoading} style={{
            width: '100%', padding: '18px', background: GOLD, border: 'none', borderRadius: 28,
            color: W, fontFamily: sans, fontWeight: 700, fontSize: 16, cursor: 'pointer', letterSpacing: 1,
          }}>
            {payLoading ? 'Загрузка…' : `ОПЛАТИТЬ ${price} ₽`}
          </button>
        </>
      )}
    </div>
  );
}

// ─── Лекция (отдельная страница) ─────────────────────────────
function LecturePage({ lecture, onBack }) {
  return (
    <div style={{ background: '#F9F7F4', minHeight: 'calc(100dvh - 60px)', paddingBottom: 100 }}>
      <PageHeader onBack={onBack} kindLabel="ЛЕКЦИЯ" />
      <div style={{ padding: '14px 22px 8px' }}>
        <div style={{ fontFamily: serif, fontSize: 26, fontWeight: 700, color: INK, lineHeight: 1.2 }}>
          {lecture.title}
        </div>
      </div>
      {lecture.videoUrl && (
        <div style={{ padding: '12px 22px 0' }}>
          <div style={{ borderRadius: 16, overflow: 'hidden', background: '#000' }}>
            <video src={lecture.videoUrl} controls style={{ width: '100%', display: 'block' }} />
          </div>
        </div>
      )}
      <PlainHtml html={lecture.content} />
    </div>
  );
}

// ─── Программа (отдельная страница) ──────────────────────────
function ProgramPage({ program, user, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openLecture, setOpenLecture] = useState(null);
  const [payUrl, setPayUrl] = useState(null);
  const [payLoading, setPayLoading] = useState(false);

  const free = Number(program.price) === 0;
  const owned = (user?.programAccess || []).includes(program.id);
  const hasAccess = free || owned;

  useEffect(() => {
    fetch(`/api/programs/${program.id}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setData(d && !d.error ? d : program))
      .catch(() => setData(program))
      .finally(() => setLoading(false));
  }, [program.id]);

  const handlePay = async () => {
    setPayLoading(true);
    try {
      const r = await fetch('/api/payment/create', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ programId: program.id }),
      });
      const d = await r.json();
      if (d?.payUrl) setPayUrl(d.payUrl);
      else alert('Не удалось получить ссылку на оплату');
    } catch (e) { alert('Ошибка: ' + e.message); }
    finally { setPayLoading(false); }
  };

  if (openLecture) {
    return <LecturePage lecture={openLecture} onBack={() => setOpenLecture(null)} />;
  }

  const status = free ? 'БЕСПЛАТНО' : owned ? 'ОТКРЫТА' : `${program.price} ₽`;

  return (
    <div style={{ background: '#F9F7F4', minHeight: 'calc(100dvh - 60px)', paddingBottom: 100 }}>
      <PageHeader onBack={onBack} kindLabel="ПРОГРАММА" statusLabel={status} />
      <Cover src={data?.coverImage || program.coverImage} />
      <Hero title={program.title} subtitle={program.subtitle} tags={program.tags} />
      <PlainDesc>{data?.desc}</PlainDesc>

      {loading && <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>}

      {!loading && data && (
        <div style={{ padding: '0 22px' }}>
          {!hasAccess && (
            <PaywallCard price={program.price} payUrl={payUrl} payLoading={payLoading} onPay={handlePay} />
          )}

          {hasAccess && data.modules && data.modules.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: INK3, letterSpacing: 1, marginBottom: 12, fontFamily: sans, padding: '0 4px' }}>
                СОДЕРЖИМОЕ
              </div>
              {data.modules.map((m, i) => (
                <div key={m.id || i} style={{
                  background: W, border: `1px solid ${BD}`, borderRadius: 18,
                  padding: '16px 18px', marginBottom: 12,
                }}>
                  <div style={{ fontFamily: serif, fontSize: 17, fontWeight: 700, color: INK, marginBottom: 10 }}>
                    Модуль {i + 1}. {m.title}
                  </div>
                  {m.lectures && m.lectures.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {m.lectures.map((l, j) => (
                        <button
                          key={l.id || j}
                          onClick={() => setOpenLecture(l)}
                          style={{
                            width: '100%', textAlign: 'left',
                            background: '#F9F7F4', border: `1px solid ${BD}`, borderRadius: 12,
                            padding: '12px 14px', cursor: 'pointer',
                            fontSize: 14, color: INK, fontFamily: sans,
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
    </div>
  );
}

// ─── Протокол (отдельная страница) ───────────────────────────
function ProtocolPage({ protocol, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payUrl, setPayUrl] = useState(null);
  const [payLoading, setPayLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/protocols/${protocol.id}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setData(d && !d.error ? d : protocol))
      .catch(() => setData(protocol))
      .finally(() => setLoading(false));
  }, [protocol.id]);

  const free = Number(protocol.price) === 0;
  const hasAccess = free || data?.hasAccess;

  const handlePay = async () => {
    setPayLoading(true);
    try {
      const r = await fetch('/api/payment/create-protocol', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ protocolId: protocol.id }),
      });
      const d = await r.json();
      if (d?.payUrl) setPayUrl(d.payUrl);
      else alert('Не удалось получить ссылку на оплату');
    } catch (e) { alert('Ошибка: ' + e.message); }
    finally { setPayLoading(false); }
  };

  const status = free ? 'БЕСПЛАТНО' : (data?.hasAccess ? 'ОТКРЫТ' : `${protocol.price} ₽`);

  return (
    <div style={{ background: '#F9F7F4', minHeight: 'calc(100dvh - 60px)', paddingBottom: 100 }}>
      <PageHeader onBack={onBack} kindLabel="ПРОТОКОЛ" statusLabel={status} />
      <Cover src={data?.coverImage || protocol.coverImage} />
      <Hero title={protocol.title} subtitle={protocol.subtitle} tags={protocol.tags} />
      <PlainDesc>{data?.description}</PlainDesc>

      {loading && <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>}

      {!loading && data && (
        <>
          {!hasAccess && (
            <div style={{ padding: '0 22px' }}>
              <PaywallCard
                price={protocol.price} payUrl={payUrl} payLoading={payLoading} onPay={handlePay}
                ctaTitle="Получи доступ к протоколу"
                ctaHint="После оплаты материалы откроются автоматически"
              />
            </div>
          )}

          {hasAccess && (
            <>
              <PlainHtml html={data.content?.html} />

              {/* БАДы протокола */}
              {Array.isArray(data.supplements) && data.supplements.length > 0 && (
                <div style={{ padding: '0 22px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: INK3, letterSpacing: 1, marginBottom: 12, fontFamily: sans, padding: '0 4px' }}>
                    БАДы В ПРОТОКОЛЕ
                  </div>
                  {data.supplements.map((s, i) => {
                    const sup = s.supplement || {};
                    return (
                      <div key={i} style={{
                        background: W, border: `1px solid ${BD}`, borderRadius: 16,
                        padding: '14px 16px', marginBottom: 8,
                      }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: INK, fontFamily: sans }}>
                          💊 {sup.name || 'БАД'}
                        </div>
                        {sup.desc && (
                          <div style={{ fontSize: 13, color: INK3, marginTop: 4, fontFamily: sans }}>{sup.desc}</div>
                        )}
                        {s.note && (
                          <div style={{ fontSize: 13, color: INK2, marginTop: 6, fontFamily: sans, fontStyle: 'italic' }}>
                            {s.note}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                          {(s.link || sup.link) && (
                            <a href={s.link || sup.link} target="_blank" rel="noopener noreferrer" style={{
                              fontSize: 13, color: G, fontFamily: sans, fontWeight: 600,
                            }}>Купить ↗</a>
                          )}
                          {s.promo && (
                            <span style={{
                              fontSize: 12, color: GOLDD, fontFamily: sans, fontWeight: 600,
                              background: '#FBF2DB', padding: '2px 8px', borderRadius: 6,
                            }}>Промо: {s.promo}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

// ─── Схема БАД (отдельная страница) ──────────────────────────
function SchemePage({ scheme, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/supplements/schemes/${scheme.id}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setData(d && !d.error ? d : scheme))
      .catch(() => setData(scheme))
      .finally(() => setLoading(false));
  }, [scheme.id]);

  const free = Number(scheme.price) === 0;
  const status = free ? 'БЕСПЛАТНО' : `${scheme.price} ₽`;

  return (
    <div style={{ background: '#F9F7F4', minHeight: 'calc(100dvh - 60px)', paddingBottom: 100 }}>
      <PageHeader onBack={onBack} kindLabel="СХЕМА БАД" statusLabel={status} />
      <Cover src={data?.coverImage || scheme.coverImage} />
      <Hero title={scheme.title} tags={scheme.tags} />
      <PlainDesc>{data?.desc}</PlainDesc>

      {loading && <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>}

      {!loading && data && (
        <div style={{ padding: '0 22px' }}>
          {data.items && data.items.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: INK3, letterSpacing: 1, marginBottom: 12, fontFamily: sans, padding: '0 4px' }}>
                СОСТАВ
              </div>
              {data.items.map((s, i) => (
                <div key={s.id || i} style={{
                  background: W, border: `1px solid ${BD}`, borderRadius: 16,
                  padding: '14px 16px', marginBottom: 8,
                }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: INK, fontFamily: sans }}>{s.name}</div>
                  {s.desc && <div style={{ fontSize: 13, color: INK3, marginTop: 4, fontFamily: sans }}>{s.desc}</div>}
                  {s.link && (
                    <a href={s.link} target="_blank" rel="noopener noreferrer" style={{
                      display: 'inline-block', marginTop: 8,
                      fontSize: 13, color: G, fontFamily: sans, fontWeight: 600,
                    }}>Купить ↗</a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Главная страница Здоровье ───────────────────────────────
export default function Health() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kindFilter, setKindFilter] = useState([]);
  const [onlyFree, setOnlyFree] = useState(false);
  const [tagFilter, setTagFilter] = useState([]);
  const [openProgram, setOpenProgram] = useState(null);
  const [openProtocol, setOpenProtocol] = useState(null);
  const [openScheme, setOpenScheme] = useState(null);

  useEffect(() => {
    fetch('/api/health/feed', { headers: authHeaders() })
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

  // Полноэкранные страницы
  if (openProgram) return <ProgramPage program={openProgram} user={user} onBack={() => setOpenProgram(null)} />;
  if (openProtocol) return <ProtocolPage protocol={openProtocol} onBack={() => setOpenProtocol(null)} />;
  if (openScheme) return <SchemePage scheme={openScheme} onBack={() => setOpenScheme(null)} />;

  const handleOpen = (item) => {
    if (item.kind === 'program')  setOpenProgram(item);
    if (item.kind === 'protocol') setOpenProtocol(item);
    if (item.kind === 'scheme')   setOpenScheme(item);
  };

  return (
    <div style={{
      background: '#F9F7F4',
      minHeight: 'calc(100dvh - 60px)',
      paddingBottom: 100,
    }}>
      <div style={{ padding: '18px 20px 10px' }}>
        <div style={{ fontFamily: serif, fontSize: 26, fontWeight: 700, color: INK }}>Здоровье</div>
        <div style={{ fontSize: 13, color: INK3, fontFamily: sans, marginTop: 2 }}>
          Программы, протоколы и схемы БАДов
        </div>
      </div>

      <div style={{ padding: '8px 20px 14px', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <FilterDropdown label="Тип" options={KIND_OPTIONS} selected={kindFilter} multi={true} onChange={setKindFilter} />
        <FilterDropdown label="Зоны" options={TAG_OPTIONS} selected={tagFilter} multi={true} onChange={setTagFilter} />
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

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading && <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: INK3, fontSize: 14, fontFamily: sans }}>
            В этом фильтре пока ничего нет
          </div>
        )}
        {!loading && filtered.map(item => (
          <FeedCard key={`${item.kind}-${item.id}`} item={item} onClick={() => handleOpen(item)} />
        ))}
      </div>
    </div>
  );
}
