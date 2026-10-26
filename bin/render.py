#!/usr/bin/env python3
"""Render LaTeX math to PNGs sized to whole terminal cells.

stdin:  {"jobs": [{"key": str, "tex": str}], "fg": [r, g, b], "scale": float,
         "preamble": str}
stdout: {"cell": [w, h], "results": {key: {"file", "columns", "rows"} | {"error"}}}

Each PNG is padded to an exact multiple of the terminal's cell size so the
terminal never stretches it. The cell size is read from the pty of the
nearest ancestor that owns one (TIOCGWINSZ), falling back to 10x20.
"""
import fcntl
import json
import os
import re
import shutil
import struct
import subprocess
import sys
import tempfile
import termios
from concurrent.futures import ThreadPoolExecutor

CACHE = os.path.join(
    os.environ.get("XDG_CACHE_HOME") or os.path.expanduser("~/.cache"),
    "claude-latex-render",
)

DEFAULT_PREAMBLE = r"""
\usepackage{amsmath,amssymb,amsfonts,mathtools,bm}
\IfFileExists{physics.sty}{\usepackage{physics}}{}
\IfFileExists{mathrsfs.sty}{\usepackage{mathrsfs}}{}
"""

# Environments that are already display math; anything else is wrapped in \[ \].
DISPLAY_ENVS = re.compile(
    r"^\\begin\{(equation|align|gather|multline|flalign|alignat|eqnarray|displaymath)\*?\}"
)


def cell_size():
    pid = os.getppid()
    while pid > 1:
        try:
            for fd_no in (1, 0, 2):
                target = os.readlink(f"/proc/{pid}/fd/{fd_no}")
                if target.startswith("/dev/pts/") or target.startswith("/dev/tty"):
                    fd = os.open(target, os.O_RDONLY | os.O_NOCTTY)
                    try:
                        rows, cols, xp, yp = struct.unpack(
                            "HHHH", fcntl.ioctl(fd, termios.TIOCGWINSZ, b"\0" * 8)
                        )
                    finally:
                        os.close(fd)
                    if cols and rows and xp and yp:
                        return xp // cols, yp // rows
        except OSError:
            pass
        try:
            with open(f"/proc/{pid}/stat") as f:
                pid = int(f.read().rsplit(")", 1)[1].split()[1])
        except (OSError, ValueError, IndexError):
            break
    return 10, 20


def body_for(tex):
    tex = tex.strip()
    if DISPLAY_ENVS.match(tex):
        # Drop equation numbers: the starred form of every numbered env.
        tex = re.sub(
            r"\\(begin|end)\{(equation|align|gather|multline|flalign|alignat|eqnarray)\}",
            r"\\\1{\2*}",
            tex,
        )
        return tex
    return "\\[\n" + tex + "\n\\]"


def png_size(path):
    with open(path, "rb") as f:
        head = f.read(24)
    return struct.unpack(">II", head[16:24])


def render_one(job, fg, dpi, cw, ch, preamble):
    key = job["key"]
    out = os.path.join(CACHE, f"{key}-{cw}x{ch}.png")
    meta = out + ".json"
    if os.path.exists(out) and os.path.exists(meta):
        with open(meta) as f:
            return key, json.load(f)

    work = tempfile.mkdtemp(prefix="ltx-", dir=CACHE)
    try:
        src = os.path.join(work, "m.tex")
        with open(src, "w") as f:
            f.write(
                "\\documentclass[12pt]{article}\n"
                + preamble
                + "\n\\pagestyle{empty}\n\\setlength{\\textwidth}{40cm}\n"
                + "\\begin{document}\n"
                + body_for(job["tex"])
                + "\n\\end{document}\n"
            )
        run = subprocess.run(
            ["latex", "-interaction=nonstopmode", "-halt-on-error", "-no-shell-escape", "m.tex"],
            cwd=work,
            capture_output=True,
            text=True,
            timeout=20,
        )
        if run.returncode != 0:
            err = [l[2:] for l in run.stdout.splitlines() if l.startswith("! ")]
            return key, {"error": err[0] if err else "latex failed"}

        raw = os.path.join(work, "m.png")
        run = subprocess.run(
            [
                "dvipng", "-q", "-T", "tight", "-D", str(dpi),
                "-bg", "Transparent", "-fg", "RGB {} {} {}".format(*fg),
                "-o", raw, "m.dvi",
            ],
            cwd=work,
            capture_output=True,
            text=True,
            timeout=20,
        )
        if run.returncode != 0 or not os.path.exists(raw):
            return key, {"error": "dvipng failed"}

        w, h = png_size(raw)
        # A little air on the left so the formula does not touch the gutter.
        columns = -(-(w + cw) // cw)
        rows = -(-(h + ch // 2) // ch)
        if columns > 255 or rows > 255:
            return key, {"error": "formula too large"}
        run = subprocess.run(
            [
                "magick", raw, "-background", "none", "-gravity", "center",
                "-extent", f"{columns * cw}x{rows * ch}",
                "PNG32:" + out,
            ],
            capture_output=True,
            text=True,
            timeout=20,
        )
        if run.returncode != 0:
            return key, {"error": "magick failed: " + run.stderr.strip()[:200]}

        result = {"file": out, "columns": columns, "rows": rows}
        with open(meta, "w") as f:
            json.dump(result, f)
        return key, result
    except subprocess.TimeoutExpired:
        return key, {"error": "timed out"}
    finally:
        shutil.rmtree(work, ignore_errors=True)


def main():
    req = json.load(sys.stdin)
    os.makedirs(CACHE, exist_ok=True)
    cw, ch = cell_size()
    # 12pt body text at this DPI is about 3/4 of a cell tall, like the terminal font.
    dpi = max(50, round(ch * 4.4 * float(req.get("scale") or 1)))
    preamble = req.get("preamble") or DEFAULT_PREAMBLE
    fg = req.get("fg") or [230, 230, 230]
    jobs = req.get("jobs") or []
    with ThreadPoolExecutor(max_workers=min(8, max(1, len(jobs)))) as pool:
        results = dict(pool.map(lambda j: render_one(j, fg, dpi, cw, ch, preamble), jobs))
    json.dump({"cell": [cw, ch], "results": results}, sys.stdout)


if __name__ == "__main__":
    main()
