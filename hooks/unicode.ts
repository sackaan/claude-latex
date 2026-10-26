// LaTeX math to plain Unicode, for inline math and for any surface that
// cannot show a picture. Good enough to read, not typeset.

const SYMBOLS: Record<string, string> = {
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ϵ', varepsilon: 'ε',
  zeta: 'ζ', eta: 'η', theta: 'θ', vartheta: 'ϑ', iota: 'ι', kappa: 'κ',
  lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', omicron: 'ο', pi: 'π', varpi: 'ϖ',
  rho: 'ρ', varrho: 'ϱ', sigma: 'σ', varsigma: 'ς', tau: 'τ', upsilon: 'υ',
  phi: 'ϕ', varphi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω',
  Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π',
  Sigma: 'Σ', Upsilon: 'Υ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω',
  cdot: '·', cdots: '⋯', ldots: '…', dots: '…', vdots: '⋮', ddots: '⋱',
  times: '×', div: '÷', pm: '±', mp: '∓', ast: '∗', star: '⋆', circ: '∘',
  bullet: '∙', oplus: '⊕', ominus: '⊖', otimes: '⊗', odot: '⊙',
  leq: '≤', le: '≤', geq: '≥', ge: '≥', neq: '≠', ne: '≠', approx: '≈',
  equiv: '≡', sim: '∼', simeq: '≃', cong: '≅', propto: '∝', ll: '≪', gg: '≫',
  prec: '≺', succ: '≻', preceq: '⪯', succeq: '⪰', coloneqq: '≔', doteq: '≐',
  in: '∈', notin: '∉', ni: '∋', subset: '⊂', supset: '⊃', subseteq: '⊆',
  supseteq: '⊇', subsetneq: '⊊', cup: '∪', cap: '∩', setminus: '∖',
  bigcup: '⋃', bigcap: '⋂', emptyset: '∅', varnothing: '∅',
  forall: '∀', exists: '∃', nexists: '∄', neg: '¬', lnot: '¬', land: '∧',
  wedge: '∧', lor: '∨', vee: '∨', top: '⊤', bot: '⊥', perp: '⊥',
  parallel: '∥', mid: '∣', nmid: '∤', angle: '∠', triangle: '△',
  infty: '∞', partial: '∂', nabla: '∇', hbar: 'ℏ', ell: 'ℓ', Re: 'ℜ',
  Im: 'ℑ', aleph: 'ℵ', wp: '℘', prime: '′', degree: '°',
  sum: '∑', prod: '∏', coprod: '∐', int: '∫', iint: '∬', iiint: '∭',
  oint: '∮', sqrt: '√',
  to: '→', rightarrow: '→', leftarrow: '←', gets: '←', leftrightarrow: '↔',
  Rightarrow: '⇒', Leftarrow: '⇐', Leftrightarrow: '⇔', implies: '⟹',
  impliedby: '⟸', iff: '⟺', mapsto: '↦', longrightarrow: '⟶',
  longleftarrow: '⟵', longmapsto: '⟼', uparrow: '↑', downarrow: '↓',
  hookrightarrow: '↪', rightharpoonup: '⇀', nearrow: '↗', searrow: '↘',
  langle: '⟨', rangle: '⟩', lceil: '⌈', rceil: '⌉', lfloor: '⌊',
  rfloor: '⌋', lvert: '|', rvert: '|', lVert: '‖', rVert: '‖', vert: '|',
  Vert: '‖', '|': '‖', '{': '{', '}': '}', '%': '%', '$': '$', '#': '#',
  '&': '&', _: '_', backslash: '\\',
  quad: '  ', qquad: '    ', ',': ' ', ';': ' ', ':': ' ', '>': ' ', '!': '',
  ' ': ' ', enspace: ' ', thinspace: ' ', medspace: ' ',
  displaystyle: '', textstyle: '', limits: '', nolimits: '', left: '',
  right: '', big: '', Big: '', bigg: '', Bigg: '', bigl: '', bigr: '',
  Bigl: '', Bigr: '', nonumber: '', notag: '',
  therefore: '∴', because: '∵', checkmark: '✓', dagger: '†', ddagger: '‡',
}

