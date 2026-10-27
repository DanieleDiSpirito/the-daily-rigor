import katex from 'katex';
import { useMemo } from 'react';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const math = (tex: string, displayMode: boolean) => {
  try {
    return katex.renderToString(tex, { displayMode, throwOnError: false, strict: 'ignore' });
  } catch {
    return esc(tex);
  }
};

function inline(s: string): string {
  const re = /`([^`]+)`|\$([^$]+)\$|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let out = '', last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    out += esc(s.slice(last, m.index));
    if (m[1] !== undefined) out += `<code>${esc(m[1])}</code>`;
    else if (m[2] !== undefined) out += math(m[2], false);
    else if (m[3] !== undefined) out += `<strong>${inline(m[3])}</strong>`;
    else out += `<em>${inline(m[4])}</em>`;
    last = re.lastIndex;
  }
  return out + esc(s.slice(last));
}

export function renderRich(text: string): string {
  const parts = text.split(/\$\$([\s\S]+?)\$\$/);
  let html = '';
  parts.forEach((part, i) => {
    if (i % 2 === 1) {
      html += `<div class="display-math">${math(part.trim(), true)}</div>`;
      return;
    }
    for (const block of part.split(/\n\s*\n/)) {
      const b = block.trim();
      if (!b) continue;
      const lines = b.split('\n');
      if (lines.every((l) => l.trim().startsWith('- '))) {
        html += `<ul>${lines.map((l) => `<li>${inline(l.trim().slice(2))}</li>`).join('')}</ul>`;
      } else {
        html += `<p>${inline(lines.join(' '))}</p>`;
      }
    }
  });
  return html;
}

export function Rich({ text, className }: { text: string; className?: string }) {
  const html = useMemo(() => renderRich(text), [text]);
  return <div className={`rich ${className ?? ''}`} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function RichInline({ text }: { text: string }) {
  const html = useMemo(() => inline(text), [text]);
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
