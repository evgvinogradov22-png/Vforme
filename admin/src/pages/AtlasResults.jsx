import { useState, useEffect } from 'react';

const ZONE_LABELS = {
  brain: 'Сон и нервы', thyroid: 'Энергия', gut: 'ЖКТ', hormones: 'Гормоны', composition: 'Тело',
};
const ZONE_ICONS = {
  brain: '🧠', thyroid: '⚡', gut: '🍽️', hormones: '🌸', composition: '💪',
};

const BASE = '/api';
const getToken = () => localStorage.getItem('vforme_admin_token');
async function req(method, path) {
  const opts = { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` } };
  const res = await fetch(BASE + path, opts);
  return res.json();
}

function zoneColor(level) {
  if (level >= 75) return '#3D6B3D';
  if (level >= 50) return '#7AAE7A';
  if (level >= 25) return '#D4A94A';
  return '#C88A5E';
}

function fmtDate(d) {
  const dt = new Date(d);
  return dt.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
       + ' · ' + dt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function fmtAnswer(key, value) {
  if (value == null) return '—';
  const scaleKeys = ['sleep', 'stress', 'energy', 'activity', 'skin'];
  if (scaleKeys.includes(key)) return `${value}/10`;
  if (key === 'gender') return value === 'male' ? 'М' : 'Ж';
  const choiceMap = { often: 'часто', some: 'иногда', never: 'нет/всё ок' };
  return choiceMap[value] || String(value);
}

const ANSWER_LABELS = {
  gender: 'Пол', sleep: 'Сон', stress: 'Стресс', energy: 'Энергия',
  activity: 'Активность', skin: 'Кожа', headaches: 'Головные боли', gut: 'ЖКТ',
};

function Detail({ id, onClose }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    req('GET', `/admin/atlas/${id}`).then(d => setData(d && !d.error ? d : null));
  }, [id]);

  if (!data) {
    return (
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#fff' }}>Загрузка...</div>
      </div>
    );
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(26,26,26,0.55)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 16, maxWidth: 720, width: '100%',
        maxHeight: '90vh', overflowY: 'auto', padding: 28,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1A1A1A', marginBottom: 4 }}>
              {data.user?.name || '—'}
            </div>
            <div style={{ fontSize: 13, color: '#888' }}>{data.user?.email}</div>
            <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>{fmtDate(data.createdAt)}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#888' }}>✕</button>
        </div>

        {/* Уровни зон */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: 1, marginBottom: 10 }}>КАРТА ЗДОРОВЬЯ</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {Object.entries(data.levels || {}).map(([zone, level]) => (
              <div key={zone} style={{ background: '#F9F7F4', borderRadius: 10, padding: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 20, marginBottom: 2 }}>{ZONE_ICONS[zone]}</div>
                <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>{ZONE_LABELS[zone]}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: zoneColor(level) }}>{level}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Ответы */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: 1, marginBottom: 10 }}>ОТВЕТЫ НА АНКЕТУ</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {Object.entries(data.answers || {}).map(([k, v]) => (
              <div key={k} style={{ background: '#F9F7F4', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 }}>{ANSWER_LABELS[k] || k}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>{fmtAnswer(k, v)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Свободный комментарий */}
        {data.complaints && (
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: 1, marginBottom: 8 }}>ЧТО НАПИСАЛ(А) СВОИМИ СЛОВАМИ</div>
            <div style={{ background: '#FFF8E7', border: '1px solid #F5E8C0', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: '#4a3a00', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
              {data.complaints}
            </div>
          </div>
        )}

        {/* Сообщение от Кристины (AI) */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: 1, marginBottom: 8 }}>ОТВЕТ КРИСТИНЫ (AI)</div>
          <div style={{ background: '#F4F7F4', border: '1px solid #D9E3D9', borderRadius: 12, padding: '14px 16px', fontSize: 14, color: '#1A1A1A', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {data.aiMessage || '—'}
          </div>
        </div>

        {/* Рекомендации */}
        {data.recommendedTitles?.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: 1, marginBottom: 8 }}>РЕКОМЕНДОВАНО</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {data.recommendedTitles.map((t, i) => (
                <div key={i} style={{ background: '#F9F7F4', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#1A1A1A' }}>
                  {t}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AtlasResults() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    req('GET', '/admin/atlas').then(d => {
      setRows(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Загрузка...</div>;

  return (
    <div style={{ padding: 30, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#1A1A1A' }}>Атлас здоровья</div>
        <div style={{ fontSize: 14, color: '#888', marginTop: 4 }}>
          {rows.length} прохождений анкеты клиентами
        </div>
      </div>

      {rows.length === 0 ? (
        <div style={{ background: '#F9F7F4', borderRadius: 12, padding: 40, textAlign: 'center', color: '#888' }}>
          Пока никто не прошёл анкету
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #EAE5D8' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr 1.5fr 40px', padding: '14px 20px', background: '#F9F7F4', fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: 1 }}>
            <div>КЛИЕНТ</div>
            <div>ЗОНЫ</div>
            <div>ПОЛ</div>
            <div>ДАТА</div>
            <div></div>
          </div>
          {rows.map(r => {
            const focus = r.focusZoneIds?.[0];
            const focusLabel = focus ? (ZONE_ICONS[focus] + ' ' + ZONE_LABELS[focus]) : '—';
            return (
              <div key={r.id}
                onClick={() => setSelected(r.id)}
                style={{
                  display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr 1.5fr 40px',
                  padding: '14px 20px', borderTop: '1px solid #F0EBE0', cursor: 'pointer',
                  alignItems: 'center',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#FCFAF5'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>{r.user?.name || '—'}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{r.user?.email}</div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {Object.entries(r.levels || {}).sort((a, b) => a[1] - b[1]).slice(0, 3).map(([z, l]) => (
                    <div key={z} style={{
                      fontSize: 11, fontWeight: 600,
                      background: '#F9F7F4', color: zoneColor(l),
                      padding: '4px 8px', borderRadius: 6,
                    }}>
                      {ZONE_ICONS[z]} {l}%
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 13, color: '#555' }}>
                  {r.gender === 'male' ? 'М' : r.gender === 'female' ? 'Ж' : '—'}
                </div>
                <div style={{ fontSize: 12, color: '#888' }}>{fmtDate(r.createdAt)}</div>
                <div style={{ color: '#888', fontSize: 18 }}>›</div>
              </div>
            );
          })}
        </div>
      )}

      {selected && <Detail id={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
