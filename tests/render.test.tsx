import { expect, test } from 'claude-code/testing'

const REPLY = String.raw`Inline $\alpha^2 + \beta_1$ here.

$$
\int_0^\infty e^{-x^2}\,dx = \frac{\sqrt{\pi}}{2}
$$

And after.`

function message(surface: 'terminal' | 'desktop', text: string) {
  return {
    plugin: 'latex-render',
    component: 'AssistantMessage',
    requestId: 'msg-1',
    surface,
    props: { text, isFirstOfReply: true },
  } as const
}

test('display math becomes an Image, text stays the engine\'s markdown', async ($, on) => {
  const drawn: string[] = []
  on('config.list', () => ({ value: [{ key: 'theme', value: 'dark' }] }))
  on('process.run', (_, e) => {
    const { jobs } = JSON.parse(String(e.init?.stdin)) as { jobs: { key: string }[] }
    const results = Object.fromEntries(jobs.map(j => [j.key, { file: `/tmp/${j.key}.png`, columns: 14, rows: 3 }]))
    return { value: { exitCode: 0, stdout: JSON.stringify({ cell: [12, 24], results }), stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  on('ui.render', ($, e) => {
    if (e.component === 'AssistantMessage') drawn.push(e.props.text)
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })

  const ui = await $.ui.mount(message('terminal', REPLY))
  const image = await ui.find({ type: 'Image' })
  expect(image).toBeDefined()
  expect(drawn).toEqual(['Inline α² + β₁ here.', 'And after.'])
  await ui.unmount()
})

test('a reply with no math is left alone', async ($, on) => {
  const drawn: string[] = []
  on('ui.render', ($, e) => {
    if (e.component === 'AssistantMessage') drawn.push(e.props.text)
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })

  const ui = await $.ui.mount(message('terminal', 'Costs $5 and $10, run `echo $HOME`.'))
  expect(drawn).toEqual(['Costs $5 and $10, run `echo $HOME`.'])
  await ui.unmount()
})

test('desktop gets Unicode in place of pictures', async ($, on) => {
  const drawn: string[] = []
  on('ui.render', ($, e) => {
    if (e.component === 'AssistantMessage') drawn.push(e.props.text)
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })

  const ui = await $.ui.mount(message('desktop', REPLY))
  expect(drawn.length).toBe(1)
  expect(drawn[0]).toContain('∫₀^∞ e^(−x²) dx = √π/2')
  await ui.unmount()
})
