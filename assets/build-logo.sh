#!/usr/bin/env bash
# Rebuild logo SVG/PNG files from logo.tex. Needs latex, dvisvgm, rsvg-convert.
set -euo pipefail
cd "$(dirname "$0")"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

latex -interaction=nonstopmode -halt-on-error -output-directory="$tmp" logo.tex >/dev/null
dvisvgm --no-fonts --exact-bbox --page=1- -o "$tmp/p%p.svg" "$tmp/logo.dvi" 2>/dev/null

cp "$tmp/p1.svg" logo-light.svg
cp "$tmp/p2.svg" logo-dark.svg
cp "$tmp/p3.svg" icon.svg
cp "$tmp/p4.svg" header-light.svg
cp "$tmp/p5.svg" header-dark.svg

rsvg-convert -h 256 logo-light.svg -o logo-light.png
rsvg-convert -h 256 logo-dark.svg -o logo-dark.png
rsvg-convert -w 512 -h 512 icon.svg -o icon-512.png
rsvg-convert -h 256 header-light.svg -o header-light.png
rsvg-convert -h 256 header-dark.svg -o header-dark.png
