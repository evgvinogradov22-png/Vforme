import { useState, useEffect } from 'react';
import { supplements as supplementsApi } from '../api';
import { Spinner, BackHeader } from '../components/UI';
import { G, GLL, GOLD, GOLDD, BD, INK, INK2, INK3, OW, W, sans, serif } from '../utils/theme';

export default function Supplements() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openScheme, setOpenScheme] = useState(null);

  useEffect(() => {
    supplementsApi.getAll()
      .then(setSchemes)
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  if (openScheme) {
    const s = schemes.find(x => x.id === openScheme);
    return (
      <div style={{ paddingBottom: 40 }}>
        <BackHeader onBack={() => setOpenScheme(null)} title={s.title} subtitle="СХЕМА ДОБАВОК" />
        <div style={{ padding: '24px 20px' }}>
          <div style={{ fontSize: 15, color: INK2, marginBottom: 24, lineHeight: 1.5 }}>{s.desc}</div>
          {(s.items || []).map((item, i) => (
            <div key={i} style={{ border: '1px solid ' + BD, borderRadius: 16, padding: '16px 18px', marginBottom: 12, background: W }}>
              <div style={{ fontFamily: serif, fontSize: 17, fontWeight: 600, color: INK, marginBottom: 8 }}>{item.name}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                <span style={{ background: GLL, color: G, fontSize: 13, borderRadius: 20, padding: '4px 12px', border: '1px solid #C8D8C8' }}>💊 {item.dose}</span>
                <span style={{ background: '#FBF5EB', color: GOLDD, fontSize: 13, borderRadius: 20, padding: '4px 12px', border: '1px solid #EDD9B0' }}>⏰ {item.time}</span>
              </div>
              {item.note && <div style={{ fontSize: 14, color: INK2, lineHeight: 1.5, borderTop: '1px solid ' + BD, paddingTop: 10 }}>{item.note}</div>}
              {item.buyUrl && (
                <a href={item.buyUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-block', marginTop: 10, fontSize: 13, color: G, fontWeight: 700, textDecoration: 'none' }}>
                  Где купить →
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 20px' }}>
      <div style={{ fontFamily: serif, fontSize: 32, fontWeight: 600, color: G, marginBottom: 6 }}>Схемы БАДов</div>
      <div style={{ fontSize: 15, color: INK2, marginBottom: 24, fontFamily: sans }}>Индивидуальные схемы из программ Кристины</div>
      {schemes.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: INK3, fontFamily: sans }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💊</div>
          <div>Схемы БАДов появятся после добавления программ</div>
        </div>
      )}
      {schemes.map(s => (
        <div key={s.id} onClick={() => setOpenScheme(s.id)}
          style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', border: '1px solid ' + BD, borderRadius: 18, marginBottom: 10, cursor: 'pointer', background: W }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: GLL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>💊</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: serif, fontSize: 16, fontWeight: 600, color: INK }}>{s.title}</div>
            <div style={{ fontSize: 13, color: INK3, marginTop: 3, fontFamily: sans }}>{(s.items || []).length} добавок</div>
          </div>
          <span style={{ color: INK3, fontSize: 20 }}>›</span>
        </div>
      ))}
    </div>
  );
}
