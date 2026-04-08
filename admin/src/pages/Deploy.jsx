import { useState, useEffect } from 'react';
import { C, Spinner, Card, Btn } from '../components/UI';

const BASE = '/api';
function getToken() { return localStorage.getItem('vforme_admin_token'); }
async function req(method, path, body) {
  try {
    const opts = { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(BASE + path, opts);
    return res.json();
  } catch(e) { return { error: e.message }; }
}

export default function Deploy({ flash }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [changelog, setChangelog] = useState('');
  const [prodOk, setProdOk] = useState(false);
  const [testOk, setTestOk] = useState(false);

  useEffect(() => {
    Promise.all([
      req('GET', '/admin/deploy/versions').catch(() => []),
      req('GET', '/admin/deploy/status').catch(() => ({})),
    ]).then(([v, s]) => {
      setVersions(Array.isArray(v) ? v : []);
      setProdOk(!!s?.prod);
      setTestOk(!!s?.test);
    }).finally(() => setLoading(false));
  }, []);

  const deployToTest = async () => {
    if (!changelog.trim()) return flash('Опиши что изменилось');
    setDeploying(true);
    const data = await req('POST', '/admin/deploy/deploy', { desc: changelog });
    setDeploying(false);
    if (data.ok) {
      flash('✅ Задеплоено на тест!');
      setChangelog('');
      setTestOk(true);
    } else {
      flash('❌ ' + (data.error || 'Ошибка'));
    }
  };

  const promote = async () => {
    if (!confirm('Выкатить тест в боевую?')) return;
    setDeploying(true);
    const data = await req('POST', '/admin/deploy/promote');
    setDeploying(false);
    if (data.ok) flash('✅ Выкачено в боевую!');
    else flash('❌ ' + (data.error || 'Ошибка'));
  };

  const rollback = async (n) => {
    if (!confirm('Откатиться к этой версии?')) return;
    setDeploying(true);
    const data = await req('POST', '/admin/deploy/rollback', { n });
    setDeploying(false);
    if (data.ok) flash('✅ Откат выполнен');
    else flash('❌ ' + (data.error || 'Ошибка'));
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: C.ink }}>Деплой</div>
        <div style={{ fontSize: 14, color: C.ink3, marginTop: 2 }}>Управление версиями</div>
      </div>

      {/* СТАТУС */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <Card style={{ flex: 1, padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24 }}>{prodOk ? '🟢' : '🔴'}</div>
          <div style={{ fontWeight: 700, marginTop: 4 }}>Боевой</div>
          <div style={{ fontSize: 12, color: C.ink3 }}>app.nutrikris.ru</div>
        </Card>
        <Card style={{ flex: 1, padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24 }}>{testOk ? '🟢' : '⚪'}</div>
          <div style={{ fontWeight: 700, marginTop: 4 }}>Тест</div>
          <div style={{ fontSize: 12, color: C.ink3 }}>test.nutrikris.ru</div>
        </Card>
      </div>

      {/* НОВЫЙ ДЕПЛОЙ */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 12 }}>🚀 Новый деплой на тест</div>
        <textarea value={changelog} onChange={e => setChangelog(e.target.value)}
          placeholder="Что изменилось в этой версии..."
          rows={3}
          style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: 12 }} />
        <Btn onClick={deployToTest} disabled={deploying || !changelog.trim()} variant="primary" style={{ width: '100%' }}>
          {deploying ? '⏳ Деплоим...' : '🧪 Задеплоить на тест'}
        </Btn>
      </Card>

      {/* PROMOTE */}
      {testOk && (
        <Card style={{ marginBottom: 16, background: '#F0FFF4', border: `1px solid ${C.green}44` }}>
          <div style={{ fontSize: 14, color: C.green, fontWeight: 700, marginBottom: 8 }}>✅ Тест запущен</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <a href="https://test.nutrikris.ru" target="_blank" rel="noopener noreferrer"
              style={{ flex: 1, padding: 10, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 10, textAlign: 'center', fontSize: 14, color: C.ink, textDecoration: 'none' }}>
              Открыть тест →
            </a>
            <Btn onClick={promote} disabled={deploying} variant="primary" style={{ flex: 1 }}>
              {deploying ? '⏳...' : '🎯 Выкатить в боевую'}
            </Btn>
          </div>
        </Card>
      )}

      {/* ИСТОРИЯ */}
      <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 12 }}>История версий</div>
      {versions.length === 0 ? (
        <Card style={{ padding: 40, textAlign: 'center', color: C.ink3 }}>Деплоев через эту систему ещё не было</Card>
      ) : versions.map((v, i) => (
        <Card key={i} style={{ padding: '14px 20px', marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                <span>{v.status === 'ok' ? (v.env === 'prod' ? '🟢' : '🔵') : '🔴'}</span>
                <span style={{ fontSize: 12, background: v.env === 'prod' ? C.green : C.gold, color: '#fff', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                  {v.env === 'prod' ? 'БОЕВОЙ' : 'ТЕСТ'}
                </span>
                <span style={{ fontSize: 12, color: C.ink3 }}>{v.date}</span>
              </div>
              <div style={{ fontSize: 14, color: C.ink }}>{v.desc}</div>
            </div>
            <Btn onClick={() => rollback(i + 1)} disabled={deploying} variant="outline" size="sm">Откат</Btn>
          </div>
        </Card>
      ))}
    </div>
  );
}
