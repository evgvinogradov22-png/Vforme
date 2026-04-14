import { useState, useEffect } from 'react';
import { recipes as recipesApi } from '../api';
import { C, Spinner, Card, Btn, Modal, Input, Textarea, Table } from '../components/UI';
import AiFillButton from '../components/AiFillButton';

function RecipeModal({ recipe, onClose, onSave }) {
  const [data, setData] = useState(recipe || { title: '', cat: 'Завтрак', time: '', kcal: '', protein: '', fat: '', carbs: '', fact: '', dietTags: [], imageUrl: '' });
  const [ingredientsText, setIngredientsText] = useState((recipe?.ingredients || []).join('\n'));
  const [stepsText, setStepsText] = useState((recipe?.steps || []).join('\n'));
  const [dietTagsText, setDietTagsText] = useState((recipe?.dietTags || []).join(', '));
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Загружаем картинку сразу при выборе файла — и при create, и при edit
  const uploadImage = async (file) => {
    if (!file) return;
    setUploadingImg(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch('/api/upload/image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('vforme_admin_token')}` },
        body: fd,
      });
      const res = await r.json();
      if (res.url) setData(d => ({ ...d, imageUrl: res.url }));
      else alert(res.error || 'Не удалось загрузить');
    } catch (e) { alert('Ошибка: ' + e.message); }
    finally { setUploadingImg(false); }
  };

  const aiGenerate = async () => {
    if (!data.title.trim() && !ingredientsText.trim()) {
      return alert('Сначала заполни название и/или ингредиенты');
    }
    setAiLoading(true);
    try {
      const r = await fetch('/api/admin/recipes/ai-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('vforme_admin_token')}`,
        },
        body: JSON.stringify({
          title: data.title,
          ingredients: ingredientsText,
          steps: stepsText,
        }),
      });
      const ai = await r.json();
      if (ai.error) return alert(ai.error);
      setData(d => ({
        ...d,
        kcal: ai.kcal || d.kcal,
        protein: ai.protein || d.protein,
        fat: ai.fat || d.fat,
        carbs: ai.carbs || d.carbs,
        fact: ai.fact || d.fact,
        dietTags: Array.isArray(ai.dietTags) && ai.dietTags.length > 0 ? ai.dietTags : (d.dietTags || []),
      }));
      if (Array.isArray(ai.dietTags) && ai.dietTags.length > 0) {
        setDietTagsText(ai.dietTags.join(', '));
      }
    } catch (e) { alert('Ошибка AI: ' + e.message); }
    finally { setAiLoading(false); }
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        ingredients: ingredientsText.split('\n').filter(Boolean),
        steps: stepsText.split('\n').filter(Boolean),
        dietTags: dietTagsText.split(',').map(t => t.trim()).filter(Boolean),
        kcal: data.kcal ? Number(data.kcal) : null,
        protein: data.protein ? Number(data.protein) : null,
        fat: data.fat ? Number(data.fat) : null,
        carbs: data.carbs ? Number(data.carbs) : null,
      };
      if (recipe?.id) {
        // При редактировании — чистый JSON PUT. Картинка уже загружена в data.imageUrl.
        await recipesApi.update(recipe.id, payload);
      } else {
        // При создании — imageUrl уже записан через uploadImage.
        const fd = new FormData();
        fd.append('data', JSON.stringify(payload));
        await recipesApi.create(fd);
      }
      onSave();
      onClose();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const cats = ['Завтрак', 'Обед', 'Ужин', 'Перекус', 'Напитки'];

  return (
    <Modal title={recipe ? 'Редактировать рецепт' : 'Новый рецепт'} onClose={onClose} width={600}>
      <Input label="Название" value={data.title} onChange={v => setData(d => ({ ...d, title: v }))} placeholder="Шакшука" />
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.ink2, marginBottom: 8, letterSpacing: 0.5 }}>КАТЕГОРИЯ</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {cats.map(c => (
            <button key={c} onClick={() => setData(d => ({ ...d, cat: c }))}
              style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${data.cat === c ? C.green : C.border}`, background: data.cat === c ? C.green : C.white, color: data.cat === c ? '#fff' : C.ink2, cursor: 'pointer', fontSize: 13 }}>{c}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <Input label="Время" value={data.time || ''} onChange={v => setData(d => ({ ...d, time: v }))} placeholder="20 мин" style={{ flex: 1 }} />
        <Input label="Ккал" value={data.kcal || ''} onChange={v => setData(d => ({ ...d, kcal: v }))} placeholder="300" type="number" style={{ flex: 1 }} />
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <Input label="Белки (г)" value={data.protein || ''} onChange={v => setData(d => ({ ...d, protein: v }))} type="number" style={{ flex: 1 }} />
        <Input label="Жиры (г)" value={data.fat || ''} onChange={v => setData(d => ({ ...d, fat: v }))} type="number" style={{ flex: 1 }} />
        <Input label="Углеводы (г)" value={data.carbs || ''} onChange={v => setData(d => ({ ...d, carbs: v }))} type="number" style={{ flex: 1 }} />
      </div>
      <Textarea label="Ингредиенты (каждый с новой строки)" value={ingredientsText} onChange={setIngredientsText} placeholder="Яйца — 4 шт.&#10;Томаты — 2 шт." rows={4} />
      <Textarea label="Шаги приготовления" value={stepsText} onChange={setStepsText} placeholder="Обжарить лук.&#10;Добавить томаты." rows={4} />

      {/* AI генератор */}
      <div style={{ marginBottom: 16 }}>
        <Btn onClick={aiGenerate} disabled={aiLoading} variant="outline" style={{ width: '100%' }}>
          {aiLoading ? '🪄 Считаем...' : '🪄 Посчитать КБЖУ и факт через AI'}
        </Btn>
        <div style={{ fontSize: 11, color: C.ink3, marginTop: 6, textAlign: 'center' }}>
          AI заполнит ккал, белки, жиры, углеводы, факт и диет-тэги на основе ингредиентов
        </div>
      </div>

      <Textarea label="Интересный факт" value={data.fact || ''} onChange={v => setData(d => ({ ...d, fact: v }))} placeholder="Польза блюда..." rows={2} />
      <Input label="Диет-тэги (через запятую)" value={dietTagsText} onChange={setDietTagsText} placeholder="кето, без глютена, высокобелковое" />
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.ink2, marginBottom: 8, letterSpacing: 0.5 }}>ФОТО</div>
        {data.imageUrl && (
          <img src={data.imageUrl} alt="" style={{ width: 140, height: 105, objectFit: 'cover', borderRadius: 10, border: `1px solid ${C.border}`, display: 'block', marginBottom: 8 }} />
        )}
        <label style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 16px', border: `1px dashed ${C.border}`, borderRadius: 10,
          cursor: uploadingImg ? 'wait' : 'pointer', fontSize: 14, color: C.ink2,
        }}>
          {uploadingImg ? 'Загружаем…' : (data.imageUrl ? '🔄 Заменить фото' : '📷 Загрузить фото')}
          <input type="file" accept="image/*" style={{ display: 'none' }}
            onClick={e => { e.target.value = ''; }}
            onChange={e => { if (e.target.files[0]) uploadImage(e.target.files[0]); }} />
        </label>
        {data.imageUrl && (
          <button type="button" onClick={() => setData(d => ({ ...d, imageUrl: '' }))} style={{
            marginLeft: 8, padding: '10px 14px', border: `1px solid ${C.border}`, borderRadius: 10,
            background: 'none', cursor: 'pointer', fontSize: 12, color: C.red,
          }}>✕ Убрать</button>
        )}
      </div>
      <div style={{ marginBottom: 12 }}>
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

export default function Recipes({ flash }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const load = () => { recipesApi.getAll().then(setList).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const del = async (id) => {
    if (!confirm('Удалить рецепт?')) return;
    try { await recipesApi.delete(id); setList(p => p.filter(x => x.id !== id)); flash('Удалено'); }
    catch (e) { flash('Ошибка', 'error'); }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.ink }}>Рецепты</div>
          <div style={{ fontSize: 14, color: C.ink3, marginTop: 2 }}>{list.length} рецептов</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <AiFillButton type="recipe" onFilled={(data) => setModal({ title: data.title, cat: data.cat, time: data.time, ingredients: data.ingredients || [], steps: data.steps || [], kcal: data.kcal, protein: data.protein, fat: data.fat, carbs: data.carbs, fact: data.fact, dietTags: data.dietTags || [], clubOnly: data.clubOnly })} />
          <Btn onClick={() => setModal({})} variant="primary">+ Рецепт</Btn>
        </div>
      </div>

      <Card style={{ padding: 0 }}>
        <Table
          columns={[
            { title: 'Название', key: 'title', render: (v, row) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {row.imageUrl && <img src={row.imageUrl} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />}
                <div>
                  <div style={{ fontWeight: 600, color: C.ink }}>{v}</div>
                  <div style={{ fontSize: 12, color: C.ink3 }}>{row.cat}{row.time ? ' · ' + row.time : ''}</div>
                </div>
              </div>
            )},
            { title: 'Ккал', key: 'kcal', render: v => v ? v + ' ккал' : '—' },
            { title: 'Автор', key: 'authorName', render: v => v || '—' },
            { title: 'Лайки', key: 'likes' },
            { title: '', key: 'id', render: (v, row) => (
              <div style={{ display: 'flex', gap: 6 }}>
                <Btn onClick={() => setModal(row)} variant="ghost" size="sm">Изменить</Btn>
                <Btn onClick={() => del(v)} variant="danger" size="sm">✕</Btn>
              </div>
            )},
          ]}
          data={list}
        />
      </Card>

      {modal !== null && (
        <RecipeModal key={JSON.stringify(modal)} recipe={Object.keys(modal).length > 0 ? modal : null} onClose={() => setModal(null)} onSave={() => { load(); flash('Сохранено'); }} />
      )}
    </div>
  );
}
