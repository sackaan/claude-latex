<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/header-dark.svg">
  <img src="assets/header-light.svg" alt="LaTeX-render" width="420">
</picture>

**Real LaTeX math in Claude Code's terminal. Display math typeset by your TeX install and drawn as an image, inline math as Unicode.**

[![Claude Code plugin](https://img.shields.io/badge/Claude%20Code-plugin-D97757)](https://docs.claude.com/en/docs/claude-code/plugins)
[![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-blue)](./LICENSE)
[![Version](https://img.shields.io/badge/version-0.1.0-87867F)](./.claude-plugin/plugin.json)
[![TeX](https://img.shields.io/badge/needs-TeX%20Live%20%2B%20dvipng-1F1E1D?logo=latex&logoColor=white)](#requirements)
[![Terminals](https://img.shields.io/badge/terminal-kitty%20%C2%B7%20Ghostty%20%C2%B7%20iTerm2-262624)](#requirements)

</div>

Claude writes math as LaTeX. In a terminal that shows up as raw `\frac{\sqrt{\pi}}{2}`. latex-render hooks Claude Code's message renderer: display math is compiled with `latex` and shown as a picture sized to whole terminal cells, and inline math is rewritten to Unicode in place, so `$\alpha^2 + \beta_1$` reads as α² + β₁.

## Why latex-render

| Feature | Impact |
|---|---|
| **Your own TeX** | Display math goes through `latex` and `dvipng`, so it looks like a paper, not an approximation. `amsmath`, `mathtools`, `bm` and friends are loaded. |
| **Cell-exact images** | Each PNG is padded to a whole number of terminal cells, so the terminal never stretches it. Cell size is read from the pty. |
| **Inline math as Unicode** | `$…$` and `\(…\)` become Greek, sub- and superscripts, operators and arrows in the text itself. No images in the middle of a line. |
| **Prose stays prose** | Uses Pandoc's rule for `$`: `$5 and $10` is left alone. Code fences and inline code are never touched. |
| **Theme-aware colour** | Math is drawn in light or dark ink to match the Claude Code theme, or any hex colour you set. |
| **Cached** | Rendered formulas are kept on disk and in memory. A formula seen before costs nothing. |
| **Batched** | All display math in a reply is rendered in one process, up to 8 formulas in parallel. |
| **Graceful fallback** | A formula that fails to compile shows as Unicode with the LaTeX error under it. Surfaces without inline images (the desktop app) get Unicode throughout. |

## Install

In Claude Code 2.1.275 or later:

```text
/plugin install latex-render --marketplace sackaan/claude-latex
```

On older versions, add the marketplace first:

```text
/plugin marketplace add sackaan/claude-latex
/plugin install latex-render@claude-latex
```

Then ask Claude something with math in it:

```text
> what is the Gaussian integral?
```

### Requirements

- A terminal with inline images: [kitty](https://sw.kovidgoyal.net/kitty/), [Ghostty](https://ghostty.org/) or [iTerm2](https://iterm2.com/) 3.5+.
- `python3`, `latex`, `dvipng` and ImageMagick 7 (`magick`) on `PATH`.

| System | Packages |
|---|---|
| Arch | `pacman -S python texlive imagemagick` |
| Fedora | `dnf install python3 texlive-scheme-medium texlive-dvipng ImageMagick` |
| macOS | `brew install --cask mactex-no-gui` and `brew install imagemagick` |
| Debian / Ubuntu | `apt install python3 texlive-latex-extra dvipng`, plus ImageMagick 7 (the `imagemagick` package is 6 and has no `magick`) |

## Options

Set with `/config` under the plugin's options.

| Option | Default | Effect |
|---|---|---|
| `scale` | `1` | Size of display math relative to the terminal font. |
| `color` | empty | Hex colour such as `#e6e6e6`. Empty follows the theme (`#e6e6e6` on dark, `#141414` on light). |
| `python` | `python3` | Python 3 executable that runs the renderer. |

## What gets rendered

| Written as | Shown as |
|---|---|
| `$$…$$`, `\[…\]` | Image |
| `\begin{equation}`, `align`, `gather`, `multline`, `flalign`, `alignat`, `eqnarray`, `displaymath` (starred or not) | Image, without equation numbers |
| `$…$`, `\(…\)` | Unicode, in the line |
| Anything inside ```` ``` ```` fences or `` `inline code` `` | Untouched |

An opening `$` must not be followed by a space and a closing `$` must not be preceded by one or followed by a digit. That is why prices and shell variables stay as written.

Display math is compiled with `amsmath`, `amssymb`, `amsfonts`, `mathtools` and `bm`, plus `physics` and `mathrsfs` when installed. Rendered images are cached in `~/.cache/claude-latex-render/`.

## Project layout

```text
.claude-plugin/   plugin.json (manifest, options)  marketplace.json
hooks/            register.tsx (render hook)  split.ts (math finder)  unicode.ts (TeX to Unicode)
bin/              render.py (latex, dvipng, magick; cache)
tests/            render.test.tsx
assets/           logo.tex and the SVG/PNG files built from it
```

## Troubleshooting

- **Math shows as Unicode with `LaTeX error: …`** — the formula didn't compile. The message is the first error line from `latex`. Usually an undefined macro from a package not in the preamble.
- **`renderer failed: …`** — `render.py` didn't run. Check that the `python` option points at a Python 3 and that `latex`, `dvipng` and `magick` are on `PATH`.
- **`magick failed`** — ImageMagick 6 is installed. Install ImageMagick 7, which provides `magick`.
- **Images too big or too small** — adjust `scale`. If they are far off, the terminal isn't reporting its pixel size and the 10×20 fallback is in use.
- **`formula too large`** — the image would be over 255 cells in either direction. Split the formula.
- **Stale images after a TeX update** — the cache is keyed on the formula, colour, scale and cell size only. Clear it with `rm -rf ~/.cache/claude-latex-render`.

## Development

Point Claude Code at a local checkout:

```text
/plugin marketplace add ~/path/to/claude-latex
/plugin install latex-render@claude-latex
```

```sh
claude plugin validate .
claude plugin test .
./assets/build-logo.sh   # rebuild the logo, icon and header (needs latex, dvisvgm, rsvg-convert)
```

The logo is set in Latin Modern, the same family `latex` uses for the rendered math. The ✳ in place of the A is drawn in TikZ in `assets/logo.tex`.

## License

[GPL-3.0-only](./LICENSE)