const FUNCTIONS = new Set([
  'sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'arcsin', 'arccos', 'arctan',
  'sinh', 'cosh', 'tanh', 'coth', 'log', 'ln', 'lg', 'exp', 'lim', 'liminf',
  'limsup', 'max', 'min', 'sup', 'inf', 'det', 'dim', 'ker', 'deg', 'gcd',
  'arg', 'Pr', 'hom', 'tr', 'Tr', 'rank', 'sgn', 'mod', 'bmod',
])

const SUPER: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶',
  '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '-': '⁻', '−': '⁻', '=': '⁼',
  '(': '⁽', ')': '⁾', a: 'ᵃ', b: 'ᵇ', c: 'ᶜ', d: 'ᵈ', e: 'ᵉ', f: 'ᶠ',
  g: 'ᵍ', h: 'ʰ', i: 'ⁱ', j: 'ʲ', k: 'ᵏ', l: 'ˡ', m: 'ᵐ', n: 'ⁿ', o: 'ᵒ',
  p: 'ᵖ', r: 'ʳ', s: 'ˢ', t: 'ᵗ', u: 'ᵘ', v: 'ᵛ', w: 'ʷ', x: 'ˣ', y: 'ʸ',
  z: 'ᶻ', A: 'ᴬ', B: 'ᴮ', D: 'ᴰ', E: 'ᴱ', G: 'ᴳ', H: 'ᴴ', I: 'ᴵ', J: 'ᴶ',
  K: 'ᴷ', L: 'ᴸ', M: 'ᴹ', N: 'ᴺ', O: 'ᴼ', P: 'ᴾ', R: 'ᴿ', T: 'ᵀ', U: 'ᵁ',
  V: 'ⱽ', W: 'ᵂ', 'α': 'ᵅ', 'β': 'ᵝ', 'γ': 'ᵞ', 'δ': 'ᵟ', 'θ': 'ᶿ',
  'ϕ': 'ᵠ', 'φ': 'ᵠ', 'χ': 'ᵡ', ' ': ' ', '′': '′', '∗': '*', '*': '*',
  '·': '·', '∘': '°', '/': 'ᐟ',
}

const SUB: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆',
  '7': '₇', '8': '₈', '9': '₉', '+': '₊', '-': '₋', '−': '₋', '=': '₌',
  '(': '₍', ')': '₎', a: 'ₐ', e: 'ₑ', h: 'ₕ', i: 'ᵢ', j: 'ⱼ', k: 'ₖ',
  l: 'ₗ', m: 'ₘ', n: 'ₙ', o: 'ₒ', p: 'ₚ', r: 'ᵣ', s: 'ₛ', t: 'ₜ', u: 'ᵤ',
  v: 'ᵥ', x: 'ₓ', 'β': 'ᵦ', 'γ': 'ᵧ', 'ρ': 'ᵨ', 'ϕ': 'ᵩ', 'φ': 'ᵩ',
  'χ': 'ᵪ', ' ': ' ', ',': ',',
}

const VULGAR: Record<string, string> = {
  '1/2': '½', '1/3': '⅓', '2/3': '⅔', '1/4': '¼', '3/4': '¾', '1/5': '⅕',
  '2/5': '⅖', '3/5': '⅗', '4/5': '⅘', '1/6': '⅙', '5/6': '⅚', '1/8': '⅛',
  '3/8': '⅜', '5/8': '⅝', '7/8': '⅞',
}

const ACCENTS: Record<string, string> = {
  vec: '⃗', hat: '̂', widehat: '̂', bar: '̄',
  overline: '̅', tilde: '̃', widetilde: '̃', dot: '̇',
  ddot: '̈', check: '̌', breve: '̆', acute: '́',
  grave: '̀', underline: '̲',
}

