// Helpers for showing learner rich-text answers (HTML from the editor) safely.

const ALLOWED_TAGS = new Set([
  'P', 'BR', 'B', 'STRONG', 'I', 'EM', 'U', 'S', 'UL', 'OL', 'LI', 'SPAN', 'DIV',
  'H1', 'H2', 'H3', 'H4', 'BLOCKQUOTE', 'A', 'CODE', 'PRE',
]);

/** Keeps basic formatting tags only; strips scripts, styles, event handlers and unsafe links. */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild as HTMLElement | null;
  if (!root) return '';

  const clean = (node: Element) => {
    for (const child of Array.from(node.children)) {
      if (!ALLOWED_TAGS.has(child.tagName)) {
        if (['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED'].includes(child.tagName)) {
          child.remove();
        } else {
          child.replaceWith(...Array.from(child.childNodes));
        }
        continue;
      }
      for (const attr of Array.from(child.attributes)) {
        const keep = child.tagName === 'A' && attr.name === 'href' && /^(https?:|mailto:)/i.test(attr.value);
        if (!keep) child.removeAttribute(attr.name);
      }
      if (child.tagName === 'A') {
        child.setAttribute('target', '_blank');
        child.setAttribute('rel', 'noopener noreferrer');
      }
      clean(child);
    }
  };

  // Repeat until stable, since unwrapping can expose nested disallowed tags.
  for (let i = 0; i < 3; i += 1) clean(root);
  return root.innerHTML;
}

/** Plain text version of rich text, for tables and previews. */
export function htmlToText(html: string): string {
  if (!html) return '';
  if (!/<[a-z][\s\S]*>/i.test(html)) return html;
  const doc = new DOMParser().parseFromString(html.replace(/<(br|\/p|\/li|\/div)>/gi, '$& '), 'text/html');
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}
