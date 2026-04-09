import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { recipes as recipesApi, tracker as trackerApi } from '../api';
import { Spinner, BackHeader } from '../components/UI';
import { G, GLL, GOLD, BD, INK, INK2, INK3, OW, W, sans, serif } from '../utils/theme';

const CAT_OPTIONS = [
  { id: 'Завтрак', label: 'Завтрак' },
  { id: 'Обед',    label: 'Обед' },
  { id: 'Ужин',    label: 'Ужин' },
  { id: 'Перекус', label: 'Перекус' },
  { id: 'Напитки', label: 'Напитки' },
];
const DIET_DEFAULTS = ['без глютена', 'без лактозы', 'кето', 'низкоуглеводное', 'веган', 'высокобелковое', 'детокс'];

// Бежевая палитра фильтров — как в Здоровье
const F_BG     = '#F3EFE6';
const F_BG_ACT = '#E8DDC0';
const F_BD     = '#D9D2C0';
const F_TXT    = '#5A4D34';
const F_TXT_ACT = '#3D3217';

// Дропдаун с галочками — копия из Health
function FilterDropdown({ label, options, selected, multi, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('touchstart', onDocClick);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('touchstart', onDocClick);
    };
  }, [open]);
  const isAll = multi ? selected.length === 0 : !selected;
  const display = isAll ? label : multi ? `${label} · ${selected.length}` : (options.find(o => o.id === selected)?.label || label);
  const toggle = (id) => {
    if (multi) {
      const next = selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id];
      onChange(next);
    } else {
      onChange(selected === id ? null : id);
      setOpen(false);
    }
  };
  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        padding: '9px 16px', borderRadius: 22,
        background: isAll ? F_BG : F_BG_ACT,
        color: isAll ? F_TXT : F_TXT_ACT,
        border: `1px solid ${F_BD}`,
        fontFamily: sans, fontSize: 13, fontWeight: 600, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {display}
        <span style={{ fontSize: 10, opacity: 0.6 }}>▼</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          background: W, border: `1px solid ${F_BD}`, borderRadius: 14,
          padding: 6, minWidth: 200,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          zIndex: 50,
        }}>
          {options.map(opt => {
            const checked = multi ? selected.includes(opt.id) : selected === opt.id;
            return (
              <button key={opt.id} onClick={() => toggle(opt.id)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10,
                background: checked ? F_BG : 'transparent', border: 'none',
                cursor: 'pointer', textAlign: 'left',
              }}>
                <span style={{
                  width: 18, height: 18, borderRadius: 5,
                  border: `1.5px solid ${checked ? G : F_BD}`,
                  background: checked ? G : W,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {checked && <span style={{ color: W, fontSize: 12, lineHeight: 1 }}>✓</span>}
                </span>
                <span style={{ fontSize: 14, color: INK, fontFamily: sans, fontWeight: checked ? 600 : 500 }}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Recipes({ user, flash }) {
  const [recipeList, setRecipeList] = useState([]);
  const [savedList, setSavedList]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState([]); // multi
  const [search, setSearch] = useState('');
  const [onlySaved, setOnlySaved] = useState(false);
  const [activeDietTags, setActiveDietTags] = useState([]);
  const [openRecipe, setOpenRecipe] = useState(null);
  const [addingRecipe, setAddingRecipe] = useState(false);
  const [newRecipe, setNewRecipe] = useState({ title: '', cat: 'Завтрак', time: '', ingredients: '', steps: '', fact: '' });
  const [newComment, setNewComment] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      recipesApi.getAll('Все'),
      recipesApi.saved().catch(() => []),
    ])
      .then(([list, saved]) => {
        setRecipeList(Array.isArray(list) ? list : []);
        setSavedList(Array.isArray(saved) ? saved : []);
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const h = (e) => { if (e.detail?.entity === 'recipes') load(); };
    window.addEventListener('vforme:data_updated', h);
    return () => window.removeEventListener('vforme:data_updated', h);
  }, [load]);

  // Все доступные diet тэги — собираем из загруженных рецептов + дефолты
  const dietOptions = useMemo(() => {
    const set = new Set();
    recipeList.forEach(r => (r.dietTags || []).forEach(t => set.add(t)));
    DIET_DEFAULTS.forEach(t => set.add(t));
    return [...set].map(t => ({ id: t, label: t }));
  }, [recipeList]);

  // Фильтрация
  const visibleList = useMemo(() => {
    const base = onlySaved ? savedList : recipeList;
    const q = search.trim().toLowerCase();
    return base.filter(r => {
      if (catFilter.length > 0 && !catFilter.includes(r.cat)) return false;
      if (activeDietTags.length > 0 && !activeDietTags.every(t => (r.dietTags || []).includes(t))) return false;
      if (q) {
        const inTitle = (r.title || '').toLowerCase().includes(q);
        const ings = Array.isArray(r.ingredients) ? r.ingredients.join(' ').toLowerCase() : (r.ingredients || '').toString().toLowerCase();
        if (!inTitle && !ings.includes(q)) return false;
      }
      return true;
    });
  }, [onlySaved, savedList, recipeList, search, activeDietTags, catFilter]);

  const handleLike = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await recipesApi.like(id);
      const upd = (r) => r.id === id ? { ...r, likes: res.likes, liked: res.liked } : r;
      setRecipeList(p => p.map(upd));
      setSavedList(p => p.map(upd));
      if (openRecipe?.id === id) setOpenRecipe(r => ({ ...r, likes: res.likes, liked: res.liked }));
    } catch {}
  };

  const handleSave = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await recipesApi.save(id);
      const upd = (r) => r.id === id ? { ...r, saved: res.saved } : r;
      setRecipeList(p => p.map(upd));
      if (res.saved) {
        const r = recipeList.find(x => x.id === id) || openRecipe;
        if (r) setSavedList(p => [{ ...r, saved: true }, ...p.filter(x => x.id !== id)]);
      } else {
        setSavedList(p => p.filter(x => x.id !== id));
      }
      if (openRecipe?.id === id) setOpenRecipe(r => ({ ...r, saved: res.saved }));
    } catch {}
  };

  const handleRandom = async () => {
    try {
      const r = await recipesApi.random();
      if (r?.id) openOne(r.id);
    } catch {}
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

  // ─── ADD FORM ───────────────────────────────────────────────
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

  // ─── RECIPE DETAIL ──────────────────────────────────────────
  if (openRecipe) {
    const r = openRecipe;
    const commentText = newComment[r.id] || '';
    return (
      <div style={{ paddingBottom: 40 }}>
        <BackHeader onBack={() => setOpenRecipe(null)} title={r.title} subtitle={r.cat} />
        <div style={{ padding: '24px 20px' }}>
          {r.imageUrl && (
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <div style={{
                width: '100%', aspectRatio: '4 / 3',
                backgroundImage: `url(${r.imageUrl})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                borderRadius: 16,
              }} />
              {/* Лайк/сохранить overlay */}
              <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8 }}>
                <button onClick={() => handleSave(r.id)} style={{
                  width: 40, height: 40, borderRadius: 20,
                  background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                  border: 'none', cursor: 'pointer', fontSize: 18,
                  color: r.saved ? GOLD : INK3,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}>{r.saved ? '★' : '☆'}</button>
                <button onClick={() => handleLike(r.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  height: 40, padding: '0 14px', borderRadius: 20,
                  background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                  border: 'none', cursor: 'pointer',
                  color: r.liked ? '#E55' : INK2, fontFamily: sans, fontWeight: 700, fontSize: 13,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}>{r.liked ? '♥' : '♡'} {r.likes || 0}</button>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            {r.time && <span style={{ background: GLL, color: G, fontSize: 13, borderRadius: 20, padding: '6px 14px', fontFamily: sans, lineHeight: 1 }}>⏱ {r.time}</span>}
            {r.kcal != null && <span style={{ background: '#FBF5EB', color: GOLD, fontSize: 13, borderRadius: 20, padding: '6px 14px', fontFamily: sans, lineHeight: 1 }}>~{r.kcal} ккал</span>}
            <span style={{ background: '#F9F7F4', color: INK3, fontSize: 13, borderRadius: 20, padding: '6px 14px', fontFamily: sans, lineHeight: 1 }}>
              {r.authorName === 'Кристина' ? 'Кристина' : 'Участница'}
            </span>
          </div>
          {r.dietTags?.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
              {r.dietTags.map((t, i) => (
                <span key={i} style={{ fontSize: 11, color: '#5A4D34', background: '#F3EFE6', border: '1px solid #D9D2C0', padding: '4px 10px', borderRadius: 12, fontFamily: sans, fontWeight: 600 }}>{t}</span>
              ))}
            </div>
          )}
          {(r.kcal != null && (r.protein != null || r.fat != null || r.carbs != null)) && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
              {[{ l: 'Белки', v: (r.protein ?? 0) + 'г' }, { l: 'Жиры', v: (r.fat ?? 0) + 'г' }, { l: 'Углеводы', v: (r.carbs ?? 0) + 'г' }].map((s, i) => (
                <div key={i} style={{ flex: 1, background: GLL, borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
                  <div style={{ fontFamily: serif, fontSize: 18, fontWeight: 700, color: G }}>{s.v}</div>
                  <div style={{ fontSize: 11, color: '#3D6B3D', marginTop: 3, fontFamily: sans }}>{s.l}</div>
                </div>
              ))}
            </div>
          )}
          {r.ingredients?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: INK3, letterSpacing: 1.5, fontWeight: 700, fontFamily: sans }}>ИНГРЕДИЕНТЫ</div>
                <button onClick={async () => {
                  try {
                    await trackerApi.addShopping({
                      items: r.ingredients.map(ing => ({ name: ing, category: 'ingredient', source: r.title, sourceId: r.id }))
                    });
                    alert('Добавлено в список покупок');
                  } catch (e) { alert(e.message); }
                }} style={{ background: GLL, color: G, border: '1px solid ' + G + '33', borderRadius: 10, padding: '6px 12px', fontSize: 11, fontWeight: 700, fontFamily: sans, cursor: 'pointer', letterSpacing: 0.5 }}>
                  + В СПИСОК
                </button>
              </div>
              {r.ingredients.map((ing, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: 10, borderBottom: '1px solid ' + BD, marginBottom: 10, alignItems: 'center' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: G, flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: 15, color: INK, lineHeight: 1.5, fontFamily: sans }}>{ing}</div>
                  <button onClick={async () => {
                    try { await trackerApi.addShopping({ name: ing, category: 'ingredient', source: r.title, sourceId: r.id }); }
                    catch (e) { alert(e.message); }
                  }} style={{ background: 'none', border: 'none', color: GOLD, fontSize: 18, cursor: 'pointer', padding: 4, lineHeight: 1 }} title="В список покупок">+</button>
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

          {/* Комментарии */}
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

  // ─── LIST ───────────────────────────────────────────────────
  return (
    <div style={{ padding: '24px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ fontFamily: serif, fontSize: 28, fontWeight: 600, color: G }}>Рецепты</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleRandom} title="Случайный рецепт" style={{ background: W, border: '1px solid ' + BD, borderRadius: 20, padding: '8px 14px', color: INK2, fontFamily: sans, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>🎲 Случайный</button>
          <button onClick={() => setAddingRecipe(true)} style={{ background: G, border: 'none', borderRadius: 20, padding: '8px 16px', color: W, fontFamily: sans, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ Добавить</button>
        </div>
      </div>
      <div style={{ fontSize: 14, color: INK2, marginBottom: 14, fontFamily: sans }}>{visibleList.length} рецептов</div>

      {/* Поиск */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Поиск по названию или ингредиенту..."
        style={{
          width: '100%', boxSizing: 'border-box',
          border: '1px solid ' + BD, borderRadius: 14,
          padding: '12px 16px', fontSize: 14, fontFamily: sans, color: INK, background: W,
          outline: 'none', marginBottom: 14,
        }}
      />

      {/* Фильтры — dropdown с галочками + переключатель «Сохранённые» */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <FilterDropdown label="Категория" options={CAT_OPTIONS} selected={catFilter} multi={true} onChange={setCatFilter} />
        <FilterDropdown label="Диета" options={dietOptions} selected={activeDietTags} multi={true} onChange={setActiveDietTags} />
        <button onClick={() => setOnlySaved(v => !v)} style={{
          padding: '9px 16px', borderRadius: 22,
          background: onlySaved ? F_BG_ACT : F_BG,
          color: onlySaved ? F_TXT_ACT : F_TXT,
          border: `1px solid ${F_BD}`,
          fontFamily: sans, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{
            width: 18, height: 18, borderRadius: 5,
            border: `1.5px solid ${onlySaved ? G : F_BD}`,
            background: onlySaved ? G : W,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {onlySaved && <span style={{ color: W, fontSize: 12, lineHeight: 1 }}>✓</span>}
          </span>
          ★ Сохранённые
        </button>
      </div>

      {loading && <Spinner />}
      {!loading && visibleList.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: INK3, fontSize: 14, fontFamily: sans }}>
          Ничего не нашлось
        </div>
      )}

      {!loading && visibleList.map(r => (
        <div key={r.id} onClick={() => openOne(r.id)} style={{ border: '1px solid ' + BD, borderRadius: 18, marginBottom: 14, overflow: 'hidden', cursor: 'pointer', background: W }}>
          {r.imageUrl ? (
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '100%', aspectRatio: '3 / 1',
                backgroundImage: `url(${r.imageUrl})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
              }} />
              {/* Лайк overlay glass */}
              <button onClick={(e) => handleLike(r.id, e)} style={{
                position: 'absolute', top: 12, right: 12,
                display: 'flex', alignItems: 'center', gap: 5,
                height: 32, padding: '0 12px', borderRadius: 16,
                background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                border: 'none', cursor: 'pointer',
                color: r.liked ? '#E55' : INK2, fontFamily: sans, fontWeight: 700, fontSize: 13,
                boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
              }}>{r.liked ? '♥' : '♡'} {r.likes || 0}</button>
              {/* Сохранить overlay */}
              <button onClick={(e) => handleSave(r.id, e)} style={{
                position: 'absolute', top: 12, left: 12,
                width: 32, height: 32, borderRadius: 16,
                background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                border: 'none', cursor: 'pointer', fontSize: 16,
                color: r.saved ? GOLD : INK3,
                boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
              }}>{r.saved ? '★' : '☆'}</button>
            </div>
          ) : null}
          <div style={{ padding: '14px 18px' }}>
            <div style={{ fontFamily: serif, fontSize: 17, fontWeight: 600, color: INK, marginBottom: 4 }}>{r.title}</div>
            <div style={{ fontSize: 12, color: INK3, fontFamily: sans, marginBottom: 8 }}>
              {r.cat}{r.time ? ' · ' + r.time : ''}
            </div>
            {/* КБЖУ строка */}
            {r.kcal != null && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: GOLD, background: '#FBF5EB', padding: '3px 10px', borderRadius: 10, fontFamily: sans }}>{r.kcal} ккал</span>
                {r.protein != null && <span style={{ fontSize: 11, color: INK3, fontFamily: sans }}>Б {r.protein}г</span>}
                {r.fat != null && <span style={{ fontSize: 11, color: INK3, fontFamily: sans }}>Ж {r.fat}г</span>}
                {r.carbs != null && <span style={{ fontSize: 11, color: INK3, fontFamily: sans }}>У {r.carbs}г</span>}
              </div>
            )}
            {/* Diet тэги */}
            {r.dietTags?.length > 0 && (
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
                {r.dietTags.slice(0, 3).map((t, i) => (
                  <span key={i} style={{ fontSize: 10, color: '#5A4D34', background: '#F3EFE6', border: '1px solid #D9D2C0', padding: '3px 8px', borderRadius: 10, fontFamily: sans, fontWeight: 600 }}>{t}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
