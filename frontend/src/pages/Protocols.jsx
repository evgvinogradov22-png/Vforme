import DOMPurify from 'dompurify';
import { useState, useEffect } from 'react';
import { Spinner, BackHeader } from '../components/UI';
import { G, GL, GLL, GOLD, BD, INK, INK2, INK3, W, RED, sans, serif } from '../utils/theme';

const BASE = '/api';
function getToken() { return localStorage.getItem('vforme_token'); }
async function req(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  return res.json();
}

// ── ПЛАШКА ОПЛАТЫ ────────────────────────────────────────────
function Paywall({ proto, onClose, onPaid }) {
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    try {
      const TOKEN = localStorage.getItem('vforme_token');
      await fetch('/api/payment/create-protocol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
        body: JSON.stringify({ protocolId: proto.id }),
      });
    } catch(e) {}
    if (typeof window.prodamusPay === 'function') {
      window.prodamusPay(proto.price);
      onClose();
    }
  };

  const handleFree = async () => {
    setPaying(true);
    try {
      await req('POST', `/protocols/${proto.id}/access/free`);
      onPaid();
      onClose();
    } catch (e) {} finally { setPaying(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: W, borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 480, padding: '32px 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
          <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 700, color: INK }}>{proto.title}</div>
          {proto.description && <div style={{ fontSize: 14, color: INK2, marginTop: 6 }}>{proto.description}</div>}
        </div>
        <div style={{ background: GLL, borderRadius: 16, padding: '16px 20px', marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontFamily: serif, fontSize: 32, fontWeight: 700, color: G }}>{proto.price} ₽</div>
        </div>
        <button onClick={handlePay}
          style={{ width: '100%', padding: '18px', background: GOLD, border: 'none', borderRadius: 30, color: W, fontFamily: sans, fontWeight: 700, fontSize: 16, cursor: 'pointer', marginBottom: 12, letterSpacing: 1 }}>
          ОПЛАТИТЬ {proto.price} ₽
        </button>
        <button onClick={onClose}
          style={{ width: '100%', padding: '14px', background: 'transparent', border: `1px solid ${BD}`, borderRadius: 30, color: INK2, fontFamily: sans, fontSize: 15, cursor: 'pointer' }}>
          Закрыть
        </button>
      </div>
    </div>
  );
}