const BB: Record<string, string> = {
  C: 'ℂ', H: 'ℍ', N: 'ℕ', P: 'ℙ', Q: 'ℚ', R: 'ℝ', Z: 'ℤ',
}

// Letters with gaps in the Mathematical Alphanumeric Symbols block.
const ALPHA_HOLES: Record<string, Record<string, string>> = {
  cal: { B: 'ℬ', E: 'ℰ', F: 'ℱ', H: 'ℋ', I: 'ℐ', L: 'ℒ', M: 'ℳ', R: 'ℛ', e: 'ℯ', g: 'ℊ', o: 'ℴ' },
  frak: { C: 'ℭ', H: 'ℌ', I: 'ℑ', R: 'ℜ', Z: 'ℨ' },
  bb: BB,
}

const ALPHA_BASE: Record<string, number> = {
  bf: 0x1d400, cal: 0x1d49c, frak: 0x1d504, bb: 0x1d538, sf: 0x1d5a0, tt: 0x1d670,
}

function styleLetters(text: string, style: string): string {
  const base = ALPHA_BASE[style]
  if (base === undefined) return text
  let out = ''
  for (const ch of text) {
    const hole = ALPHA_HOLES[style]?.[ch]
    if (hole) out += hole
    else if (ch >= 'A' && ch <= 'Z') out += String.fromCodePoint(base + ch.charCodeAt(0) - 65)
    else if (ch >= 'a' && ch <= 'z') out += String.fromCodePoint(base + 26 + ch.charCodeAt(0) - 97)
    else if (style === 'bf' && ch >= '0' && ch <= '9') out += String.fromCodePoint(0x1d7ce + ch.charCodeAt(0) - 48)
    else if (style === 'bb' && ch >= '0' && ch <= '9') out += String.fromCodePoint(0x1d7d8 + ch.charCodeAt(0) - 48)
    else out += ch
  }
  return out
}

const STYLE_COMMANDS: Record<string, string> = {
  mathbf: 'bf', boldsymbol: 'bf', bm: 'bf', mathbb: 'bb', mathcal: 'cal',
  mathscr: 'cal', mathfrak: 'frak', mathsf: 'sf', mathtt: 'tt',
}

const PLAIN_COMMANDS = new Set([
  'text', 'textrm', 'textit', 'textbf', 'mathrm', 'mathit', 'operatorname',
  'mbox', 'hbox', 'textsf', 'texttt', 'mathnormal', 'emph',
])

const DROP_ARG = new Set(['label', 'tag', 'hspace', 'vspace', 'phantom', 'color'])

function isAtom(s: string): boolean {
  return [...s].length <= 1 || /^[√∛∜]?[\p{L}\p{N}.]+[′]*$/u.test(s)
}

function script(text: string, table: Record<string, string>, mark: string): string {
  const chars = [...text]
  if (chars.length > 0 && chars.every(c => table[c] !== undefined)) {
    return chars.map(c => table[c]).join('')
  }
  return chars.length <= 1 ? mark + text : `${mark}(${text})`
}

class Parser {
  private i = 0
  private readonly src: string

  constructor(src: string) {
    this.src = src
  }

  parse(stop?: string): string {
    let out = ''
    while (this.i < this.src.length) {
      const ch = this.src[this.i]!
      if (stop && ch === stop) {
        this.i++
        return out
      }
      out += this.token()
    }
    return out
  }

  private group(): string {
    this.skipSpace()
    const ch = this.src[this.i]
    if (ch === undefined) return ''
    if (ch === '{') {
      this.i++
      return this.parse('}')
    }
    return this.token()
  }

  private optional(): string | undefined {
    this.skipSpace()
    if (this.src[this.i] !== '[') return undefined
    this.i++
    return this.parse(']')
  }

