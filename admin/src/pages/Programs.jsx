import { useState, useEffect } from 'react';
import { programs as programsApi, modules as modulesApi, lectures as lecturesApi } from '../api';
import { C, Spinner, Card, Btn, Modal, Input, Textarea } from '../components/UI';
import RichEditor from '../components/RichEditor';
import ImageUpload from '../components/ImageUpload';

const BLOCK_TYPES = [
  { type: 'intro',     label: '💬 Вступление' },
  { type: 'heading',   label: '📌 Заголовок' },
  { type: 'text',      label: '📝 Текст' },
  { type: 'highlight', label: '✨ Выделение' },
  { type: 'list',      label: '📋 Список' },
  { type: 'rules',     label: '📏 Правила' },
];

function BlockEditor({ block, onChange, onDelete, onMoveUp, onMoveDown }) {
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 10, background: C.white }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.ink3 }}>{BLOCK_TYPES.find(b => b.type === block.type)?.label}</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={onMoveUp} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, padding: '2px 6px', cursor: 'pointer', fontSize: 11 }}>↑</button>
          <button onClick={onMoveDown} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, padding: '2px 6px', cursor: 'pointer', fontSize: 11 }}>↓</button>
          <button onClick={onDelete} style={{ background: 'none', border: 'none', color: C.red, cursor: 'pointer', fontSize: 16, marginLeft: 4 }}>✕</button>
        </div>
      </div>

      {['intro', 'heading', 'text', 'highlight'].includes(block.type) && (
        <textarea value={block.text || ''} onChange={e => onChange({ ...block, text: e.target.value })}
          placeholder="Введи текст..." rows={block.type === 'text' ? 4 : 2}
          style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 14, fontFamily: 'Arial', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
      )}

      {block.type === 'list' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            {['check', 'cross'].map(s => (
              <button key={s} onClick={() => onChange({ ...block, style: s })}
                style={{ padding: '4px 12px', borderRadius: 20, border: `1px solid ${block.style === s ? C.green : C.border}`, background: block.style === s ? C.greenLL : C.white, color: block.style === s ? C.green : C.ink2, cursor: 'pointer', fontSize: 13 }}>
                {s === 'check' ? '✓ Добавить' : '✕ Убрать'}
              </button>
            ))}
          </div>
          <textarea value={(block.items || []).join('\n')} onChange={e => onChange({ ...block, items: e.target.value.split('\n') })}
            placeholder="Каждый пункт с новой строки" rows={4}
            style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 14, fontFamily: 'Arial', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
        </div>
      )}

      {block.type === 'rules' && (
        <div>
          <div style={{ fontSize: 12, color: C.ink3, marginBottom: 8 }}>Формат: «01 | Текст правила» — каждое с новой строки</div>
          <textarea
            value={(block.items || []).map(r => `${r.num} | ${r.text}`).join('\n')}
            onChange={e => onChange({ ...block, items: e.target.value.split('\n').filter(Boolean).map(line => { const [num, ...rest] = line.split(' | '); return { num: num?.trim(), text: rest.join(' | ')?.trim() }; }) })}
            placeholder={'01 | Завтракай в течение часа\n02 | Не пей воду во время еды'} rows={5}
            style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 14, fontFamily: 'Arial', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
        </div>
      )}
    </div>
  );
}

