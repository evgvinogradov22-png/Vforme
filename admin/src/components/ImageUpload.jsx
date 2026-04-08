import { useState } from 'react';
import { C } from './UI';

const getToken = () => localStorage.getItem('vforme_admin_token');

/**
 * Загрузка картинки с превью.
 * Props:
 *   value     — текущий URL картинки
 *   onChange  — (url) => void
 *   label     — заголовок поля
 *   hint      — подсказка с рекомендуемым размером
 *   ratio     — соотношение сторон превью '16/5' | '1/1' | '4/3' (для визуального ориентира)
 */
export default function ImageUpload({ value, onChange, label, hint, ratio = '16/5' }) {
  const [uploading, setUploading] = useState(false);

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload/image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const data = await res.json();
      if (data.url) onChange(data.url);
      else alert(data.error || 'Не удалось загрузить');
    } catch (e) { alert('Ошибка: ' + e.message); }
    finally { setUploading(false); }
  };

  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <div style={{ fontSize: 12, fontWeight: 700, color: C.ink2, marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          {label}
        </div>
      )}
      {hint && (
        <div style={{ fontSize: 11, color: C.ink3, marginBottom: 8 }}>
          {hint}
        </div>
      )}

      {value ? (
        <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
          <img
            src={value}
            alt=""
            style={{
              display: 'block',
              maxWidth: '100%',
              maxHeight: 200,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              aspectRatio: ratio,
              objectFit: 'cover',
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <label style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', border: `1px dashed ${C.border}`, borderRadius: 8,
              cursor: 'pointer', fontSize: 12, color: C.ink2,
            }}>
              {uploading ? 'Загружаем…' : '🔄 Заменить'}
              <input type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => upload(e.target.files[0])} />
            </label>
            <button type="button" onClick={() => onChange('')} style={{
              padding: '8px 14px', border: `1px solid ${C.border}`, borderRadius: 8,
              background: 'none', cursor: 'pointer', fontSize: 12, color: C.red,
            }}>✕ Удалить</button>
          </div>
        </div>
      ) : (
        <label style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          padding: '24px 16px',
          border: `2px dashed ${C.border}`, borderRadius: 12,
          cursor: 'pointer', fontSize: 14, color: C.ink2,
          background: '#FAF8F2',
          aspectRatio: ratio,
          maxHeight: 200,
        }}>
          <span style={{ fontSize: 22 }}>📷</span>
          {uploading ? 'Загружаем…' : 'Загрузить картинку'}
          <input type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => upload(e.target.files[0])} />
        </label>
      )}
    </div>
  );
}
