import { useState, useEffect } from 'react';
import { C, Spinner, Card, Btn, Modal, Input, Textarea, Badge } from '../components/UI';
import RichEditor from '../components/RichEditor';

const BASE = '/api';
function getToken() { return localStorage.getItem('vforme_admin_token'); }
async function req(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  return res.json();
}

function ProtocolModal({ protocol, supplements, onClose, onSave }) {
  const [title, setTitle] = useState(protocol?.title || '');
  const [description, setDescription] = useState(protocol?.description || '');
  const [html, setHtml] = useState(protocol?.content?.html || '');
  const [images, setImages] = useState(protocol?.content?.images || []);
  const [price, setPrice] = useState(String(protocol?.price ?? 0));
  const [available, setAvailable] = useState(protocol?.available ?? true);
  const [coverImage, setCoverImage] = useState(protocol?.coverImage || '');
  const [suppLinks, setSuppLinks] = useState(protocol?.supplements || []);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const addImage = () => {
    if (!newImageUrl.trim()) return;
    setImages(imgs => [...imgs, newImageUrl.trim()]);
    setNewImageUrl('');
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload/image', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body: formData,
    });
    const data = await res.json();
    if (data.url) setImages(imgs => [...imgs, data.url]);
    else alert(data.error || 'Ошибка загрузки');
  };

  const removeImage = (idx) => setImages(imgs => imgs.filter((_, i) => i !== idx));

  const addSuppLink = () => setSuppLinks(l => [...l, { supplementId: '', link: '', promo: '', note: '' }]);
  const updateSuppLink = (idx, field, val) => setSuppLinks(l => l.map((s, i) => i === idx ? { ...s, [field]: val } : s));
  const removeSuppLink = (idx) => setSuppLinks(l => l.filter((_, i) => i !== idx));

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        title, description, price: Number(price) || 0, available, coverImage,
        content: { html, images },
        supplements: suppLinks.filter(s => s.link || s.supplementId),
      };
      protocol?.id
        ? await req('PUT', `/admin/protocols/${protocol.id}`, payload)
        : await req('POST', '/admin/protocols', payload);
      onSave();
      onClose();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={protocol ? 'Редактировать протокол' : 'Новый протокол'} onClose={onClose} width={780}>
      <div style={{ display: 'flex', gap: 12 }}>
        <Input label="Название" value={title} onChange={setTitle} placeholder="Протокол здоровья кишечника" style={{ flex: 3 }} />
        <Input label="Цена (0 = бесплатно)" value={price} onChange={setPrice} type="number" style={{ flex: 1 }} />
      </div>
      <Input label="Обложка (URL картинки)" value={coverImage} onChange={setCoverImage} placeholder="https://..." />
      <Textarea label="Краткое описание" value={description} onChange={setDescription} placeholder="Что включает протокол..." rows={2} />

      <RichEditor value={html} onChange={setHtml} placeholder="Подробное описание протокола..." />

      {/* КАРТИНКИ */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.ink2, marginBottom: 8, letterSpacing: 0.5 }}>КАРТИНКИ (ссылки)</div>
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', border: `1px dashed ${C.border}`, borderRadius: 10, cursor: 'pointer', fontSize: 14, color: C.ink2 }}>
            📁 Загрузить с компьютера
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) uploadImage(e.target.files[0]); }} />
          </label>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {images.map((img, i) => (
            <div key={i} style={{ position: 'relative', width: 80, height: 80 }}>
              <img src={img} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: `1px solid ${C.border}` }} />
              <button onClick={() => removeImage(i)}
                style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: C.red, border: 'none', color: '#fff', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* БАДЫ */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.ink2, letterSpacing: 0.5 }}>ПРИКРЕПЛЁННЫЕ БАДЫ</div>
          <Btn onClick={addSuppLink} variant="outline" size="sm">+ Добавить БАД</Btn>
        </div>
        {suppLinks.map((s, i) => (
          <div key={i} style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px', marginBottom: 10 }}>
            {/* СТРОКА 1: картинка + название + удалить */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
              {s.image && <img src={s.image} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, border: `1px solid ${C.border}`, flexShrink: 0 }} />}
              <div style={{ flex: 1 }}>
                <input value={s.name || ''} onChange={e => updateSuppLink(i, 'name', e.target.value)}
                  placeholder="Название БАДа (например: Витамин D3)"
                  style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <button onClick={() => removeSuppLink(i)}
                style={{ padding: '8px 10px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, color: C.red, cursor: 'pointer', fontSize: 13, flexShrink: 0 }}>✕</button>
            </div>
            {/* СТРОКА 2: загрузка картинки */}
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: `1px dashed ${C.border}`, borderRadius: 8, cursor: 'pointer', fontSize: 12, color: C.ink3 }}>
                📁 {s.image ? 'Заменить фото' : 'Загрузить фото БАДа'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async e => {
                  if (!e.target.files[0]) return;
                  const formData = new FormData();
                  formData.append('file', e.target.files[0]);
                  const res = await fetch('/api/upload/image', { method: 'POST', headers: { 'Authorization': `Bearer ${getToken()}` }, body: formData });
                  const data = await res.json();
                  if (data.url) updateSuppLink(i, 'image', data.url);
                }} />
              </label>
            </div>
            {/* СТРОКА 3: ссылка + промокод */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input value={s.link || ''} onChange={e => updateSuppLink(i, 'link', e.target.value)}
                placeholder="Ссылка на покупку (iHerb, OZON и тд)"
                style={{ flex: 2, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none' }} />
              <input value={s.promo || ''} onChange={e => updateSuppLink(i, 'promo', e.target.value)}
                placeholder="Промокод"
                style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none' }} />
            </div>
            {/* СТРОКА 4: примечание */}
            <input value={s.note || ''} onChange={e => updateSuppLink(i, 'note', e.target.value)}
              placeholder="Примечание (дозировка, как принимать...)"
              style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
          <input type="checkbox" checked={available} onChange={e => setAvailable(e.target.checked)} />
          Протокол активен (виден пользователям)
        </label>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <Btn onClick={onClose} variant="ghost" style={{ flex: 1 }}>Отмена</Btn>
        <Btn onClick={save} disabled={!title || saving} variant="primary" style={{ flex: 2 }}>{saving ? 'Сохраняем...' : 'Сохранить'}</Btn>
      </div>
    </Modal>
  );
}

export default function Protocols({ flash }) {
  const [list, setList] = useState([]);
  const [supplements, setSupplements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const load = async () => {
    const [protocols, supps] = await Promise.all([
      req('GET', '/admin/protocols'),
      req('GET', '/admin/supplements'),
    ]);
    setList(Array.isArray(protocols) ? protocols : []);
    setSupplements(Array.isArray(supps) ? supps : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const del = async (id) => {
    if (!confirm('Удалить протокол?')) return;
    await req('DELETE', `/admin/protocols/${id}`);
    load(); flash('Удалено');
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.ink }}>Протоколы</div>
          <div style={{ fontSize: 14, color: C.ink3, marginTop: 2 }}>{list.length} протоколов</div>
        </div>
        <Btn onClick={() => setModal({})} variant="primary">+ Протокол</Btn>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {list.map(proto => (
          <Card key={proto.id} style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: C.ink }}>{proto.title}</div>
                  <Badge color={proto.available ? 'green' : 'gray'}>{proto.available ? 'Активен' : 'Скрыт'}</Badge>
                  <Badge color={proto.price > 0 ? 'gold' : 'blue'}>{proto.price > 0 ? `${proto.price} ₽` : 'Бесплатно'}</Badge>
                </div>
                {proto.description && <div style={{ fontSize: 13, color: C.ink2, marginBottom: 8 }}>{proto.description}</div>}
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: C.ink3 }}>
                  {proto.supplements?.length > 0 && <span>💊 {proto.supplements.length} БАД</span>}
                  {proto.content?.images?.length > 0 && <span>🖼 {proto.content.images.length} фото</span>}
                  {proto.content?.html && <span>📝 Есть описание</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginLeft: 16 }}>
                <Btn onClick={() => setModal(proto)} variant="outline" size="sm">Изменить</Btn>
                <Btn onClick={() => del(proto.id)} variant="danger" size="sm">✕</Btn>
              </div>
            </div>
          </Card>
        ))}
        {!list.length && (
          <Card style={{ padding: 40, textAlign: 'center', color: C.ink3 }}>
            Протоколов ещё нет. Создай первый!
          </Card>
        )}
      </div>

      {modal !== null && (
        <ProtocolModal
          protocol={modal.id ? modal : null}
          supplements={supplements}
          onClose={() => setModal(null)}
          onSave={() => { load(); flash('Сохранено'); }}
        />
      )}
    </div>
  );
}
