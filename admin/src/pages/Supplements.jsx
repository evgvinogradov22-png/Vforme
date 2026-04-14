import { useState, useEffect } from 'react';
import { schemes as schemesApi, supplements as supplementsApi, programs as programsApi } from '../api';
import { C, Spinner, Card, Btn, Modal, Input, Textarea } from '../components/UI';
import ImageUpload from '../components/ImageUpload';
import AiFillButton from '../components/AiFillButton';

function SupplementModal({ supplement, schemeId, onClose, onSave }) {
  const [data, setData] = useState(supplement || { schemeId, name: '', brand: '', dose: '', time: '', note: '', buyUrl: '', image: '', order: 0 });
  const [uploading, setUploading] = useState(false);

  const getToken = () => localStorage.getItem('vforme_admin_token');

  const uploadImage = async (file) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload/image', { method: 'POST', headers: { 'Authorization': `Bearer ${getToken()}` }, body: formData });
      const result = await res.json();
      if (result.url) setData(d => ({ ...d, image: result.url }));
    } catch(e) {}
    setUploading(false);
  };
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      supplement?.id ? await supplementsApi.update(supplement.id, { ...data, schemeId }) : await supplementsApi.create({ ...data, schemeId });
      onSave(); onClose();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={supplement ? 'Редактировать добавку' : 'Новая добавка'} onClose={onClose}>
      <Input label="Название" value={data.name} onChange={v => setData(d => ({ ...d, name: v }))} placeholder="Магний глицинат" />
      <Input label="Дозировка" value={data.dose || ''} onChange={v => setData(d => ({ ...d, dose: v }))} placeholder="400 мг" />
      <Input label="Время приёма" value={data.time || ''} onChange={v => setData(d => ({ ...d, time: v }))} placeholder="Вечером перед сном" />
      <Textarea label="Примечание" value={data.note || ''} onChange={v => setData(d => ({ ...d, note: v }))} placeholder="Расслабляет, улучшает сон..." rows={2} />
      <Input label="Бренд" value={data.brand || ''} onChange={v => setData(d => ({ ...d, brand: v }))} placeholder="Nature's Way, Solgar..." />
      <Input label="Ссылка где купить" value={data.buyUrl || ''} onChange={v => setData(d => ({ ...d, buyUrl: v }))} placeholder="https://..." />
      <Input label="Промокод" value={data.promo || ''} onChange={v => setData(d => ({ ...d, promo: v }))} placeholder="NUTRIKRIS10" />
      <ImageUpload
        label="Фото продукта"
        hint="Рекомендуемый размер: 600×600 px (квадрат)"
        value={data.image || ''}
        onChange={v => setData(d => ({ ...d, image: v }))}
        ratio="1/1"
      />
      <Input label="Порядок" value={String(data.order)} onChange={v => setData(d => ({ ...d, order: Number(v) }))} type="number" />
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <Btn onClick={onClose} variant="ghost" style={{ flex: 1 }}>Отмена</Btn>
        <Btn onClick={save} disabled={!data.name || saving} variant="primary" style={{ flex: 2 }}>{saving ? 'Сохраняем...' : 'Сохранить'}</Btn>
      </div>
    </Modal>
  );
}

function SchemeModal({ scheme, programs, onClose, onSave }) {
  const [data, setData] = useState(scheme || { title: '', desc: '', programId: '' });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      scheme?.id ? await schemesApi.update(scheme.id, data) : await schemesApi.create(data);
      onSave(); onClose();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={scheme ? 'Редактировать схему' : 'Новая схема'} onClose={onClose}>
      <Input label="Название" value={data.title} onChange={v => setData(d => ({ ...d, title: v }))} placeholder="Базовая схема — кишечник" />
      <ImageUpload
        label="Обложка"
        hint="Рекомендуемый размер: 1200×400 px (соотношение 4:1)"
        value={data.coverImage || ''}
        onChange={v => setData(d => ({ ...d, coverImage: v }))}
        ratio="4/1"
      />
      <Textarea label="Описание" value={data.desc || ''} onChange={v => setData(d => ({ ...d, desc: v }))} placeholder="Описание схемы..." rows={2} />
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.ink2, marginBottom: 8, letterSpacing: 0.5 }}>ПРОГРАММА</div>
        <select value={data.programId || ''} onChange={e => setData(d => ({ ...d, programId: e.target.value }))}
          style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 14, color: C.ink, background: C.white, outline: 'none' }}>
          <option value="">— Без программы —</option>
          {programs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, color: data.clubOnly ? '#C4A26B' : undefined }}>
          <input type="checkbox" checked={data.clubOnly || false} onChange={e => setData(d => ({ ...d, clubOnly: e.target.checked }))} />
          Только для клуба
        </label>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <Btn onClick={onClose} variant="ghost" style={{ flex: 1 }}>Отмена</Btn>
        <Btn onClick={save} disabled={!data.title || saving} variant="primary" style={{ flex: 2 }}>{saving ? 'Сохраняем...' : 'Сохранить'}</Btn>
      </div>
    </Modal>
  );
}

