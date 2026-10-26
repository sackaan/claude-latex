import type { EngineInterface, Register } from 'claude-code'

import { inlineMath, split } from './split'
import { toUnicode } from './unicode'

type Rendered = { file: string; columns: number; rows: number } | { error: string }

type Rgb = [number, number, number]

const DARK_FG: Rgb = [230, 230, 230]
const LIGHT_FG: Rgb = [20, 20, 20]

function parseColor(value: unknown): Rgb | undefined {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(String(value ?? '').trim())
  return m ? [parseInt(m[1]!, 16), parseInt(m[2]!, 16), parseInt(m[3]!, 16)] : undefined
}

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 24)
}

type Settings = { scale: number; color: Rgb | undefined; python: string }

// Rendered formulas by key, and the renders in flight, for the module's life;
// the PNGs themselves are cached on disk by the renderer.
const rendered = new Map<string, Rendered>()
const inFlight = new Map<string, Promise<void>>()

async function foreground($: EngineInterface, settings: Settings): Promise<Rgb> {
  if (settings.color) return settings.color
  const theme = (await $.config.list()).find(row => row.key === 'theme')
  return String(theme?.value ?? 'dark').startsWith('light') ? LIGHT_FG : DARK_FG
}

async function renderAll($: EngineInterface, settings: Settings, jobs: { key: string; tex: string }[], fg: Rgb) {
  const missing = jobs.filter(job => !rendered.has(job.key) && !inFlight.has(job.key))
  if (missing.length > 0) {
    const batch = (async () => {
      try {
        const { exitCode, stdout, stderr } = await $.process.run(
          [settings.python, '-I', `${$.plugin.root}/bin/render.py`],
          { stdin: JSON.stringify({ jobs: missing, fg, scale: settings.scale }), timeoutMs: 60_000 },
        )
        if (exitCode !== 0) throw new Error(stderr.trim().split('\n').pop() || `exit ${exitCode}`)
        const { results } = JSON.parse(stdout) as { results: Record<string, Rendered> }
        for (const job of missing) rendered.set(job.key, results[job.key] ?? { error: 'no result' })
      } catch (error) {
        for (const job of missing) rendered.set(job.key, { error: `renderer failed: ${String(error)}` })
      } finally {
        for (const job of missing) inFlight.delete(job.key)
      }
    })()
    for (const job of missing) inFlight.set(job.key, batch)
  }
  await Promise.all(jobs.map(job => inFlight.get(job.key)))
}

export const register: Register = (on, options) => {
  const settings: Settings = {
    scale: Number(options.scale) || 1,
    color: parseColor(options.color),
    python: String(options.python || 'python3'),
  }

  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    const { text } = e.props
    if (!/\$|\\\(|\\\[|\\begin\{/.test(text)) return next(e)

    const segments = split(text)
    const hasDisplay = segments.some(s => s.kind === 'math')

    // Only a terminal shows pictures; elsewhere, and for inline math, Unicode.
    if (!hasDisplay || e.surface !== 'terminal') {
      const flat = segments
        .map(s => (s.kind === 'math' ? `\`\`\`\n${toUnicode(s.tex)}\n\`\`\`` : s.text))
        .join('\n\n')
      return next({ ...e, props: { ...e.props, text: inlineMath(flat) } })
    }

    const fg = await foreground($, settings)
    const jobs = await Promise.all(
      segments.flatMap(s =>
        s.kind === 'math' ? [sha256(`${s.tex}\u0000${fg.join(',')}\u0000${settings.scale}`).then(key => ({ key, tex: s.tex }))] : [],
      ),
    )
    await renderAll($, settings, jobs, fg)

    const { Box, Text, Image } = $.ui.resolve(e)
    const width = Math.max(10, (e.viewport?.columns ?? 80) - 4)
    const children = []
    let jobIndex = 0

    for (const [i, segment] of segments.entries()) {
      const isFirst = i === 0 && e.props.isFirstOfReply

      if (segment.kind === 'text') {
        children.push(
          await next({ ...e, props: { ...e.props, text: inlineMath(segment.text), isFirstOfReply: isFirst } }),
        )
        continue
      }

      const result = rendered.get(jobs[jobIndex++]!.key)
      const alt = toUnicode(segment.tex)
      let body
      if (result && 'file' in result) {
        // Too wide for the screen: shrink the box, the picture scales with it.
        const shrink = Math.min(1, width / result.columns)
        body = (
          <Image
            source={{ file: result.file, format: 'png' }}
            columns={Math.max(1, Math.floor(result.columns * shrink))}
            rows={Math.max(1, Math.round(result.rows * shrink))}
            alt={alt}
          />
        )
      } else {
        body = (
          <Box flexDirection="column">
            <Text>{alt}</Text>
            <Text dimColor>LaTeX error: {result?.error ?? 'not rendered'}</Text>
          </Box>
        )
      }

      children.push(
        <Box flexDirection="row" marginTop={1}>
          <Box width={2} flexShrink={0}>
            <Text color="text">{isFirst ? '⏺' : ' '}</Text>
          </Box>
          {body}
        </Box>,
      )
    }

    return <Box flexDirection="column">{children}</Box>
  })
}