function LectureModal({ lecture, moduleId, onClose, onSave }) {
  const [title, setTitle] = useState(lecture?.title || '');
  const [duration, setDuration] = useState(lecture?.duration || '');
  const [videoUrl, setVideoUrl] = useState(lecture?.videoUrl || '');
  const [pts, setPts] = useState(String(lecture?.points || 10));
  const [tasksText, setTasksText] = useState((lecture?.tasks || []).join('\n'));
  const [checklistText, setChecklistText] = useState((lecture?.content?.checklist || []).join('\n'));
  const [html, setHtml] = useState(lecture?.content?.html || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        moduleId,
        title,
        duration,
        videoUrl,
        points: Number(pts) || 10,
        tasks: tasksText.split('\n').filter(Boolean),
        content: {
          html,
          checklist: checklistText.split('\n').filter(Boolean),
        },
      };
      lecture?.id ? await lecturesApi.update(lecture.id, payload) : await lecturesApi.create(payload);
      onSave();
      onClose();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={lecture ? 'Редактировать урок' : 'Новый урок'} onClose={onClose} width={780}>
      <div style={{ display: 'flex', gap: 12 }}>
        <Input label="Название урока" value={title} onChange={setTitle} placeholder="Базовые правила питания" style={{ flex: 3 }} />
        <Input label="Длит." value={duration} onChange={setDuration} placeholder="28 мин" style={{ flex: 1 }} />
        <Input label="Баллы" value={pts} onChange={setPts} type="number" style={{ flex: 1 }} />
      </div>
      <Input label="Ссылка на видео" value={videoUrl} onChange={setVideoUrl} placeholder="https://..." />
      <Textarea label="Задачи в трекер (каждая с новой строки)" value={tasksText} onChange={setTasksText} placeholder="Заполнить анкету&#10;Изучить гайд" rows={2} />

      <RichEditor value={html} onChange={setHtml} placeholder="Начни писать конспект урока..." />

      <Textarea label="Чеклист (каждый пункт с новой строки)" value={checklistText} onChange={setChecklistText} placeholder="Познакомилась с программой&#10;Изучила правила" rows={3} />

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <Btn onClick={onClose} variant="ghost" style={{ flex: 1 }}>Отмена</Btn>
        <Btn onClick={save} disabled={!title || saving} variant="primary" style={{ flex: 2 }}>{saving ? 'Сохраняем...' : 'Сохранить'}</Btn>
      </div>
    </Modal>
  );
}