export default function Supplements({ flash }) {
  const [schemeList, setSchemeList] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openScheme, setOpenScheme] = useState(null);
  const [schemeModal, setSchemeModal] = useState(null);
  const [supModal, setSupModal] = useState(null);

  const load = () => {
    Promise.all([schemesApi.getAll(), programsApi.getAll()])
      .then(([s, p]) => { setSchemeList(s); setPrograms(p); })
      .catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const delScheme = async (id) => {
    if (!confirm('Удалить схему?')) return;
    try { await schemesApi.delete(id); setSchemeList(p => p.filter(x => x.id !== id)); flash('Удалено'); }
    catch (e) { flash('Ошибка', 'error'); }
  };

  const delSup = async (id, schemeId) => {
    if (!confirm('Удалить добавку?')) return;
    try {
      await supplementsApi.delete(id);
      setSchemeList(p => p.map(s => s.id === schemeId ? { ...s, items: (s.items || []).filter(x => x.id !== id) } : s));
      flash('Удалено');
    } catch (e) { flash('Ошибка', 'error'); }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.ink }}>Схемы БАДов</div>
          <div style={{ fontSize: 14, color: C.ink3, marginTop: 2 }}>{schemeList.length} схем</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <AiFillButton type="scheme" onFilled={(data) => setSchemeModal({ title: data.title, desc: data.desc, tags: data.tags, clubOnly: data.clubOnly, _aiItems: data.items })} />
          <Btn onClick={() => setSchemeModal({})} variant="primary">+ Схема</Btn>
        </div>
      </div>

      {schemeList.map(scheme => (
        <Card key={scheme.id} style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: C.bg, borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 24 }}>💊</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>{scheme.title}</div>
              <div style={{ fontSize: 13, color: C.ink3 }}>{(scheme.items || []).length} добавок</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn onClick={() => setSupModal({ schemeId: scheme.id })} variant="outline" size="sm">+ Добавка</Btn>
              <Btn onClick={() => setSchemeModal(scheme)} variant="ghost" size="sm">Изменить</Btn>
              <Btn onClick={() => setOpenScheme(openScheme === scheme.id ? null : scheme.id)} variant="ghost" size="sm">
                {openScheme === scheme.id ? 'Свернуть' : 'Показать'}
              </Btn>
              <Btn onClick={() => delScheme(scheme.id)} variant="danger" size="sm">✕</Btn>
            </div>
          </div>

          {openScheme === scheme.id && (
            <div style={{ padding: 16 }}>
              {(scheme.items || []).map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 8, background: C.white }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: C.ink, marginBottom: 4 }}>{item.name}</div>
                    <div style={{ fontSize: 13, color: C.ink3 }}>💊 {item.dose} · ⏰ {item.time}</div>
                    {item.note && <div style={{ fontSize: 13, color: C.ink2, marginTop: 4 }}>{item.note}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Btn onClick={() => setSupModal({ ...item, schemeId: scheme.id })} variant="ghost" size="sm">Изменить</Btn>
                    <Btn onClick={() => delSup(item.id, scheme.id)} variant="danger" size="sm">✕</Btn>
                  </div>
                </div>
              ))}
              {(scheme.items || []).length === 0 && <div style={{ fontSize: 13, color: C.ink3 }}>Нет добавок</div>}
            </div>
          )}
        </Card>
      ))}

      {schemeList.length === 0 && (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💊</div>
          <div style={{ fontSize: 16, color: C.ink3, marginBottom: 20 }}>Схем ещё нет</div>
          <Btn onClick={() => setSchemeModal({})} variant="primary">Создать первую схему</Btn>
        </Card>
      )}

      {schemeModal !== null && (
        <SchemeModal scheme={schemeModal.id ? schemeModal : null} programs={programs} onClose={() => setSchemeModal(null)} onSave={() => { load(); flash('Сохранено'); }} />
      )}
      {supModal !== null && (
        <SupplementModal supplement={supModal.id ? supModal : null} schemeId={supModal.schemeId} onClose={() => setSupModal(null)} onSave={() => { load(); flash('Сохранено'); }} />
      )}
    </div>
  );
}
