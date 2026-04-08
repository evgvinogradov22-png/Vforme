import { useRef, useState, useEffect, useCallback } from 'react';
import { C } from './UI';

// ── TOOLBAR ──────────────────────────────────────────────────
const TOOLS = [
  { cmd: 'bold',          icon: 'B',    style: { fontWeight: 700 }, title: 'Жирный' },
  { cmd: 'italic',        icon: 'I',    style: { fontStyle: 'italic' }, title: 'Курсив' },
  { cmd: 'underline',     icon: 'U',    style: { textDecoration: 'underline' }, title: 'Подчёркнутый' },
  { sep: true },
  { cmd: 'h1',            icon: 'H1',   title: 'Заголовок 1' },
  { cmd: 'h2',            icon: 'H2',   title: 'Заголовок 2' },
  { cmd: 'blockquote',    icon: '❝',    title: 'Цитата/Выделение' },
  { sep: true },
  { cmd: 'insertUnorderedList', icon: '• —', title: 'Список' },
  { cmd: 'insertOrderedList',   icon: '1.',  title: 'Нумерованный список' },
  { sep: true },
  { cmd: 'removeFormat',  icon: '✕',    title: 'Убрать форматирование' },
];

function Toolbar({ position, onCommand, visible }) {
  if (!visible) return null;
  return (
    <div style={{
      position: 'fixed',
      top: position.y - 44,
      left: Math.max(8, Math.min(position.x - 120, window.innerWidth - 260)),
      background: '#1A1A1A',
      borderRadius: 10,
      padding: '6px 8px',
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      zIndex: 9999,
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      userSelect: 'none',
    }}>
      {TOOLS.map((tool, i) => {
        if (tool.sep) return <div key={i} style={{ width: 1, height: 20, background: '#444', margin: '0 4px' }} />;
        return (
          <button key={i} title={tool.title}
            onMouseDown={e => { e.preventDefault(); onCommand(tool.cmd); }}
            style={{
              background: 'none', border: 'none', color: '#fff',
              padding: '4px 8px', borderRadius: 6, cursor: 'pointer',
              fontSize: 13, fontWeight: tool.style?.fontWeight || 400,
              fontStyle: tool.style?.fontStyle || 'normal',
              textDecoration: tool.style?.textDecoration || 'none',
              minWidth: 28, textAlign: 'center',
            }}
            onMouseEnter={e => e.target.style.background = '#333'}
            onMouseLeave={e => e.target.style.background = 'none'}
          >
            {tool.icon}
          </button>
        );
      })}
    </div>
  );
}

// ── EDITOR ───────────────────────────────────────────────────
export default function RichEditor({ value, onChange, placeholder = 'Начни писать...' }) {
  const editorRef = useRef(null);
  const [toolbar, setToolbar] = useState({ visible: false, x: 0, y: 0 });
  const isUpdating = useRef(false);

  // Sync value → editor (only on mount or external change)
  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== value) {
      isUpdating.current = true;
      editorRef.current.innerHTML = value || '';
      isUpdating.current = false;
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (!isUpdating.current && editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleSelectionChange = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      setToolbar(t => ({ ...t, visible: false }));
      return;
    }
    // Check selection is inside our editor
    if (!editorRef.current?.contains(sel.anchorNode)) {
      setToolbar(t => ({ ...t, visible: false }));
      return;
    }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    setToolbar({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [handleSelectionChange]);

  const execCommand = useCallback((cmd) => {
    editorRef.current?.focus();
    if (cmd === 'h1') {
      document.execCommand('formatBlock', false, 'H1');
    } else if (cmd === 'h2') {
      document.execCommand('formatBlock', false, 'H2');
    } else if (cmd === 'blockquote') {
      document.execCommand('formatBlock', false, 'BLOCKQUOTE');
    } else {
      document.execCommand(cmd, false, null);
    }
    setTimeout(() => {
      handleInput();
      setToolbar(t => ({ ...t, visible: false }));
    }, 10);
  }, [handleInput]);

  return (
    <>
      <Toolbar position={{ x: toolbar.x, y: toolbar.y }} visible={toolbar.visible} onCommand={execCommand} />
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.ink2, marginBottom: 8, letterSpacing: 0.5 }}>КОНСПЕКТ</div>
        <div style={{ fontSize: 12, color: C.ink3, marginBottom: 8 }}>
          Выдели текст → появится панель форматирования
        </div>
        <style>{`
          .rich-editor { outline: none; min-height: 200px; font-family: Arial, sans-serif; font-size: 15px; line-height: 1.7; color: #1A1A1A; }
          .rich-editor:empty:before { content: attr(data-placeholder); color: #999; pointer-events: none; }
          .rich-editor * { font-family: Arial, sans-serif !important; font-size: 15px !important; line-height: 1.7 !important; color: #1A1A1A !important; background: transparent !important; margin: 0 !important; padding: 0 !important; border: none !important; }
          .rich-editor h1 { font-size: 22px !important; font-weight: 700 !important; margin: 16px 0 8px !important; color: #2D4A2D !important; line-height: 1.3 !important; }
          .rich-editor h2 { font-size: 18px !important; font-weight: 700 !important; margin: 12px 0 6px !important; color: #2D4A2D !important; line-height: 1.3 !important; }
          .rich-editor blockquote { border-left: 4px solid #2D4A2D !important; margin: 12px 0 !important; padding: 10px 16px !important; background: #EBF0EB !important; border-radius: 0 8px 8px 0 !important; color: #2D4A2D !important; font-style: italic !important; }
          .rich-editor ul { padding-left: 20px !important; margin: 8px 0 !important; }
          .rich-editor ol { padding-left: 20px !important; margin: 8px 0 !important; }
          .rich-editor li { margin: 4px 0 !important; line-height: 1.6 !important; font-size: 15px !important; }
          .rich-editor p { margin: 0 0 8px !important; line-height: 1.7 !important; }
          .rich-editor strong, .rich-editor b { font-weight: 700 !important; }
          .rich-editor em, .rich-editor i { font-style: italic !important; }
          .rich-editor span { font-size: inherit !important; color: inherit !important; }
        `}</style>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="rich-editor"
          data-placeholder={placeholder}
          onInput={handleInput}
          onPaste={e => {
            e.preventDefault();
            const text = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain');
            const clean = text
              .replace(/<[^>]+style="[^"]*"[^>]*>/gi, m => m.replace(/\s*style="[^"]*"/gi, ''))
              .replace(/<[^>]+class="[^"]*"[^>]*>/gi, m => m.replace(/\s*class="[^"]*"/gi, ''))
              .replace(/<font[^>]*>/gi, '').replace(/<\/font>/gi, '')
              .replace(/<span[^>]*color[^>]*>(.*?)<\/span>/gi, '$1')
              .replace(/<span>/gi, '').replace(/<\/span>/gi, '');
            document.execCommand('insertHTML', false, clean);
            setTimeout(() => { onChange(e.target.innerHTML || document.querySelector('.rich-editor')?.innerHTML); }, 10);
          }}
          style={{
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: '14px 16px',
            fontSize: 15,
            fontFamily: 'Arial, sans-serif',
            color: C.ink,
            background: C.white,
            lineHeight: 1.7,
            minHeight: 200,
          }}
        />
      </div>
    </>
  );
}