function ModuleModal({ mod, programId, onClose, onSave }) {
  const [data, setData] = useState(mod || { title: '', subtitle: '', num: '', color: '#5A7A5A', order: 0 });
  const [saving, setSaving] = useState(false);
  const colors = ['#5A7A5A', '#7A9E5A', '#8B7355', '#6B7EA8', '#7B6EA8', '#A86B6B', '#6B8EC4', '#C4A26B'];

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...data, programId };
      mod?.id ? await modulesApi.update(mod.id, payload) : await modulesApi.create(payload);
      onSave();
      onClose();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={mod ? 'Редактировать модуль' : 'Новый модуль'} onClose={onClose}>
      <div style={{ display: 'flex', gap: 12 }}>
        <Input label="Номер" value={data.num} onChange={v => setData(d => ({ ...d, num: v }))} placeholder="01" style={{ flex: 1 }} />
        <Input label="Порядок" value={String(data.order)} onChange={v => setData(d => ({ ...d, order: Number(v) }))} type="number" style={{ flex: 1 }} />
      </div>
      <Input label="Название" value={data.title} onChange={v => setData(d => ({ ...d, title: v }))} placeholder="Чек-ап и подготовка" />
      <Input label="Подзаголовок" value={data.subtitle || ''} onChange={v => setData(d => ({ ...d, subtitle: v }))} placeholder="Знакомство с программой" />
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.ink2, marginBottom: 8, letterSpacing: 0.5 }}>ЦВЕТ</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {colors.map(c => (
            <div key={c} onClick={() => setData(d => ({ ...d, color: c }))}
              style={{ width: 32, height: 32, borderRadius: 8, background: c, cursor: 'pointer', border: data.color === c ? '3px solid #1A1A1A' : '3px solid transparent' }} />
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn onClick={onClose} variant="ghost" style={{ flex: 1 }}>Отмена</Btn>
        <Btn onClick={save} disabled={!data.title || saving} variant="primary" style={{ flex: 2 }}>{saving ? 'Сохраняем...' : 'Сохранить'}</Btn>
      </div>
    </Modal>
  );
}

function ProgramModal({ prog, onClose, onSave }) {
  const [data, setData] = useState(prog || { title: '', subtitle: '', desc: '', icon: '🌿', color: '#2D4A2D', available: false, price: 0, order: 0 });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      prog?.id ? await programsApi.update(prog.id, data) : await programsApi.create(data);
      onSave();
      onClose();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={prog ? 'Редактировать программу' : 'Новая программа'} onClose={onClose}>
      <Input label="Название" value={data.title} onChange={v => setData(d => ({ ...d, title: v }))} placeholder="Здоровье кишечника" />
      <Input label="Подзаголовок" value={data.subtitle || ''} onChange={v => setData(d => ({ ...d, subtitle: v }))} placeholder="V Форме" />
      <ImageUpload
        label="Обложка"
        hint="Рекомендуемый размер: 1200×400 px (соотношение 4:1)"
        value={data.coverImage || ''}
        onChange={v => setData(d => ({ ...d, coverImage: v }))}
        ratio="4/1"
      />
      <Textarea label="Описание" value={data.desc || ''} onChange={v => setData(d => ({ ...d, desc: v }))} placeholder="Описание программы..." />
      <div style={{ display: 'flex', gap: 12 }}>
        <Input label="Иконка" value={data.icon || ''} onChange={v => setData(d => ({ ...d, icon: v }))} placeholder="🌿" style={{ flex: 1 }} />
        <Input label="Цвет" value={data.color || ''} onChange={v => setData(d => ({ ...d, color: v }))} placeholder="#2D4A2D" style={{ flex: 1 }} />
        <Input label="Цена (руб.)" value={String(data.price || 0)} onChange={v => setData(d => ({ ...d, price: Number(v) }))} type="number" style={{ flex: 1 }} />
        <Input label="Порядок" value={String(data.order)} onChange={v => setData(d => ({ ...d, order: Number(v) }))} type="number" style={{ flex: 1 }} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
          <input type="checkbox" checked={data.available} onChange={e => setData(d => ({ ...d, available: e.target.checked }))} />
          Программа доступна для прохождения
        </label>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn onClick={onClose} variant="ghost" style={{ flex: 1 }}>Отмена</Btn>
        <Btn onClick={save} disabled={!data.title || saving} variant="primary" style={{ flex: 2 }}>{saving ? 'Сохраняем...' : 'Сохранить'}</Btn>
      </div>
    </Modal>
  );
}

