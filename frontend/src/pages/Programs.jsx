import { useState, useEffect } from 'react';
import { programs as programsApi, profile as profileApi, points as pointsApi } from '../api';
import { Spinner, BackHeader } from '../components/UI';
import { G, GL, GLL, GOLD, BD, INK, INK2, INK3, OW, W, RED, REDBG, sans, serif } from '../utils/theme';

function LecturePage({ prog, mod, lec, progress, onBack, onComplete, flash }) {
  const [checks, setChecks] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // restore saved checks from progress
    if (progress) {
      const p = progress.find(x => x.lectureId === lec.id);
      if (p?.checks) setChecks(p.checks);
      if (p?.completed) setSaved(true);
    }
  }, [lec.id, progress]);

  const tick = async (idx) => {
    const key = String(idx);
    const newChecks = { ...checks, [key]: !checks[key] };
    setChecks(newChecks);
    const allDone = lec.content?.checklist?.every((_, i) => newChecks[String(i)]);
    try {
      await profileApi.saveProgress({ lectureId: lec.id, checks: newChecks, completed: !!allDone });
      if (allDone && !saved) {
        setSaved(true);
        flash('✓ Этап завершён +10 баллов');
        pointsApi.award(10, 'lecture_complete', lec.id, 'lecture').catch(() => {});
        onComplete(lec.id);
      }
    } catch (e) { /* non-blocking */ }
  };

  const content = lec.content;
  const dc = content ? (content.checklist || []).filter((_, i) => checks[String(i)]).length : 0;

  return (
    <div style={{ fontFamily: sans, background: W, minHeight: '100vh', color: INK }}>
      <BackHeader onBack={onBack} title={lec.title} subtitle={mod.title?.toUpperCase()} color={mod.color || G} />
      <div style={{ padding: '24px 20px', paddingBottom: 40 }}>
        {/* VIDEO */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: INK3, letterSpacing: 1.5, fontWeight: 700, marginBottom: 12 }}>ВИДЕО-УРОК</div>
          {lec.videoUrl ? (
            <div style={{ borderRadius: 16, overflow: 'hidden', background: '#000' }}>
              <video controls style={{ width: '100%', display: 'block' }} src={lec.videoUrl} />
            </div>
          ) : (
            <div style={{ borderRadius: 16, background: mod.color || G, height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', border: '3px solid ' + GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: GOLD, fontSize: 24, marginLeft: 4 }}>▶</span>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, letterSpacing: 1 }}>ВИДЕО СКОРО ПОЯВИТСЯ</div>
            </div>
          )}
        </div>

        {/* КОНСПЕКТ */}
        {content && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, color: INK3, letterSpacing: 1.5, fontWeight: 700, marginBottom: 16 }}>КОНСПЕКТ</div>
            {(content.sections || []).map((s, i) => {
              if (s.type === 'intro') return <div key={i} style={{ fontSize: 16, color: INK2, lineHeight: 1.7, marginBottom: 20, fontStyle: 'italic' }}>{s.text}</div>;
              if (s.type === 'heading') return <div key={i} style={{ fontFamily: serif, fontSize: 22, fontWeight: 600, color: mod.color || G, marginBottom: 12, marginTop: 20 }}>{s.text}</div>;
              if (s.type === 'text') return <div key={i} style={{ fontSize: 16, color: INK, lineHeight: 1.7, marginBottom: 16 }}>{s.text}</div>;
              if (s.type === 'highlight') return <div key={i} style={{ background: GLL, borderLeft: '4px solid ' + (mod.color || G), borderRadius: '0 12px 12px 0', padding: '14px 16px', marginBottom: 20, fontSize: 15, color: G, lineHeight: 1.6 }}>{s.text}</div>;
              if (s.type === 'rules') return (
                <div key={i} style={{ marginBottom: 20 }}>
                  {s.items.map((rule, j) => (
                    <div key={j} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid ' + BD }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: (mod.color || G) + '22', color: mod.color || G, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{rule.num}</div>
                      <div style={{ fontSize: 15, color: INK, lineHeight: 1.5, paddingTop: 6 }}>{rule.text}</div>
                    </div>
                  ))}
                </div>
              );
              if (s.type === 'list') return (
                <div key={i} style={{ marginBottom: 20 }}>
                  {s.items.map((item, j) => (
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
            })}
          </div>
        )}

        {/* ЧЕКЛИСТ */}
        {content?.checklist && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, color: INK3, letterSpacing: 1.5, fontWeight: 700, marginBottom: 14 }}>ОТМЕТЬ РЕЗУЛЬТАТЫ</div>
            {content.checklist.map((item, i) => {
              const c = !!checks[String(i)];
              return (
                <div key={i} onClick={() => tick(i)} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14, cursor: 'pointer' }}>
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

        {/* ЗАДАЧИ */}
        {lec.tasks?.length > 0 && (
          <div style={{ background: '#FBF5EB', border: '1px solid #EDD9B0', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: '#A8885A', letterSpacing: 1.5, fontWeight: 700, marginBottom: 10 }}>ЗАДАЧИ ДОБАВЛЕНЫ В ТРЕКЕР</div>
            {lec.tasks.map((t, i) => <div key={i} style={{ fontSize: 14, color: INK, display: 'flex', gap: 8, marginBottom: 6 }}><span style={{ color: GOLD }}>→</span>{t}</div>)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Programs({ flash }) {
  const [programList, setProgramList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState([]);
  const [activeProg, setActiveProg] = useState(null);
  const [openMod, setOpenMod] = useState(null);
  const [activeLec, setActiveLec] = useState(null);

  useEffect(() => {
    Promise.all([programsApi.getAll(), profileApi.getProgress()])
      .then(([progs, prog]) => { setProgramList(progs); setProgress(prog); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isCompleted = (lecId) => progress.some(p => p.lectureId === lecId && p.completed);

  const isModUnlocked = (prog, mod, idx) => {
    if (idx === 0) return true;
    const prevMod = prog.modules[idx - 1];
    return prevMod.lectures.every(l => isCompleted(l.id));
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

  const openLesson = async (prog, mod, lec) => {
    // Add tasks to tracker silently
    if (lec.tasks?.length) {
      // tasks are handled by tracker tab via API
    }
    setActiveLec({ prog, mod, lec });
  };

  if (activeLec) return (
    <LecturePage
      prog={activeLec.prog} mod={activeLec.mod} lec={activeLec.lec}
      progress={progress}
      onBack={() => setActiveLec(null)}
      onComplete={handleComplete}
      flash={flash}
    />
  );

  if (loading) return <Spinner />;

  // PROGRAM DETAIL
  if (activeProg) {
    const prog = programList.find(p => p.id === activeProg);
    if (!prog) return null;
    const totalLec = (prog.modules || []).reduce((s, m) => s + (m.lectures || []).length, 0);
    const doneLec = (prog.modules || []).reduce((s, m) => s + (m.lectures || []).filter(l => isCompleted(l.id)).length, 0);
    const progressPct = totalLec > 0 ? Math.round((doneLec / totalLec) * 100) : 0;

    return (
      <div style={{ paddingBottom: 40 }}>
        <div style={{ background: prog.color || G, padding: '20px 20px 24px' }}>
          <button onClick={() => { setActiveProg(null); setOpenMod(null); }} style={{ background: 'none', border: 'none', color: W, fontSize: 22, cursor: 'pointer', marginBottom: 12, padding: 0 }}>← Программы</button>
          <div style={{ fontSize: 36, marginBottom: 8 }}>{prog.icon || '🌿'}</div>
          <div style={{ fontFamily: serif, fontSize: 26, fontWeight: 600, color: W, lineHeight: 1.2 }}>{prog.title}</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 6, lineHeight: 1.5 }}>{prog.desc}</div>
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
              <span>{doneLec} из {totalLec} уроков</span>
              <span style={{ color: GOLD, fontWeight: 700 }}>{progressPct}%</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: progressPct + '%', background: GOLD, borderRadius: 4, transition: 'width .5s' }} />
            </div>
          </div>
        </div>

        <div style={{ padding: '20px' }}>
          {(prog.modules || []).map((mod, mIdx) => {
            const unlocked = isModUnlocked(prog, mod, mIdx);
            const modDone = (mod.lectures || []).every(l => isCompleted(l.id));
            const isOpen = openMod === mod.id;
            const doneCnt = (mod.lectures || []).filter(l => isCompleted(l.id)).length;
            return (
              <div key={mod.id}>
                {mIdx > 0 && <div style={{ paddingLeft: 29 }}><div style={{ width: 2, height: 18, background: unlocked ? mod.color : BD }} /></div>}
                <div onClick={() => unlocked && setOpenMod(isOpen ? null : mod.id)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '18px', border: '1px solid ' + (modDone ? (mod.color || G) + '88' : BD), borderRadius: 20, background: modDone ? (mod.color || G) + '12' : W, cursor: unlocked ? 'pointer' : 'default', opacity: unlocked ? 1 : 0.5 }}>
                  <div style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0, background: modDone ? mod.color || G : unlocked ? (mod.color || G) + '22' : BD, border: '2px solid ' + (modDone ? mod.color || G : unlocked ? mod.color || G : BD), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: modDone ? 18 : 13, fontWeight: 700, color: modDone ? W : unlocked ? mod.color || G : '#AAA', marginTop: 2 }}>
                    {modDone ? '✓' : mod.num || String(mIdx + 1).padStart(2, '0')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontFamily: serif, fontSize: 17, fontWeight: 600, color: unlocked ? INK : '#AAA', lineHeight: 1.2, flex: 1 }}>{mod.title}</div>
                      {!unlocked && <span style={{ fontSize: 16, marginLeft: 8 }}>🔒</span>}
                      {unlocked && !modDone && <span style={{ color: INK3, fontSize: 22, transform: isOpen ? 'rotate(90deg)' : 'none', transition: '.2s', marginLeft: 8 }}>›</span>}
                    </div>
                    {mod.subtitle && <div style={{ fontSize: 13, color: unlocked ? INK2 : '#AAA', marginTop: 3 }}>{mod.subtitle}</div>}
                    {unlocked && mod.lectures?.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                        <div style={{ height: 3, flex: 1, background: BD, borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: (doneCnt / mod.lectures.length * 100) + '%', background: mod.color || G, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 12, color: INK3 }}>{doneCnt}/{mod.lectures.length}</span>
                      </div>
                    )}
                  </div>
                </div>

                {isOpen && unlocked && (
                  <div style={{ marginLeft: 30, marginTop: 2 }}>
                    {(mod.lectures || []).map((lec, lecIdx) => {
                      const lecUnlocked = isLecUnlocked(mod, lecIdx);
                      const lecDone = isCompleted(lec.id);
                      return (
                        <div key={lec.id}>
                          <div style={{ paddingLeft: 21 }}><div style={{ width: 2, height: 14, background: lecDone ? mod.color || G : BD }} /></div>
                          <div onClick={() => lecUnlocked && openLesson(prog, mod, lec)}
                            style={{ border: '1px solid ' + (lecDone ? (mod.color || G) + '66' : BD), borderRadius: 16, background: lecDone ? (mod.color || G) + '10' : W, opacity: lecUnlocked ? 1 : 0.5, cursor: lecUnlocked ? 'pointer' : 'default' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
                              <div style={{ width: 38, height: 38, borderRadius: '50%', background: lecDone ? mod.color || G : lecUnlocked ? (mod.color || G) + '22' : BD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: lecDone ? W : lecUnlocked ? mod.color || G : '#AAA', fontWeight: 700, flexShrink: 0 }}>
                                {lecDone ? '✓' : lecUnlocked ? '▷' : '🔒'}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 15, fontWeight: 600, color: lecUnlocked ? INK : '#AAA' }}>{lec.title}</div>
                                {lec.duration && <div style={{ fontSize: 13, color: INK3, marginTop: 2 }}>{lec.duration}</div>}
                              </div>
                              {lecUnlocked && <span style={{ color: mod.color || G, fontSize: 20 }}>›</span>}
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
    );
  }

  // PROGRAMS LIST
  return (
    <div style={{ padding: '24px 20px' }}>
      <div style={{ fontFamily: serif, fontSize: 32, fontWeight: 600, color: G, marginBottom: 6 }}>Программы</div>
      <div style={{ fontSize: 15, color: INK2, marginBottom: 24, fontFamily: sans }}>Выбери свою программу</div>
      {programList.map(prog => (
        <div key={prog.id} onClick={() => prog.available && setActiveProg(prog.id)}
          style={{ border: '1px solid ' + (prog.available ? BD : '#E8E8E8'), borderRadius: 20, marginBottom: 14, overflow: 'hidden', cursor: prog.available ? 'pointer' : 'default', opacity: prog.available ? 1 : 0.7 }}>
          <div style={{ background: prog.available ? prog.color || G : INK3, padding: '20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 36 }}>{prog.icon || '🌿'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: serif, fontSize: 20, fontWeight: 600, color: W }}>{prog.title}</div>
              {!prog.available && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>🔒 Скоро</div>}
              {prog.available && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4, letterSpacing: 1 }}>ДОСТУПНО</div>}
            </div>
            {prog.available && <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 24 }}>›</span>}
          </div>
          <div style={{ padding: '14px 16px', background: W }}>
            <div style={{ fontSize: 14, color: INK2, lineHeight: 1.5 }}>{prog.desc}</div>
            {prog.available && prog.modules && (() => {
              const totalLec = prog.modules.reduce((s, m) => s + (m.lectures?.length || 0), 0);
              const doneLec = prog.modules.reduce((s, m) => s + (m.lectures || []).filter(l => isCompleted(l.id)).length, 0);
              const pct = totalLec > 0 ? Math.round((doneLec / totalLec) * 100) : 0;
              return (
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: INK3, marginBottom: 6, fontFamily: sans }}>
                    <span>{prog.modules.length} модулей · {totalLec} уроков</span>
                    <span style={{ color: GOLD, fontWeight: 700 }}>{pct}%</span>
                  </div>
                  <div style={{ height: 3, background: BD, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: pct + '%', background: GOLD, borderRadius: 3 }} />
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      ))}
    </div>
  );
}
