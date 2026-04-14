import { useState } from 'react';
import { ai } from '../api';
import { C, Btn, Modal } from './UI';

export default function AiFillButton({ type, onFilled }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const labels = {
    protocol: 'протокол',
    scheme: 'схему БАДов',
    recipe: 'рецепт',
  };

  const placeholders = {
    protocol: 'Вставь текст о протоколе здоровья — название, описание, какие БАДы принимать, в каком порядке...',
    scheme: 'Вставь текст о схеме приёма БАДов — название, какие добавки, дозировки, когда принимать...',
    recipe: 'Вставь текст рецепта — название, ингредиенты, шаги приготовления...',
  };

  const handleFill = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    try {
      const result = await ai.fill(type, text);
      onFilled(result);
      setOpen(false);
      setText('');
    } catch (e) {
      setError(e.message || 'Ошибка AI');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Btn onClick={() => setOpen(true)} variant="gold" size="sm">
        AI заполнить {labels[type]}
      </Btn>

      {open && (
        <Modal title={`AI заполнение: ${labels[type]}`} onClose={() => setOpen(false)} width={700}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: C.ink3, marginBottom: 8 }}>
              Вставь текст — AI разберёт его на поля и заполнит форму автоматически
            </div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={placeholders[type]}
              rows={12}
              style={{
                width: '100%', border: `1px solid ${C.border}`, borderRadius: 12,
                padding: '14px 16px', fontSize: 14, fontFamily: 'Arial, sans-serif',
                color: C.ink, resize: 'vertical', boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{ background: '#FFF0F0', border: '1px solid #FFCCCC', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#CC4444', marginBottom: 12 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <Btn onClick={() => setOpen(false)} variant="ghost" style={{ flex: 1 }}>Отмена</Btn>
            <Btn onClick={handleFill} disabled={!text.trim() || loading} variant="primary" style={{ flex: 2 }}>
              {loading ? 'AI обрабатывает...' : 'Заполнить'}
            </Btn>
          </div>
        </Modal>
      )}
    </>
  );
}
