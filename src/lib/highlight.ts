import type { Language } from './judge';

/** Tiny dependency-free syntax highlighter for the editor (JavaScript and C++). Returns HTML. */

const JS_KEYWORDS = 'break case catch class const continue debugger default delete do else export extends finally for function if import in instanceof let new of return static super switch this throw try typeof var void while with yield async await true false null undefined';
const JS_BUILTINS = 'Math Number String Array Object Map Set BigInt Int32Array Uint8Array Float64Array Infinity NaN JSON console Symbol Promise Date RegExp';
const CPP_KEYWORDS = 'alignas auto break case catch class const constexpr continue default delete do else enum explicit extern false for friend goto if inline namespace new noexcept nullptr operator private protected public register return sizeof static struct switch template this throw true try typedef typename union using virtual volatile while';
const CPP_TYPES = 'bool char double float int long short signed unsigned void size_t int8_t int16_t int32_t int64_t uint8_t uint16_t uint32_t uint64_t string vector map set unordered_map unordered_set multiset pair tuple array deque queue stack priority_queue bitset list ll ull i64 u64 __int128 istream ostream cin cout cerr std';

const set = (s: string) => new Set(s.split(' '));
const SETS = {
  js: { kw: set(JS_KEYWORDS), ty: set(JS_BUILTINS) },
  cpp: { kw: set(CPP_KEYWORDS), ty: set(CPP_TYPES) },
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const COMMON = String.raw`(\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$))|("(?:[^"\\\n]|\\.)*"?|'(?:[^'\\\n]|\\.)*'?)`;
const NUM = String.raw`(\b(?:0[xX][0-9a-fA-F']+|0[bB][01']+|\d[\d']*\.?\d*(?:[eE][+-]?\d+)?|\.\d+)(?:[uUlLnfF]*)\b)`;
const IDENT = String.raw`([A-Za-z_$][\w$]*)`;
const RE = {
  js: new RegExp(`${COMMON.replace(`|'(`, "|`(?:[^`\\\\]|\\\\.)*`?|'(")}|${NUM}|${IDENT}`, 'g'),
  cpp: new RegExp(`(^[ \\t]*#[^\\n]*)|${COMMON}|${NUM}|${IDENT}`, 'gm'),
};

export function highlight(code: string, lang: Language): string {
  const re = RE[lang];
  const { kw, ty } = SETS[lang];
  re.lastIndex = 0;
  let out = '';
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    if (m[0] === '') { re.lastIndex++; continue; }
    out += esc(code.slice(last, m.index));
    last = m.index + m[0].length;
    const text = esc(m[0]);
    // Group layout: js = [comment, string, number, ident]; cpp = [preproc, comment, string, number, ident].
    const g = lang === 'cpp' ? m.slice(1) : [undefined, ...m.slice(1)];
    if (g[0]) out += `<span class="tok-pre">${text}</span>`;
    else if (g[1]) out += `<span class="tok-com">${text}</span>`;
    else if (g[2]) out += `<span class="tok-str">${text}</span>`;
    else if (g[3]) out += `<span class="tok-num">${text}</span>`;
    else if (g[4]) {
      const next = code.slice(last).match(/^\s*\(/);
      if (kw.has(m[0])) out += `<span class="tok-kw">${text}</span>`;
      else if (ty.has(m[0])) out += `<span class="tok-ty">${text}</span>`;
      else if (next) out += `<span class="tok-fn">${text}</span>`;
      else out += text;
    } else out += text;
  }
  return out + esc(code.slice(last));
}
