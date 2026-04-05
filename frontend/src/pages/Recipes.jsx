import { useState, useEffect, useCallback } from 'react';
import { recipes as recipesApi } from '../api';
import { Spinner, BackHeader } from '../components/UI';
import { G, GLL, GOLD, BD, INK, INK2, INK3, OW, W, sans, serif } from '../utils/theme';

const CATS = ['Все', 'Завтрак', 'Обед', 'Ужин', 'Перекус', 'Напитки'];
const CAT_ICON = { Завтрак: '🌅', Обед: '☀️', Ужин: '🌙', Перекус: '🍎', Напитки: '🫖' };

export default function Recipes({ user, flash }) {
  const [recipeList, setRecipeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('Все');
  const [openRecipe, setOpenRecipe] = useState(null);
  const [addingRecipe, setAddingRecipe] = useState(false);
  const [newRecipe, setNewRecipe] = useState({ title: '', cat: 'Завтрак', time: '', ingredients: '', steps: '', fact: '' });
  const [newComment, setNewComment] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    recipesApi.getAll(cat)
      .then(setRecipeList)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [cat]);

  useEffect(() => { load(); }, [load]);

  const handleLike = async (id) => {
    try {
      const res = await recipesApi.like(id);
      setRecipeList(p => p.map(r => r.id === id ? { ...r, likes: res.likes } : r));
      if (openRecipe?.id === id) setOpenRecipe(r => ({ ...r, likes: res.likes }));
    } catch (e) {}
  };

  const handleComment = async (id) => {
    const text = newComment[id]?.trim();
    if (!text) return;
    try {
      const comment = await recipesApi.comment(id, text);
      setOpenRecipe(r => ({ ...r, comments: [...(r.comments || []), comment] }));
      setNewComment(p => ({ ...p, [id]: '' }));
    } catch (e) { flash('Ошибка при отправке комментария'); }
  };

  const handleAdd = async () => {
    if (!newRecipe.title.trim()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      const data = {
        title: newRecipe.title, cat: newRecipe.cat, time: newRecipe.time,
        ingredients: newRecipe.ingredients.split('\n').filter(Boolean),
        steps: newRecipe.steps.split('\n').filter(Boolean),
        fact: newRecipe.fact,
      };
      fd.append('data', JSON.stringify(data));
      await recipesApi.create(fd);
      setNewRecipe({ title: '', cat: 'Завтрак', time: '', ingredients: '', steps: '', fact: '' });
      setAddingRecipe(false);
      flash('Рецепт добавлен!');
      load();
    } catch (e) {
      flash('Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  const openOne = async (id) => {
    try {
      const r = await recipesApi.getOne(id);
      setOpenRecipe(r);
    } catch (e) {}
  };

  const inputStyle = { width: '100%', border: '1px solid ' + BD, borderRadius: 12, padding: '12px 14px', fontSize: 15, fontFamily: sans, color: INK, background: W, outline: 'none', boxSizing: 'border-box' };

  // ADD FORM
  if (addingRecipe) return (
    <div style={{ padding: '24px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => setAddingRecipe(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: INK2 }}>←</button>
        <div style={{ fontFamily: serif, fontSize: 24, fontWeight: 600, color: G }}>Добавить рецепт</div>
      </div>
      {[{ label: 'Название блюда', key: 'title', placeholder: 'Суп с брокколи' }, { label: 'Время приготовления', key: 'time', placeholder: '25 мин' }, { label: 'Интересный факт', key: 'fact', placeholder: 'Польза блюда...' }].map(f => (
        <div key={f.key} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: INK2, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>{f.label.toUpperCase()}</div>
          <input value={newRecipe[f.key]} onChange={e => setNewRecipe(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} style={inputStyle} />
        </div>
      ))}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: INK2, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>КАТЕГОРИЯ</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['Завтрак', 'Обед', 'Ужин', 'Перекус', 'Напитки'].map(c => (
            <button key={c} onClick={() => setNewRecipe(p => ({ ...p, cat: c }))} style={{ padding: '8px 16px', borderRadius: 20, border: '1px solid ' + (newRecipe.cat === c ? G : BD), background: newRecipe.cat === c ? G : W, color: newRecipe.cat === c ? W : INK2, fontFamily: sans, fontSize: 14, cursor: 'pointer' }}>{c}</button>
          ))}
        </div>
      </div>
      {[{ label: 'ИНГРЕДИЕНТЫ (каждый с новой строки)', key: 'ingredients', placeholder: 'Куриная грудка — 300 г\nКартофель — 2 шт.' }, { label: 'ШАГИ ПРИГОТОВЛЕНИЯ', key: 'steps', placeholder: 'Нарезать.\nОбжарить.' }].map(f => (
        <div key={f.key} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: INK2, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>{f.label}</div>
          <textarea value={newRecipe[f.key]} onChange={e => setNewRecipe(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} rows={4} style={{ ...inputStyle, resize: 'none' }} />
        </div>
      ))}
      <button onClick={handleAdd} disabled={saving} style={{ width: '100%', padding: '16px', background: saving ? '#EDE8E0' : GOLD, border: 'none', borderRadius: 30, color: W, fontFamily: sans, fontWeight: 700, fontSize: 16, cursor: saving ? 'not-allowed' : 'pointer', letterSpacing: 1 }}>
        {saving ? 'СОХРАНЯЕМ...' : 'СОХРАНИТЬ'}
      </button>
    </div>
  );

  // RECIPE DETAIL
  if (openRecipe) {
    const r = openRecipe;
    const commentText = newComment[r.id] || '';
    return (
      <div style={{ paddingBottom: 40 }}>
        <BackHeader onBack={() => setOpenRecipe(null)} title={r.title} subtitle={r.cat} />
        <div style={{ padding: '24px 20px' }}>
          {r.imageUrl && <img src={r.imageUrl} alt={r.title} style={{ width: '100%', borderRadius: 16, marginBottom: 20, display: 'block' }} />}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            {r.time && <span style={{ background: GLL, color: G, fontSize: 13, borderRadius: 20, padding: '5px 14px', fontFamily: sans }}>⏱ {r.time}</span>}
            {r.kcal && <span style={{ background: '#FBF5EB', color: GOLD, fontSize: 13, borderRadius: 20, padding: '5px 14px', border: '1px solid #EDD9B0', fontFamily: sans }}>~{r.kcal} ккал</span>}
            <span style={{ background: '#F9F7F4', color: INK3, fontSize: 13, borderRadius: 20, padding: '5px 14px', fontFamily: sans }}>
              {r.authorName === 'Кристина' ? '👩‍⚕️ Кристина' : '👤 Участница'}
            </span>
          </div>
          {r.kcal && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
              {[{ l: 'Белки', v: r.protein + 'г' }, { l: 'Жиры', v: r.fat + 'г' }, { l: 'Углеводы', v: r.carbs + 'г' }].map((s, i) => (
                <div key={i} style={{ flex: 1, background: GLL, borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
                  <div style={{ fontFamily: serif, fontSize: 18, fontWeight: 700, color: G }}>{s.v}</div>
                  <div style={{ fontSize: 11, color: '#3D6B3D', marginTop: 3, fontFamily: sans }}>{s.l}</div>
                </div>
              ))}
            </div>
          )}
          {r.ingredients?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: INK3, letterSpacing: 1.5, fontWeight: 700, marginBottom: 14, fontFamily: sans }}>ИНГРЕДИЕНТЫ</div>
              {r.ingredients.map((ing, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: 10, borderBottom: '1px solid ' + BD, marginBottom: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: G, flexShrink: 0, marginTop: 7 }} />
                  <div style={{ fontSize: 15, color: INK, lineHeight: 1.5, fontFamily: sans }}>{ing}</div>
                </div>
              ))}
            </div>
          )}
          {r.steps?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: INK3, letterSpacing: 1.5, fontWeight: 700, marginBottom: 14, fontFamily: sans }}>ПРИГОТОВЛЕНИЕ</div>
              {r.steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: G, color: W, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: sans }}>{i + 1}</div>
                  <div style={{ fontSize: 15, color: INK, lineHeight: 1.6, paddingTop: 4, fontFamily: sans }}>{step}</div>
                </div>
              ))}
            </div>
          )}
          {r.fact && (
            <div style={{ background: GLL, borderLeft: '4px solid ' + G, borderRadius: '0 12px 12px 0', padding: '14px 16px', marginBottom: 24 }}>
              <div style={{ fontSize: 12, color: G, fontWeight: 700, letterSpacing: 1, marginBottom: 6, fontFamily: sans }}>ИНТЕРЕСНЫЙ ФАКТ</div>
              <div style={{ fontSize: 14, color: INK, lineHeight: 1.6, fontFamily: sans }}>{r.fact}</div>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <button onClick={() => handleLike(r.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', border: '1px solid ' + BD, borderRadius: 30, background: W, cursor: 'pointer', fontFamily: sans, fontSize: 14, color: INK2 }}>
              ♥ {r.likes}
            </button>
            <div style={{ fontSize: 14, color: INK3, fontFamily: sans }}>{(r.comments || []).length} комментариев</div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: INK3, letterSpacing: 1.5, fontWeight: 700, marginBottom: 16, fontFamily: sans }}>КОММЕНТАРИИ</div>
            {(r.comments || []).map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: GLL, color: G, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0, fontFamily: sans }}>
                  {(c.userName || c.user || '?')[0]}
                </div>
                <div style={{ flex: 1, background: '#F9F7F4', borderRadius: '4px 14px 14px 14px', padding: '10px 14px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: G, marginBottom: 4, fontFamily: sans }}>{c.userName || c.user}</div>
                  <div style={{ fontSize: 14, color: INK, lineHeight: 1.5, fontFamily: sans }}>{c.text}</div>
                </div>
              </div>
            ))}
            {(r.comments || []).length === 0 && <div style={{ fontSize: 14, color: INK3, textAlign: 'center', padding: '16px 0', fontFamily: sans }}>Будь первой — оставь комментарий!</div>}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <textarea placeholder="Напиши свой отзыв о блюде..." value={commentText}
              onChange={e => setNewComment(p => ({ ...p, [r.id]: e.target.value }))} rows={2}
              style={{ flex: 1, border: '1px solid ' + BD, borderRadius: 14, padding: '12px 14px', fontSize: 15, fontFamily: sans, color: INK, background: W, outline: 'none', resize: 'none' }} />
            <button onClick={() => handleComment(r.id)} style={{ width: 44, height: 44, borderRadius: '50%', background: G, border: 'none', color: W, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>↑</button>
          </div>
        </div>
      </div>
    );
  }

  // LIST
  return (
    <div style={{ padding: '24px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ fontFamily: serif, fontSize: 32, fontWeight: 600, color: G }}>Рецепты</div>
        <button onClick={() => setAddingRecipe(true)} style={{ background: G, border: 'none', borderRadius: 20, padding: '8px 16px', color: W, fontFamily: sans, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ Добавить</button>
      </div>
      <div style={{ fontSize: 15, color: INK2, marginBottom: 20, fontFamily: sans }}>{recipeList.length} рецептов от Кристины и участниц</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 22, overflowX: 'auto', paddingBottom: 4 }}>
        {CATS.map(c => (
          <button key={c} onClick={() => setCat(c)} style={{ padding: '8px 16px', borderRadius: 30, border: '1px solid ' + (cat === c ? G : BD), background: cat === c ? G : W, color: cat === c ? W : INK2, fontFamily: sans, fontSize: 14, fontWeight: cat === c ? 700 : 400, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>{c}</button>
        ))}
      </div>
      {loading ? <Spinner /> : recipeList.map(r => (
        <div key={r.id} onClick={() => openOne(r.id)} style={{ border: '1px solid ' + BD, borderRadius: 18, marginBottom: 12, overflow: 'hidden', cursor: 'pointer', background: W }}>
          {r.imageUrl && <img src={r.imageUrl} alt={r.title} style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />}
          <div style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: GLL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                {CAT_ICON[r.cat] || '🍽'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: serif, fontSize: 16, fontWeight: 600, color: INK }}>{r.title}</div>
                <div style={{ fontSize: 13, color: INK3, marginTop: 3, fontFamily: sans }}>{r.cat}{r.time ? ' · ' + r.time : ''} · {r.authorName === 'Кристина' ? '👩‍⚕️ Кристина' : '👤 Участница'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: INK3, fontFamily: sans }}>♥ {r.likes}</span>
              <span style={{ fontSize: 13, color: INK3, fontFamily: sans }}>💬 {r.commentCount || 0}</span>
              {r.kcal && <span style={{ fontSize: 13, color: INK3, fontFamily: sans }}>{r.kcal} ккал</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
