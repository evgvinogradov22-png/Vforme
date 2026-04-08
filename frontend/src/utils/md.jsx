// Маленький markdown-рендерер без зависимостей.
// Поддерживает **bold**, `code`, списки "- ", параграфы по \n\n.

function renderInline(text, baseKey = 'i') {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*\n]+?\*\*|`[^`\n]+?`)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return <strong key={`${baseKey}-${i}`}>{p.slice(2, -2)}</strong>;
    }
    if (p.startsWith('`') && p.endsWith('`')) {
      return (
        <code key={`${baseKey}-${i}`} style={{ background: '#F0EBE0', padding: '1px 5px', borderRadius: 4, fontSize: '0.92em' }}>
          {p.slice(1, -1)}
        </code>
      );
    }
    return p;
  });
}

export function renderMarkdown(text, baseKey = 'md') {
  if (!text) return null;
  const blocks = text.split(/\n{2,}/);
  return blocks.map((block, bi) => {
    const lines = block.split('\n');
    const allBullets = lines.length > 0 && lines.every(l => /^\s*[-*•]\s+/.test(l));
    if (allBullets) {
      return (
        <ul key={`${baseKey}-b${bi}`} style={{ margin: bi === 0 ? '0 0 0 18px' : '8px 0 0 18px', padding: 0 }}>
          {lines.map((l, li) => (
            <li key={`${baseKey}-b${bi}-${li}`} style={{ marginBottom: 4 }}>
              {renderInline(l.replace(/^\s*[-*•]\s+/, ''), `${baseKey}-b${bi}-${li}`)}
            </li>
          ))}
        </ul>
      );
    }
    const innerLines = lines.map((l, li) => (
      <span key={`${baseKey}-p${bi}-${li}`}>
        {renderInline(l, `${baseKey}-p${bi}-${li}`)}
        {li < lines.length - 1 && <br />}
      </span>
    ));
    return (
      <div key={`${baseKey}-p${bi}`} style={{ marginTop: bi === 0 ? 0 : 8 }}>
        {innerLines}
      </div>
    );
  });
}
