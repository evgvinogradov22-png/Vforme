import { useState, useEffect } from 'react';
import { C, Spinner, Card } from '../components/UI';

function getToken() { return localStorage.getItem('vforme_admin_token'); }

const STATUS_COLOR = { paid: '#22C55E', pending: '#F59E0B', failed: '#EF4444' };
const STATUS_LABEL = { paid: 'Оплачен', pending: 'Ожидает', failed: 'Ошибка' };

export default function Payments() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch('/api/admin/orders', { headers: { 'Authorization': `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(d => setOrders(Array.isArray(d) ? d : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const deleteOrder = async (id) => {
    if (!confirm('Удалить этот платёж из базы?')) return;
    const token = localStorage.getItem('vforme_admin_token');
    await fetch(`/api/admin/orders/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    setOrders(prev => prev.filter(o => o.id !== id));
  };
  const totalRevenue = orders.filter(o => o.status === 'paid').reduce((s, o) => s + Number(o.amount || 0), 0);

  if (loading) return <Spinner />;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: C.ink }}>Платежи</div>
        <div style={{ fontSize: 14, color: C.ink3, marginTop: 2 }}>История всех заказов</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        <Card style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: C.green }}>{totalRevenue.toLocaleString('ru')} ₽</div>
          <div style={{ fontSize: 13, color: C.ink3, marginTop: 4 }}>Выручка</div>
        </Card>
        <Card style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: C.ink }}>{orders.filter(o => o.status === 'paid').length}</div>
          <div style={{ fontSize: 13, color: C.ink3, marginTop: 4 }}>Оплачено</div>
        </Card>
        <Card style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#F59E0B' }}>{orders.filter(o => o.status === 'pending').length}</div>
          <div style={{ fontSize: 13, color: C.ink3, marginTop: 4 }}>Ожидают</div>
        </Card>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[['all','Все'], ['paid','Оплачен'], ['pending','Ожидает'], ['failed','Ошибка']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            style={{ padding: '6px 16px', borderRadius: 20, border: `1px solid ${filter === val ? C.green : C.border}`, background: filter === val ? C.green : '#fff', color: filter === val ? '#fff' : C.ink2, fontSize: 13, cursor: 'pointer' }}>
            {label}
          </button>
        ))}
      </div>

      <Card style={{ overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}`, background: '#FAFAFA' }}>
              {['Пользователь', 'Программа', 'Сумма', 'Статус', 'Дата', ''].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: C.ink3, fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: C.ink3 }}>Нет данных</td></tr>
            ) : filtered.map((o, i) => (
              <tr key={o.id || i} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ fontWeight: 600, color: C.ink }}>{o.user?.name || '—'}</div>
                  <div style={{ color: C.ink3, fontSize: 11 }}>{o.user?.email || ''}</div>
                </td>
                <td style={{ padding: '10px 14px', color: C.ink }}>{o.program?.title || '—'}</td>
                <td style={{ padding: '10px 14px', fontWeight: 700, color: C.ink }}>{Number(o.amount || 0).toLocaleString('ru')} ₽</td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ background: (STATUS_COLOR[o.status] || '#9CA3AF') + '22', color: STATUS_COLOR[o.status] || '#9CA3AF', padding: '3px 10px', borderRadius: 20, fontWeight: 600, fontSize: 12 }}>
                    {STATUS_LABEL[o.status] || o.status}
                  </span>
                </td>
                <td style={{ padding: '10px 14px', color: C.ink3 }}>
                  {o.createdAt ? new Date(o.createdAt).toLocaleString('ru', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <button onClick={() => deleteOrder(o.id)}
                    style={{ padding: '4px 10px', background: 'none', border: `1px solid #EF4444`, borderRadius: 6, color: '#EF4444', fontSize: 12, cursor: 'pointer' }}>
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
