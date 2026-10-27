import { useMemo, useRef } from 'react';
import { highlight } from '../lib/highlight';
import type { Language } from '../lib/judge';

const PAIRS: Record<string, string> = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'", '`': '`' };
const CLOSERS = new Set([')', ']', '}', '"', "'", '`']);
const isWord = (c: string | undefined) => !!c && /[\w$]/.test(c);

/**
 * A textarea with a syntax-highlighted layer underneath, a line-number gutter and the editing
 * rules people expect from online judges: auto-indent, auto-closing brackets and quotes,
 * skipping over closers, block expansion between braces, smart dedent, multi-line Tab and
 * Ctrl/Cmd + / to toggle comments. `errorLines` (1-based) are marked, e.g. compiler errors.
 */
export function CodeEditor({
  value, onChange, lang, onSubmit, onBlur, errorLines = [],
}: { value: string; onChange: (v: string) => void; lang: Language; onSubmit?: () => void; onBlur?: () => void; errorLines?: number[] }) {
  const hl = useRef<HTMLPreElement>(null);
  const gutter = useRef<HTMLDivElement>(null);
  const errs = useRef<HTMLDivElement>(null);
  const html = useMemo(() => highlight(value, lang) + '\n', [value, lang]);
  const lines = value.split('\n').length;
  const errSet = useMemo(() => new Set(errorLines), [errorLines]);

  const sync = (el: HTMLTextAreaElement) => {
    if (hl.current) { hl.current.scrollTop = el.scrollTop; hl.current.scrollLeft = el.scrollLeft; }
    if (gutter.current) gutter.current.scrollTop = el.scrollTop;
    if (errs.current) errs.current.scrollTop = el.scrollTop;
  };

  function apply(el: HTMLTextAreaElement, next: string, selStart: number, selEnd = selStart) {
    onChange(next);
    requestAnimationFrame(() => el.setSelectionRange(selStart, selEnd));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget;
    const s = el.selectionStart, t = el.selectionEnd;
    const lineStart = (i: number) => value.lastIndexOf('\n', i - 1) + 1;
    const comment = '//';

    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onSubmit?.();
      return;
    }

    // Ctrl/Cmd + / : toggle line comments on the selected lines.
    if (e.key === '/' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      const a = lineStart(s);
      let b = value.indexOf('\n', t > s && value[t - 1] === '\n' ? t - 1 : t);
      if (b < 0) b = value.length;
      const block = value.slice(a, b).split('\n');
      const all = block.every((l) => !l.trim() || l.trimStart().startsWith(comment));
      const out = block.map((l) => {
        if (!l.trim()) return l;
        if (all) return l.replace(new RegExp(`^(\\s*)${comment} ?`), '$1');
        const ind = /^\s*/.exec(l)![0];
        return `${ind}${comment} ${l.slice(ind.length)}`;
      });
      const text = out.join('\n');
      apply(el, value.slice(0, a) + text + value.slice(b), a, a + text.length);
      return;
    }

    // Tab / Shift+Tab, also over several lines.
    if (e.key === 'Tab') {
      e.preventDefault();
      const multi = value.slice(s, t).includes('\n');
      if (!e.shiftKey && !multi) return apply(el, value.slice(0, s) + '  ' + value.slice(t), s + 2);
      const a = lineStart(s);
      let b = value.indexOf('\n', t > s && value[t - 1] === '\n' ? t - 1 : t);
      if (b < 0) b = value.length;
      const block = value.slice(a, b).split('\n');
      const out = block.map((l) => (e.shiftKey ? l.replace(/^ {1,2}|^\t/, '') : l.trim() ? '  ' + l : l));
      const text = out.join('\n');
      const delta = text.length - (b - a);
      return apply(el, value.slice(0, a) + text + value.slice(b), Math.max(a, s + (out[0].length - block[0].length)), t + delta);
    }

    // Enter: keep the indentation; open a block between braces.
    if (e.key === 'Enter') {
      e.preventDefault();
      const ls = lineStart(s);
      const indent = /^[ \t]*/.exec(value.slice(ls, s))![0];
      const before = value.slice(0, s).trimEnd().slice(-1);
      const after = value[t];
      const opens = before === '{' || before === '(' || before === '[' || (before === ':' && /^\s*(case\b|default\b)/.test(value.slice(ls, s)));
      const extra = opens ? '  ' : '';
      const between = opens && (after === '}' || after === ')' || after === ']') && value[s - 1] === { '}': '{', ')': '(', ']': '[' }[after];
      const ins = '\n' + indent + extra;
      return apply(el, value.slice(0, s) + ins + (between ? '\n' + indent : '') + value.slice(t), s + ins.length);
    }

    // Backspace between an empty pair removes both characters; on indentation it removes one level.
    if (e.key === 'Backspace' && s === t && s > 0) {
      const prev = value[s - 1], next = value[s];
      if (PAIRS[prev] && PAIRS[prev] === next) {
        e.preventDefault();
        return apply(el, value.slice(0, s - 1) + value.slice(s + 1), s - 1);
      }
      const ls = lineStart(s);
      const head = value.slice(ls, s);
      if (head.length >= 2 && /^ +$/.test(head) && head.length % 2 === 0) {
        e.preventDefault();
        return apply(el, value.slice(0, s - 2) + value.slice(s), s - 2);
      }
      return;
    }

    if (e.metaKey || e.ctrlKey || e.altKey) return;

    // Typing a closer in front of the same closer just moves past it.
    if (CLOSERS.has(e.key) && s === t && value[s] === e.key) {
      e.preventDefault();
      return apply(el, value, s + 1);
    }

    // Dedent a closing brace typed on an otherwise blank line.
    if (e.key === '}' && s === t) {
      const head = value.slice(lineStart(s), s);
      if (head.length >= 2 && /^ +$/.test(head)) {
        e.preventDefault();
        return apply(el, value.slice(0, s - 2) + '}' + value.slice(s), s - 1);
      }
    }

    // Auto-close brackets and quotes; wrap the selection when there is one.
    const close = PAIRS[e.key];
    if (close) {
      const quote = e.key === '"' || e.key === "'" || e.key === '`';
      if (s !== t) {
        e.preventDefault();
        return apply(el, value.slice(0, s) + e.key + value.slice(s, t) + close + value.slice(t), s + 1, t + 1);
      }
      // No pairing of quotes inside words (apostrophes, C++ digit separators) or in front of text.
      if (quote && (isWord(value[s - 1]) || isWord(value[s]))) return;
      if (!quote && isWord(value[s])) return;
      e.preventDefault();
      apply(el, value.slice(0, s) + e.key + close + value.slice(t), s + 1);
    }
  }

  const numbers = Array.from({ length: lines }, (_, i) => i + 1);
  return (
    <div className="code-editor">
      <div className="gutter" ref={gutter} aria-hidden>
        {numbers.map((n) => <div key={n} className={errSet.has(n) ? 'gl err' : 'gl'}>{n}</div>)}
      </div>
      <div className="code-stack">
        <div className="errs" ref={errs} aria-hidden>
          {numbers.map((n) => <div key={n} className={errSet.has(n) ? 'el err' : 'el'} />)}
        </div>
        <pre className="hl" ref={hl} aria-hidden dangerouslySetInnerHTML={{ __html: html }} />
        <textarea
          className="editor"
          wrap="off"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onScroll={(e) => sync(e.currentTarget)}
          onBlur={onBlur}
          aria-label="Code editor"
        />
      </div>
    </div>
  );
}