// ── СТРАНИЦА ПРОТОКОЛА ────────────────────────────────────────
function ProtocolPage({ proto, onBack, onBuy }) {
  const blur = !proto.hasAccess;

  return (
    <div style={{ fontFamily: sans, background: W, color: INK }}>
      <BackHeader onBack={onBack} title={proto.title} subtitle="ПРОТОКОЛ" color={G} />

      <div style={{ filter: blur ? 'blur(3px)' : 'none', pointerEvents: blur ? 'none' : 'auto', userSelect: blur ? 'none' : 'auto' }}>

        {/* КАРТИНКИ */}
        {proto.content?.images?.length > 0 && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '16px 20px 0', scrollbarWidth: 'none' }}>
            {proto.content.images.map((img, i) => (
              <img key={i} src={img} alt="" style={{ height: 200, borderRadius: 16, flexShrink: 0, objectFit: 'cover' }} />
            ))}
          </div>
        )}

        {/* КОНТЕНТ */}
        {proto.content?.html && (
          <div style={{ padding: '24px 20px' }}>
            <div style={{ fontSize: 11, color: INK3, letterSpacing: 1.5, fontWeight: 700, marginBottom: 16 }}>ОПИСАНИЕ</div>
            <style>{`
              .protocol-content h1 { font-size: 24px; font-weight: 700; margin: 20px 0 10px; color: ${G}; font-family: Georgia, serif; line-height: 1.3; }
              .protocol-content h2 { font-size: 20px; font-weight: 700; margin: 16px 0 8px; color: ${G}; font-family: Georgia, serif; }
              .protocol-content blockquote { border-left: 4px solid ${G}; margin: 12px 0; padding: 12px 16px; background: #EBF0EB; border-radius: 0 12px 12px 0; color: ${G}; font-style: italic; line-height: 1.6; }
              .protocol-content ul, .protocol-content ol { padding-left: 20px; margin: 8px 0; }
              .protocol-content li { margin: 4px 0 !important; line-height: 1.7 !important; font-size: 17px !important; padding: 0 !important; }
              .protocol-content p { margin: 0 0 12px !important; line-height: 1.8 !important; font-size: 17px !important; color: #1A1A1A; }
              .protocol-content strong { font-weight: 700; }
              .protocol-content em { font-style: italic; }
            `}</style>
            <div className="protocol-content" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(proto.content?.html || '') }} />
          </div>
        )}

        {/* БАДЫ */}
        {proto.supplements?.length > 0 && (
          <div style={{ padding: '0 20px 40px' }}>
            <div style={{ fontSize: 11, color: INK3, letterSpacing: 1.5, fontWeight: 700, marginBottom: 16 }}>РЕКОМЕНДОВАННЫЕ БАДЫ</div>
            {proto.supplements.map((s, i) => (
              <div key={i} style={{ border: `1px solid ${BD}`, borderRadius: 16, padding: '16px', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  {(s.image || s.supplement?.image) && (
                    <img src={s.image || s.supplement?.image} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 12, border: `1px solid ${BD}`, flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: INK, marginBottom: 2 }}>
                      {s.name || s.supplement?.name || 'БАД'}
                    </div>
                    {(s.brand || s.supplement?.brand) && (
                      <div style={{ fontSize: 12, color: INK3, marginBottom: 4 }}>{s.brand || s.supplement?.brand}</div>
                    )}
                    {s.note && (
                      <div style={{ fontSize: 13, color: INK2, lineHeight: 1.5, marginBottom: 4 }}>{s.note}</div>
                    )}
                    {s.promo && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <div style={{ fontSize: 11, color: INK3 }}>Промокод:</div>
                        <div onClick={() => { navigator.clipboard.writeText(s.promo); }}
                          style={{ background: GLL, border: `1px dashed ${G}`, borderRadius: 6, padding: '2px 10px', fontSize: 12, fontWeight: 700, color: G, letterSpacing: 1, cursor: 'pointer', userSelect: 'none' }}
                          title="Нажми чтобы скопировать">
                          {s.promo} 📋
                        </div>
                      </div>
                    )}
                  </div>
                  {s.link && (
                    <a href={s.link} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: G, color: W, width: 44, height: 44, borderRadius: '50%', fontSize: 18, textDecoration: 'none', flexShrink: 0 }}>
                      →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PAYWALL */}
      {blur && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
          <div style={{ background: W, borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 480, padding: '28px 24px 80px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
            <div style={{ fontFamily: serif, fontSize: 20, fontWeight: 700, color: INK, marginBottom: 6 }}>Получи доступ</div>
            <div style={{ fontSize: 14, color: INK2, marginBottom: 20 }}>Чтобы просматривать протокол и ссылки на БАДы</div>
            <button onClick={() => onBuy(proto)}
              style={{ width: '100%', padding: '16px', background: GOLD, border: 'none', borderRadius: 30, color: W, fontFamily: sans, fontWeight: 700, fontSize: 16, cursor: 'pointer', marginBottom: 10, letterSpacing: 1 }}>
              {proto.price > 0 ? `ПОЛУЧИТЬ ДОСТУП — ${proto.price} ₽` : 'ПОЛУЧИТЬ БЕСПЛАТНО'}
            </button>
            <button onClick={onBack}
              style={{ width: '100%', padding: '12px', background: 'transparent', border: `1px solid ${BD}`, borderRadius: 30, color: INK2, fontFamily: sans, fontSize: 14, cursor: 'pointer' }}>
              Назад
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── СПИСОК ────────────────────────────────────────────────────
export default function Protocols({ flash }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [paywall, setPaywall] = useState(null);

  const load = async () => {
    try {
      const res = await fetch('/api/protocols', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('vforme_token') } });
      const data = await res.json();
      setList(Array.isArray(data) ? data : []);
    } catch (e) { console.error('Protocols load error:', e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleFreeAccess = async (proto) => {
    try {
      await req('POST', `/protocols/${proto.id}/access/free`);
      load();
      setActive(prev => prev ? { ...prev, hasAccess: true } : null);
      flash('Доступ открыт!');
    } catch (e) {}
  };

  if (active) {
    return (
      <>
        <ProtocolPage
          proto={active}
          onBack={() => setActive(null)}
          onBuy={(p) => {
            if (!p.price || p.price === 0) { handleFreeAccess(p); }
            else { setPaywall(p); }
          }}
        />
        {paywall && (
          <Paywall proto={paywall} onClose={() => setPaywall(null)} onPaid={() => { load(); setActive(prev => prev ? { ...prev, hasAccess: true } : null); }} />
        )}
      </>
    );
  }

  if (loading) return <Spinner />;

  return (
    <div style={{ padding: '24px 20px' }}>
      <div style={{ fontFamily: serif, fontSize: 32, fontWeight: 600, color: G, marginBottom: 6 }}>Протоколы</div>
      <div style={{ fontSize: 15, color: INK2, marginBottom: 24, fontFamily: sans }}>Готовые планы от Кристины</div>

      {list.map(proto => (
        <div key={proto.id} onClick={() => setActive(proto)}
          style={{ border: `1px solid ${BD}`, borderRadius: 20, marginBottom: 14, overflow: 'hidden', cursor: 'pointer' }}>

          {/* Превью картинки если есть */}
          {proto.content?.images?.[0] && (
            <img src={proto.content.images[0]} alt="" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
          )}

          <div style={{ background: G, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: serif, fontSize: 18, fontWeight: 600, color: W }}>{proto.title}</div>
              {proto.hasAccess
                ? <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4, letterSpacing: 1 }}>✓ ДОСТУПНО</div>
                : proto.price > 0
                  ? <div style={{ fontSize: 13, color: GOLD, marginTop: 4, fontWeight: 700 }}>💳 {proto.price} ₽</div>
                  : <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>Бесплатно</div>
              }
            </div>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 24 }}>›</span>
          </div>

          <div style={{ padding: '14px 16px', background: W }}>
            {proto.description && <div style={{ fontSize: 14, color: INK2, lineHeight: 1.5, marginBottom: 10 }}>{proto.description}</div>}
            <div style={{ display: 'flex', gap: 12, fontSize: 12, color: INK3 }}>
              {proto.supplements?.length > 0 && <span>💊 {proto.supplements.length} БАД</span>}
              {proto.content?.images?.length > 0 && <span>🖼 {proto.content.images.length} фото</span>}
            </div>
          </div>
        </div>
      ))}

      {!list.length && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: INK3 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 16 }}>Протоколы скоро появятся</div>
        </div>
      )}
    </div>
  );
}