export default function Programs({ flash }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openProg, setOpenProg] = useState(null);
  const [progModal, setProgModal] = useState(null);
  const [modModal, setModModal] = useState(null);
  const [lecModal, setLecModal] = useState(null);

  const load = () => {
    setLoading(true);
    programsApi.getAll().then(setList).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const deleteProg = async (id) => {
    if (!confirm('Удалить программу?')) return;
    try { await programsApi.delete(id); load(); flash('Удалено'); }
    catch (e) { flash('Ошибка', 'error'); }
  };

  const deleteMod = async (id) => {
    if (!confirm('Удалить модуль?')) return;
    try { await modulesApi.delete(id); load(); flash('Удалено'); }
    catch (e) { flash('Ошибка', 'error'); }
  };

  const deleteLec = async (id) => {
    if (!confirm('Удалить урок?')) return;
    try { await lecturesApi.delete(id); load(); flash('Удалено'); }
    catch (e) { flash('Ошибка', 'error'); }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.ink }}>Программы</div>
          <div style={{ fontSize: 14, color: C.ink3, marginTop: 2 }}>{list.length} программ</div>
        </div>
        <Btn onClick={() => setProgModal({})} variant="primary">+ Программа</Btn>
      </div>

      {list.map(prog => (
        <Card key={prog.id} style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
          <div style={{ background: prog.color || C.green, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 28 }}>{prog.icon || '🌿'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{prog.title}</div>
              <div style={{ fontSize: 13, color: '#fff', marginTop: 2 }}>
                {(prog.modules || []).length} модулей · {prog.available ? '✓ Активна' : '⏸ Скрыта'} {prog.price > 0 ? `· ${prog.price} руб.` : '· Бесплатно'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn onClick={() => setProgModal(prog)} variant="ghost" size="sm" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none' }}>Изменить</Btn>
              <Btn onClick={() => setOpenProg(openProg === prog.id ? null : prog.id)} variant="ghost" size="sm" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none' }}>
                {openProg === prog.id ? 'Свернуть ▲' : 'Модули ▼'}
              </Btn>
              <Btn onClick={() => deleteProg(prog.id)} variant="ghost" size="sm" style={{ background: 'rgba(255,255,255,0.15)', color: '#ffaaaa', border: 'none' }}>✕</Btn>
            </div>
          </div>

          {openProg === prog.id && (
            <div style={{ padding: 20 }}>
              {(prog.modules || []).map(mod => (
                <div key={mod.id} style={{ border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 12, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: C.bg }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: mod.color || C.green, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{mod.num}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: C.ink }}>{mod.title}</div>
                      {mod.subtitle && <div style={{ fontSize: 12, color: C.ink3 }}>{mod.subtitle}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Btn onClick={() => setLecModal({ moduleId: mod.id })} variant="outline" size="sm">+ Урок</Btn>
                      <Btn onClick={() => setModModal({ ...mod, progId: prog.id })} variant="ghost" size="sm">Изменить</Btn>
                      <Btn onClick={() => deleteMod(mod.id)} variant="danger" size="sm">✕</Btn>
                    </div>
                  </div>
                  <div style={{ padding: '8px 16px 12px' }}>
                    {(mod.lectures || []).map(lec => (
                      <div key={lec.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 6, background: C.white }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: (mod.color || C.green) + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: mod.color || C.green, flexShrink: 0 }}>▷</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{lec.title}</div>
                          <div style={{ fontSize: 12, color: C.ink3 }}>{lec.duration || '—'} · {lec.points || 10} баллов · {(lec.content?.sections || []).length} блоков</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Btn onClick={() => setLecModal({ ...lec, moduleId: mod.id })} variant="ghost" size="sm">Изменить</Btn>
                          <Btn onClick={() => deleteLec(lec.id)} variant="danger" size="sm">✕</Btn>
                        </div>
                      </div>
                    ))}
                    {(mod.lectures || []).length === 0 && <div style={{ fontSize: 13, color: C.ink3, padding: '8px 0' }}>Нет уроков — добавь первый</div>}
                  </div>
                </div>
              ))}
              <Btn onClick={() => setModModal({ progId: prog.id })} variant="outline" size="sm">+ Добавить модуль</Btn>
            </div>
          )}
        </Card>
      ))}

      {list.length === 0 && (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
          <div style={{ fontSize: 16, color: C.ink3, marginBottom: 20 }}>Программ ещё нет</div>
          <Btn onClick={() => setProgModal({})} variant="primary">Создать первую программу</Btn>
        </Card>
      )}

      {progModal !== null && (
        <ProgramModal prog={progModal.id ? progModal : null} onClose={() => setProgModal(null)} onSave={() => { load(); flash('Сохранено'); setProgModal(null); }} />
      )}
      {modModal !== null && (
        <ModuleModal mod={modModal.id ? modModal : null} programId={modModal.progId} onClose={() => setModModal(null)} onSave={() => { load(); flash('Сохранено'); setModModal(null); }} />
      )}
      {lecModal !== null && (
        <LectureModal lecture={lecModal.id ? lecModal : null} moduleId={lecModal.moduleId} onClose={() => setLecModal(null)} onSave={() => { load(); flash('Сохранено'); setLecModal(null); }} />
      )}
    </div>
  );
}
