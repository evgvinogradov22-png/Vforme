import { log } from '../utils/log';
import DOMPurify from 'dompurify';
import { useState, useEffect } from 'react';
import { programs as programsApi, profile as profileApi, points as pointsApi, payment as paymentApi, promo as promoApi } from '../api';
import { Spinner, BackHeader } from '../components/UI';
import { G, GL, GLL, GOLD, GOLDD, BD, INK, INK2, INK3, OW, W, RED, REDBG, sans, serif } from '../utils/theme';

function Paywall({ prog, user, onClose }) {
  const [promoCode, setPromoCode] = useState('');
  const [promoResult, setPromoResult] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [checkingPromo, setCheckingPromo] = useState(false);

  const finalPrice = promoResult ? promoResult.finalPrice : prog.price;

  const checkPromo = async () => {
    if (!promoCode.trim()) return;
    setCheckingPromo(true);
    setPromoError('');
    setPromoResult(null);
    try {
      const result = await promoApi.check(promoCode, prog.id, prog.price);
      setPromoResult(result);
    } catch (e) {
      setPromoError(e.message);
    } finally {
      setCheckingPromo(false);
    }
  };

  const [payUrl, setPayUrl] = useState(null);

  const handlePay = async () => {
    log.paymentStart(prog.title, finalPrice);
    try {
      const result = await paymentApi.createLink(
        prog.id, prog.title, finalPrice,
        user.id, user.email,
        promoResult?.promoId || null
      );
      const orderId = result?.orderId;
      if (typeof window.prodamusPay === 'function') {
        window.prodamusPay(Number(finalPrice));
      } else {
        alert('Платёжный виджет не загружен. Обновите страницу.');
      }
    } catch (e) {
      alert('Ошибка при создании платежа');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: W, borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 480, padding: '32px 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>{prog.icon || '🌿'}</div>
          <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 700, color: INK }}>{prog.title}</div>
          <div style={{ fontSize: 14, color: INK2, marginTop: 4 }}>{prog.desc}</div>
        </div>

        <div style={{ background: GLL, borderRadius: 16, padding: '16px 20px', marginBottom: 20, textAlign: 'center' }}>
          {promoResult ? (
            <div>
              <div style={{ fontSize: 14, color: INK3, textDecoration: 'line-through' }}>{prog.price} ₽</div>
              <div style={{ fontFamily: serif, fontSize: 32, fontWeight: 700, color: G }}>{finalPrice} ₽</div>
              <div style={{ fontSize: 13, color: '#3D6B3D', fontWeight: 600 }}>🎉 {promoResult.message} — экономия {promoResult.discount} ₽</div>
            </div>
          ) : (
            <div style={{ fontFamily: serif, fontSize: 32, fontWeight: 700, color: G }}>{prog.price} ₽</div>
          )}
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: INK2, marginBottom: 8, letterSpacing: 0.5 }}>ПРОМОКОД</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={promoCode}
              onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoResult(null); setPromoError(''); }}
              placeholder="Введи промокод"
              style={{ flex: 1, border: `1px solid ${promoResult ? G : promoError ? RED : BD}`, borderRadius: 12, padding: '12px 14px', fontSize: 15, fontFamily: sans, outline: 'none', color: INK }} />
            <button onClick={checkPromo} disabled={!promoCode.trim() || checkingPromo}
              style={{ padding: '12px 16px', background: G, border: 'none', borderRadius: 12, color: W, fontWeight: 700, cursor: 'pointer', fontSize: 14, fontFamily: sans, opacity: !promoCode.trim() ? 0.5 : 1 }}>
              {checkingPromo ? '...' : 'OK'}
            </button>
          </div>
          {promoError && <div style={{ fontSize: 13, color: RED, marginTop: 6 }}>{promoError}</div>}
          {promoResult && <div style={{ fontSize: 13, color: G, fontWeight: 600, marginTop: 6 }}>✓ {promoResult.message}</div>}
        </div>

        {payUrl ? (
          <div style={{ position: 'relative', width: '100%', height: 500, borderRadius: 16, overflow: 'hidden', border: `1px solid ${BD}` }}>
            <iframe src={payUrl} style={{ width: '100%', height: '100%', border: 'none' }} allow="payment" />
          </div>
        ) : (
          <>
            <button onClick={handlePay}
              style={{ width: '100%', padding: '18px', background: GOLD, border: 'none', borderRadius: 30, color: W, fontFamily: sans, fontWeight: 700, fontSize: 16, cursor: 'pointer', marginBottom: 12, letterSpacing: 1 }}>
              ОПЛАТИТЬ {finalPrice} ₽
            </button>
            <button onClick={onClose}
              style={{ width: '100%', padding: '14px', background: 'transparent', border: `1px solid ${BD}`, borderRadius: 30, color: INK2, fontFamily: sans, fontSize: 15, cursor: 'pointer' }}>
              Закрыть
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function LecturePage({ prog, mod, lec, progress, onBack, onComplete, flash, hasAccess }) {
  const [checks, setChecks] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (progress) {
      const p = progress.find(x => x.lectureId === lec.id);
      if (p?.checks) setChecks(p.checks);
      if (p?.completed) setSaved(true);
    }
  }, [lec.id, progress]);

  const tick = async (idx) => {
    if (!hasAccess) return;
    const key = String(idx);
    const newChecks = { ...checks, [key]: !checks[key] };
    setChecks(newChecks);
    const allDone = lec.content?.checklist?.every((_, i) => newChecks[String(i)]);
    try {
      await profileApi.saveProgress({ lectureId: lec.id, checks: newChecks, completed: !!allDone });
      if (allDone && !saved) {
        setSaved(true);
        const pts = lec.points || 10;
        await pointsApi.award(pts, 'lecture_complete', lec.id, 'lecture').catch(() => {});
        flash(`✓ Этап завершён +${pts} баллов`);
        onComplete(lec.id);
      }
    } catch (e) {}
  };

  const content = lec.content;
  const dc = content ? (content.checklist || []).filter((_, i) => checks[String(i)]).length : 0;
  const blur = !hasAccess;

  return (
    <div style={{ fontFamily: sans, background: W, minHeight: '100vh', color: INK }}>
      <BackHeader onBack={onBack} title={lec.title} subtitle={mod.title?.toUpperCase()} color={mod.color || G} />
      <div style={{ padding: '24px 20px', paddingBottom: 40, filter: blur ? 'blur(3px)' : 'none', pointerEvents: blur ? 'none' : 'auto', userSelect: blur ? 'none' : 'auto', isolation: 'isolate', position: 'relative', zIndex: 0 }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: INK3, letterSpacing: 1.5, fontWeight: 700, marginBottom: 12 }}>ВИДЕО-УРОК</div>
          {lec.videoUrl && !blur ? (
            <div style={{ borderRadius: 16, overflow: 'hidden', background: '#000', position: 'relative', paddingTop: '56.25%' }}>
              <iframe
                src={lec.videoUrl}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            </div>
          ) : (
            <div style={{ borderRadius: 16, background: mod.color || G, height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', border: '3px solid ' + GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: GOLD, fontSize: 24, marginLeft: 4 }}>{blur ? '🔒' : '▶'}</span>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, letterSpacing: 1 }}>{blur ? 'ЗАКРЫТО' : 'ВИДЕО СКОРО ПОЯВИТСЯ'}</div>
            </div>
          )}
        </div>

        {content && (content.html || content.sections?.length > 0) && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, color: INK3, letterSpacing: 1.5, fontWeight: 700, marginBottom: 16 }}>КОНСПЕКТ</div>
            {content.html ? (
              <>
                <style>{`
                  .lecture-content h1 { font-size: 24px; font-weight: 700; margin: 20px 0 10px; color: ${mod.color || G}; font-family: Georgia, serif; line-height: 1.3; }
                  .lecture-content h2 { font-size: 18px; font-weight: 700; margin: 12px 0 6px; color: ${mod.color || G}; font-family: Georgia, serif; line-height: 1.3; }
                  .lecture-content blockquote { border-left: 4px solid ${mod.color || G}; margin: 12px 0; padding: 12px 16px; background: #EBF0EB; border-radius: 0 12px 12px 0; color: ${G}; font-style: italic; line-height: 1.6; }
                  .lecture-content ul { padding-left: 20px; margin: 8px 0; }
                  .lecture-content ol { padding-left: 20px; margin: 8px 0; }
                  .lecture-content li { margin: 4px 0 !important; line-height: 1.7 !important; font-size: 17px !important; padding: 0 !important; display: list-item !important; }
                  .lecture-content li p { margin: 0 !important; line-height: 1.5 !important; font-size: 15px !important; }
                  .lecture-content li br { display: none; }
                  .lecture-content p { margin: 0 0 12px !important; line-height: 1.8 !important; font-size: 17px !important; color: #1A1A1A; }
                  .lecture-content strong { font-weight: 700; }
                  .lecture-content em { font-style: italic; }
                  .lecture-content * { box-sizing: border-box; }
                `}</style>
                <div className="lecture-content" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.html || '') }} />
              </>
            ) : (
              (content.sections || []).map((s, i) => {
                if (s.type === 'intro') return <div key={i} style={{ fontSize: 16, color: INK2, lineHeight: 1.7, marginBottom: 20, fontStyle: 'italic' }}>{s.text}</div>;
                if (s.type === 'heading') return <div key={i} style={{ fontFamily: serif, fontSize: 22, fontWeight: 600, color: mod.color || G, marginBottom: 12, marginTop: 20 }}>{s.text}</div>;
                if (s.type === 'text') return <div key={i} style={{ fontSize: 16, color: INK, lineHeight: 1.7, marginBottom: 16 }}>{s.text}</div>;
                if (s.type === 'highlight') return <div key={i} style={{ background: GLL, borderLeft: '4px solid ' + (mod.color || G), borderRadius: '0 12px 12px 0', padding: '14px 16px', marginBottom: 20, fontSize: 15, color: G, lineHeight: 1.6 }}>{s.text}</div>;
                if (s.type === 'rules') return (
                  <div key={i} style={{ marginBottom: 20 }}>
                    {(s.items || []).map((rule, j) => (
                      <div key={j} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid ' + BD }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: (mod.color || G) + '22', color: mod.color || G, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{rule.num}</div>
                        <div style={{ fontSize: 15, color: INK, lineHeight: 1.5, paddingTop: 6 }}>{rule.text}</div>
                      </div>
                    ))}
                  </div>
                );
                if (s.type === 'list') return (
                  <div key={i} style={{ marginBottom: 20 }}>
                    {(s.items || []).map((item, j) => (
                      <div key={j} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
                        <div style={{ width: 22, height: 22, borderRadius: 6, background: s.style === 'check' ? (mod.color || G) + '22' : REDBG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0, marginTop: 2, color: s.style === 'check' ? mod.color || G : RED, fontWeight: 700 }}>
                          {s.style === 'check' ? '✓' : '✕'}
                        </div>
                        <div style={{ fontSize: 15, color: INK, lineHeight: 1.5 }}>{item}</div>
                      </div>
                    ))}
                  </div>
                );
                return null;
              })
            )}
          </div>
        )}

        {content?.checklist && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, color: INK3, letterSpacing: 1.5, fontWeight: 700, marginBottom: 14 }}>ОТМЕТЬ РЕЗУЛЬТАТЫ</div>
            {content.checklist.map((item, i) => {
              const c = !!checks[String(i)];
              return (
                <div key={i} onClick={() => tick(i)} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14, cursor: hasAccess ? 'pointer' : 'default' }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, border: '2px solid ' + (c ? mod.color || G : BD), background: c ? mod.color || G : W, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                    {c && <span style={{ fontSize: 14, color: W }}>✓</span>}
                  </div>
                  <div style={{ fontSize: 16, color: c ? INK3 : INK, textDecoration: c ? 'line-through' : 'none', lineHeight: 1.5 }}>{item}</div>
                </div>
              );
            })}
            <div style={{ fontSize: 13, color: INK3, marginTop: 8 }}>{dc}/{content.checklist.length} выполнено</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Programs({ flash, user }) {
  const [programList, setProgramList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState([]);
  const [activeProg, setActiveProg] = useState(null);
  const [openMod, setOpenMod] = useState(null);
  const [activeLec, setActiveLec] = useState(null);
  const [paywall, setPaywall] = useState(null);

  useEffect(() => {
    Promise.all([programsApi.getAll(), profileApi.getProgress()])
      .then(([progs, prog]) => { setProgramList(progs); setProgress(prog); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isCompleted = (lecId) => progress.some(p => p.lectureId === lecId && p.completed);
  const hasAccess = (progId) => (user?.programAccess || []).includes(progId);

  const isModUnlocked = (prog, mod, idx) => {
    if (!hasAccess(prog.id)) return true;
    if (idx === 0) return true;
    return prog.modules[idx - 1].lectures.every(l => isCompleted(l.id));
  };

  const isLecUnlocked = (mod, lecIdx) => {
    if (lecIdx === 0) return true;
    return isCompleted(mod.lectures[lecIdx - 1].id);
  };

  const handleComplete = (lecId) => {
    setProgress(p => {
      const existing = p.find(x => x.lectureId === lecId);
      if (existing) return p.map(x => x.lectureId === lecId ? { ...x, completed: true } : x);
      return [...p, { lectureId: lecId, completed: true }];
    });
  };

  if (activeLec) {
    const access = hasAccess(activeLec.prog.id);
    return (
      <>
        <LecturePage
          prog={activeLec.prog} mod={activeLec.mod} lec={activeLec.lec}
          progress={progress} hasAccess={access}
          onBack={() => setActiveLec(null)}
          onComplete={handleComplete}
          flash={flash}
        />
        {!access && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
            <div style={{ background: W, borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 480, padding: '28px 24px 80px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
              <div style={{ fontFamily: serif, fontSize: 20, fontWeight: 700, color: INK, marginBottom: 6 }}>Оформи доступ</div>
              <div style={{ fontSize: 14, color: INK2, marginBottom: 20 }}>Чтобы проходить уроки и получать баллы — оформи доступ к программе</div>
              <button onClick={() => setPaywall(activeLec.prog)}
                style={{ width: '100%', padding: '16px', background: GOLD, border: 'none', borderRadius: 30, color: W, fontFamily: sans, fontWeight: 700, fontSize: 16, cursor: 'pointer', marginBottom: 10, letterSpacing: 1 }}>
                ПОЛУЧИТЬ ДОСТУП — {activeLec.prog.price} ₽
              </button>
              <button onClick={() => setActiveLec(null)}
                style={{ width: '100%', padding: '12px', background: 'transparent', border: `1px solid ${BD}`, borderRadius: 30, color: INK2, fontFamily: sans, fontSize: 14, cursor: 'pointer' }}>
                Вернуться назад
              </button>
            </div>
          </div>
        )}
        {paywall && <Paywall prog={paywall} user={user} onClose={() => setPaywall(null)} />}
      </>
    );
  }

  if (loading) return <Spinner />;

  if (activeProg) {
    const prog = programList.find(p => p.id === activeProg);
    if (!prog) return null;
    const access = hasAccess(prog.id);
    const totalLec = (prog.modules || []).reduce((s, m) => s + (m.lectures || []).length, 0);
    const doneLec = (prog.modules || []).reduce((s, m) => s + (m.lectures || []).filter(l => isCompleted(l.id)).length, 0);
    const progressPct = totalLec > 0 ? Math.round((doneLec / totalLec) * 100) : 0;

    return (
      <>
        <div style={{ paddingBottom: 40 }}>
          <div style={{ background: prog.color || G, padding: '20px 20px 24px' }}>
            <button onClick={() => { setActiveProg(null); setOpenMod(null); }} style={{ background: 'none', border: 'none', color: W, fontSize: 22, cursor: 'pointer', marginBottom: 12, padding: 0 }}>← Программы</button>
            <div style={{ fontSize: 36, marginBottom: 8 }}>{prog.icon || '🌿'}</div>
            <div style={{ fontFamily: serif, fontSize: 26, fontWeight: 600, color: W, lineHeight: 1.2 }}>{prog.title}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 6, lineHeight: 1.5 }}>{prog.desc}</div>
            {access ? (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
                  <span>{doneLec} из {totalLec} уроков</span>
                  <span style={{ color: GOLD, fontWeight: 700 }}>{progressPct}%</span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: progressPct + '%', background: GOLD, borderRadius: 4, transition: 'width .5s' }} />
                </div>
              </div>
            ) : prog.price > 0 && (
              <button onClick={async () => {
                if (!prog.price || prog.price === 0) {
                  try {
                    const res = await fetch('/api/payment/free', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('vforme_token') }, body: JSON.stringify({ programId: prog.id }) });
                    const data = await res.json();
                    if (data.ok && onAccessGranted) onAccessGranted(prog.id);
                  } catch(e) {}
                } else { setPaywall(prog); }
              }}
                style={{ marginTop: 16, padding: '12px 24px', background: GOLD, border: 'none', borderRadius: 30, color: W, fontFamily: sans, fontWeight: 700, fontSize: 14, cursor: 'pointer', letterSpacing: 1 }}>
                {!prog.price || prog.price === 0 ? 'ПОЛУЧИТЬ БЕСПЛАТНО' : `ПОЛУЧИТЬ ДОСТУП — ${prog.price} ₽`}
              </button>
            )}
          </div>

          <div style={{ padding: '20px' }}>
            {(prog.modules || []).map((mod, mIdx) => {
              const modDone = access && (mod.lectures || []).every(l => isCompleted(l.id));
              const isOpen = openMod === mod.id;
              const doneCnt = (mod.lectures || []).filter(l => isCompleted(l.id)).length;
              return (
                <div key={mod.id}>
                  {mIdx > 0 && <div style={{ paddingLeft: 29 }}><div style={{ width: 2, height: 18, background: mod.color || BD }} /></div>}
                  <div onClick={() => setOpenMod(isOpen ? null : mod.id)}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '18px', border: '1px solid ' + (modDone ? (mod.color || G) + '88' : BD), borderRadius: 20, background: modDone ? (mod.color || G) + '12' : W, cursor: 'pointer' }}>
                    <div style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0, background: modDone ? mod.color || G : (mod.color || G) + '22', border: '2px solid ' + (mod.color || G), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: modDone ? 18 : 13, fontWeight: 700, color: modDone ? W : mod.color || G, marginTop: 2 }}>
                      {modDone ? '✓' : mod.num || String(mIdx + 1).padStart(2, '0')}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontFamily: serif, fontSize: 17, fontWeight: 600, color: INK, lineHeight: 1.2, flex: 1 }}>{mod.title}</div>
                        <span style={{ color: INK3, fontSize: 22, transform: isOpen ? 'rotate(90deg)' : 'none', transition: '.2s', marginLeft: 8 }}>›</span>
                      </div>
                      {mod.subtitle && <div style={{ fontSize: 13, color: INK2, marginTop: 3 }}>{mod.subtitle}</div>}
                      {access && mod.lectures?.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                          <div style={{ height: 3, flex: 1, background: BD, borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: (doneCnt / mod.lectures.length * 100) + '%', background: mod.color || G, borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 12, color: INK3 }}>{doneCnt}/{mod.lectures.length}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {isOpen && (
                    <div style={{ marginLeft: 30, marginTop: 2 }}>
                      {(mod.lectures || []).map((lec, lecIdx) => {
                        const lecUnlocked = access ? isLecUnlocked(mod, lecIdx) : true;
                        const lecDone = isCompleted(lec.id);
                        return (
                          <div key={lec.id}>
                            <div style={{ paddingLeft: 21 }}><div style={{ width: 2, height: 14, background: lecDone ? mod.color || G : BD }} /></div>
                            <div onClick={() => setActiveLec({ prog, mod, lec })}
                              style={{ border: '1px solid ' + (lecDone ? (mod.color || G) + '66' : BD), borderRadius: 16, background: lecDone ? (mod.color || G) + '10' : W, cursor: 'pointer', opacity: lecUnlocked ? 1 : 0.5 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
                                <div style={{ width: 38, height: 38, borderRadius: '50%', background: !access ? '#F3F4F6' : lecDone ? mod.color || G : (mod.color || G) + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: !access ? INK3 : lecDone ? W : mod.color || G, fontWeight: 700, flexShrink: 0 }}>
                                  {!access ? '🔒' : lecDone ? '✓' : lecUnlocked ? '▷' : '🔒'}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 15, fontWeight: 600, color: INK }}>{lec.title}</div>
                                  <div style={{ fontSize: 13, color: INK3, marginTop: 2 }}>
                                    {lec.duration}{lec.duration && lec.points ? ' · ' : ''}{lec.points ? `+${lec.points} балл.` : ''}
                                  </div>
                                </div>
                                <span style={{ color: mod.color || G, fontSize: 20 }}>›</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {paywall && <Paywall prog={paywall} user={user} onClose={() => setPaywall(null)} />}
      </>
    );
  }

  return (
    <div style={{ padding: '24px 20px' }}>
      <div style={{ fontFamily: serif, fontSize: 32, fontWeight: 600, color: G, marginBottom: 6 }}>Программы</div>
      <div style={{ fontSize: 15, color: INK2, marginBottom: 24, fontFamily: sans }}>Выбери свою программу</div>
      {programList.map(prog => {
        const access = hasAccess(prog.id);
        const totalLec = (prog.modules || []).reduce((s, m) => s + (m.lectures?.length || 0), 0);
        const doneLec = (prog.modules || []).reduce((s, m) => s + (m.lectures || []).filter(l => isCompleted(l.id)).length, 0);
        const pct = totalLec > 0 ? Math.round((doneLec / totalLec) * 100) : 0;
        return (
          <div key={prog.id} onClick={() => prog.available && setActiveProg(prog.id)}
            style={{ border: '1px solid ' + (prog.available ? BD : '#E8E8E8'), borderRadius: 20, marginBottom: 14, overflow: 'hidden', cursor: prog.available ? 'pointer' : 'default', opacity: prog.available ? 1 : 0.7 }}>
            <div style={{ background: prog.available ? prog.color || G : INK3, padding: '20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: 36 }}>{prog.icon || '🌿'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: serif, fontSize: 20, fontWeight: 600, color: W }}>{prog.title}</div>
                {!prog.available && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>🔒 Скоро</div>}
                {prog.available && access && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4, letterSpacing: 1 }}>✓ ДОСТУПНО</div>}
                {prog.available && !access && prog.price > 0 && <div style={{ fontSize: 13, color: GOLD, marginTop: 4, fontWeight: 700 }}>💳 {prog.price} ₽</div>}
                {prog.available && !access && !prog.price && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>Бесплатно</div>}
              </div>
              {prog.available && <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 24 }}>›</span>}
            </div>
            <div style={{ padding: '14px 16px', background: W }}>
              <div style={{ fontSize: 14, color: INK2, lineHeight: 1.5 }}>{prog.desc}</div>
              {prog.available && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: INK3, marginBottom: 6, fontFamily: sans }}>
                    <span>{(prog.modules || []).length} модулей · {totalLec} уроков</span>
                    {access ? <span style={{ color: GOLD, fontWeight: 700 }}>{pct}%</span> : prog.price > 0 && <span style={{ color: GOLD, fontWeight: 700 }}>Получить доступ →</span>}
                  </div>
                  {access && (
                    <div style={{ height: 3, background: BD, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: pct + '%', background: GOLD, borderRadius: 3 }} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
      {paywall && <Paywall prog={paywall} user={user} onClose={() => setPaywall(null)} />}
    </div>
  );
}