  private rawGroup(): string {
    this.skipSpace()
    if (this.src[this.i] !== '{') return this.src[this.i++] ?? ''
    let depth = 0
    const start = this.i
    for (; this.i < this.src.length; this.i++) {
      if (this.src[this.i] === '{') depth++
      else if (this.src[this.i] === '}' && --depth === 0) {
        this.i++
        return this.src.slice(start + 1, this.i - 1)
      }
    }
    return this.src.slice(start + 1)
  }

  private skipSpace() {
    while (this.src[this.i] === ' ' || this.src[this.i] === '\n') this.i++
  }

  private token(): string {
    const ch = this.src[this.i++]!
    switch (ch) {
      case '\\':
        return this.command()
      case '{':
        return this.parse('}')
      case '}':
        return ''
      case '^':
        return script(this.group(), SUPER, '^')
      case '_':
        return script(this.group(), SUB, '_')
      case '~':
        return ' '
      case '&':
        return ' '
      case '\n':
      case '\t':
        return ' '
      case "'":
        return '′'
      case '-':
        return '−'
      case '*':
        return '∗'
      default:
        return ch
    }
  }

  private command(): string {
    const m = /^([A-Za-z]+|.)/.exec(this.src.slice(this.i))
    if (!m) return ''
    const name = m[1]!
    this.i += name.length
    if (name === '\\') return '; '
    if (name === 'frac' || name === 'dfrac' || name === 'tfrac' || name === 'cfrac') {
      const num = this.group()
      const den = this.group()
      const vulgar = VULGAR[`${num}/${den}`]
      if (vulgar) return vulgar
      return `${isAtom(num) ? num : `(${num})`}/${isAtom(den) ? den : `(${den})`}`
    }
    if (name === 'binom' || name === 'dbinom' || name === 'tbinom') {
      return `C(${this.group()}, ${this.group()})`
    }
    if (name === 'sqrt') {
      const index = this.optional()
      const body = this.group()
      const root = index === '3' ? '∛' : index === '4' ? '∜' : index ? `${script(index, SUPER, '^')}√` : '√'
      return isAtom(body) ? root + body : `${root}(${body})`
    }
    if (name === 'begin' || name === 'end') {
      const env = this.rawGroup()
      // Column specs and alignat counts are an argument, not content.
      if (name === 'begin' && /^(array|tabular|alignat\*?)$/.test(env)) this.rawGroup()
      if (/matrix|cases/.test(env)) return name === 'begin' ? '[' : ']'
      return ''
    }
    if (name in ACCENTS) {
      const body = this.group()
      return [...body].length === 1 ? body + ACCENTS[name] : `${body}${ACCENTS[name]}`
    }
    if (name in STYLE_COMMANDS) return styleLetters(this.group(), STYLE_COMMANDS[name]!)
    if (PLAIN_COMMANDS.has(name)) return this.rawGroup().replace(/\\([{}$%&_#])/g, '$1')
    if (DROP_ARG.has(name)) {
      this.rawGroup()
      return ''
    }
    if (name === 'textcolor') {
      this.rawGroup()
      return this.group()
    }
    if (name === 'overset' || name === 'stackrel') {
      this.group()
      return this.group()
    }
    if (name === 'underbrace' || name === 'overbrace' || name === 'boxed' || name === 'cancel') {
      return this.group()
    }
    if (name === 'pmod') return ` (mod ${this.group()})`
    if (name === 'not') {
      const next = this.group()
      return next === '=' ? '≠' : next === '∈' ? '∉' : next + '̸'
    }
    if (FUNCTIONS.has(name)) return name === 'bmod' ? ' mod ' : name
    if (name in SYMBOLS) return SYMBOLS[name]!
    return '\\' + name
  }
}

export function toUnicode(tex: string): string {
  return new Parser(tex.trim()).parse().replace(/ {2,}/g, '  ').trim()
}
