import { toUnicode } from './unicode'

export type Segment =
  | { kind: 'text'; text: string }
  | { kind: 'math'; tex: string; raw: string }

const FENCE = /^ {0,3}(`{3,}|~{3,})/

// $$…$$, \[…\], and the display environments written bare.
const DISPLAY =
  /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|(\\begin\{(equation|align|gather|multline|flalign|alignat|eqnarray|displaymath)(\*?)\}[\s\S]+?\\end\{\4\5\})/g

// Pandoc's rule: an opening $ has no space after it, a closing $ none before
// it and no digit after it, so "$5 and $10" stays prose.
const INLINE = /\\\(([\s\S]+?)\\\)|(?<![\\$\w])\$(?![\s$])((?:\\.|[^$\\\n])+?)(?<![\s\\])\$(?![\w$])/g

const INLINE_CODE = /(`+)(?!`)[^\n]*?(?<!`)\1(?!`)/g

const HOLE = '\u0000'

// Replace inline code spans with numbered holes so math inside them is left alone.
function protect(text: string): { text: string; spans: string[] } {
  const spans: string[] = []
  return {
    text: text.replace(INLINE_CODE, span => `${HOLE}${spans.push(span) - 1}${HOLE}`),
    spans,
  }
}

function restore(text: string, spans: readonly string[]): string {
  return text.replace(/\u0000(\d+)\u0000/g, (_, n: string) => spans[Number(n)] ?? '')
}

function escapeMarkdown(text: string): string {
  return text.replace(/[\\`*_[\]<>|~]/g, '\\$&')
}

/** Inline math in a markdown text rewritten as Unicode, code spans untouched. */
export function inlineMath(markdown: string): string {
  return chunks(markdown)
    .map(({ text, isCode }) => {
      if (isCode) return text
      const { text: safe, spans } = protect(text)
      const out = safe.replace(INLINE, (_, paren?: string, dollar?: string) =>
        escapeMarkdown(toUnicode(paren ?? dollar ?? '')),
      )
      return restore(out, spans)
    })
    .join('')
}

/** Prose and fenced code, in order, each chunk's lines whole with their newlines. */
function chunks(markdown: string): { text: string; isCode: boolean }[] {
  const out: { text: string; isCode: boolean }[] = []
  let fence: string | undefined
  for (const line of markdown.split(/(?<=\n)/)) {
    const marker = FENCE.exec(line)?.[1]
    const isCode = fence !== undefined || marker !== undefined
    if (fence === undefined && marker) fence = marker
    else if (fence !== undefined && marker && marker[0] === fence[0] && marker.length >= fence.length && line.trim() === marker) {
      fence = undefined
    }
    const last = out[out.length - 1]
    if (last && last.isCode === isCode) last.text += line
    else out.push({ text: line, isCode })
  }
  return out
}

/**
 * Splits a reply into markdown text and display math, the math outside code
 * fences and inline code alone.
 */
export function split(markdown: string): Segment[] {
  const out: Segment[] = []
  let text = ''
  const flush = () => {
    if (text.trim() !== '') out.push({ kind: 'text', text: text.replace(/^\n+|\s+$/g, '') })
    text = ''
  }

  for (const chunk of chunks(markdown)) {
    if (chunk.isCode) {
      text += chunk.text
      continue
    }
    const { text: safe, spans } = protect(chunk.text)
    let at = 0
    for (const m of safe.matchAll(DISPLAY)) {
      const tex = m[1] ?? m[2] ?? m[3] ?? ''
      if (tex.trim() === '' || tex.includes(HOLE)) continue
      text += restore(safe.slice(at, m.index), spans)
      flush()
      out.push({ kind: 'math', tex: tex.trim(), raw: m[0] })
      at = m.index + m[0].length
    }
    text += restore(safe.slice(at), spans)
  }
  flush()
  return out
}
