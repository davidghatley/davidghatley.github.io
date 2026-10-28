# The grid (home page and case-page shell)

One grid, defined at the top of `site.css` on `.site`. Check it with `index.html?grid=1` (or `case.html?p=<slug>&grid=1`): cobalt bands are columns, faint lines are the 4px baselines (stronger every 16px), vermilion lines are the content edges, and the footer line prints the numbers and the field's last frame time.

## Units
- **Baseline `--b` = 4px**, the lockup's cell. Every block height and every gap is a multiple of 4. Every text baseline sits on a multiple of 4 from the page top.
- **Gutter `--g` = 16px** (4 cells).
- **Columns and margins** (body is an inline-size container, so `100cqw` is the page width without the scrollbar):

| width | columns | column | margin (min) | content `--w` |
|---|---|---|---|---|
| < 640 | 4 | fluid | 16px (4 cells), symmetric | 100cqw - 32 |
| 640-1023 | 8 | `round(down, …, 4px)` | 28px (7 cells = the mark) | 8 col + 7 g |
| >= 1024 | 12 | 64px | 28px | 944px |

  `--x0` (the left margin) is rounded down to 4px from 640 up, so every column line is a whole pixel on the 4px lattice. One column plus one gutter is `--step`.

## Baselines: measured offsets (font, size/line box -> baseline from the box top)
Hoop 16/24 · Hoop Bold 13/20 · Hoop Bold 25/28 (Archivo retired 2026-10-27) · Stem 7 16/20 -> 16 · Stem 7 16/24 -> 18 · Stem 7 32/40 -> 32 (cap 7/8 em, descender 2 cells) · Plex Mono 11/16 -> 12 · Plex Mono 13/28 -> 18.
Place text so `box top + offset` is a multiple of 4: either hang it from a known baseline (`margin-top: calc(B - offset)`) or nudge it with `position: relative; top: ±n` (body text 16/24 uses `top: -1px`, h2 25/28 `top: 2px`, phone H1 16/24 `top: 2px`). Stem 7 at 16px goes on a 20px line (baseline 16), at 32px on 40 (baseline 32).

## Index rows
- Titles and section heads are Stem 7, lowercase: 32/40 (baseline 32) from 640px up, 16/20 (baseline 16) on phones, where 32 can't fit beside the tags. Cells are whole pixels (4px at 32, 2px at 16).
- Section head: 48px tall (32px on phones), label baseline 32 (20 on phones), ink hairline in its last pixel row; the count is Stem 7 16 muted on the label's baseline, its ink on the right edge (`margin-right: -2px` for Stem 7's right bearing). Sections are 48px apart; rows are sorted by `order` within `software, design system, client work, generative art, hardware`.
- Row bar: every item is centred between the dividers (`align-items: center`, 16px padding top and bottom, at least `--rowh` tall: 88px, 72 on phones). Centred means the ink: for one line of type the x-height/cap band, for wrapped text the whole block, for glyphs and the arrow their box. Stem 7 titles need `--oy: 1px` to put that band on the box centre; everything else lands within 0.5px with no nudge. Titles with descenders (p, g, y) read 2-4px low by ink and are correct. Checked by measuring rendered ink against the row centre at 1280/800/400 in both themes (row centring, 2026-10-22).
- Columns (12): number col 1 · glyph col 2 · title cols 3-6 · oneliner cols 7-10 · tags from col 11 · arrow ends on the right edge. (8 cols: title 3-6, tags from col 7, the oneliner moves into the open panel.) Phone: glyph at 0, title at 60px (the lockup name's line), then tags, then the arrow in a 26px track.
- Glyph and arrow: centred on the row like the text (see above); the old cap-height hang is gone.
- Tags: Plex Mono 11px with 1.4px tracking (8px per character), 20px frame, baseline 14 in the frame = the row baseline.
- Open swap: the title is an sr-only label plus aria-hidden per-character spans. On open each span steps into the project's `font_display` (weight 800) one `--dur-cell` at a time, left to right, and back right to left on close; all at once under reduced motion. The spans have `line-height: 0`, so the Stem 7 strut holds the baseline and the row height through the swap. VAASF swaps to DM Serif Display in capitals at 48px (32 on phones) via `TITLE_OPEN` in site.js.
- Open row: content starts on the title's line (`2 * --step`), ends on the right edge; the tint bleeds 12px into the margin so no text edge moves. Previews and bespoke case bodies are snapped to a whole number of baselines by `snap4()` (ResizeObserver) so everything after them stays on the grid.
- Rules are drawn by absolutely positioned pseudo-elements in the block's first or last pixel row, never by borders that add height.

## Case shell
Lockup, then a 64px sticky bar (back link and title baselines at 40, arrows on the cap height 26-40, 48px buttons from 8 to 56, centred), then `.case-body` (snapped to 4px), then prev/next: 2px accent rule, Stem 7 baselines at 28 inside 48px links, 20px glyphs (4px cells) on the cap height.

## Known exception
The lockup is a Secret Sauce component: its mark and its line sit on the grid, but its name (Plex Mono 13 on the mark's 28px line) is optically centred on the mark, so its baseline is 2px off the 4px grid. Leave it; don't nudge the lockup.

## The ascii field
`field()` in `site.js`: one fixed canvas behind everything (html carries the paper; body is transparent because its containment stops background propagation). 16px cells, origin at `--x0` and the page top, so on desktop a column is 4 cells and a gutter is 1. Ramp ` .:-=+*#` in Stem 7 16px, chosen by four slow plane waves (separable tables, so it costs O(cols + rows) trig a frame), plus the cursor and the open row's band in the margins. Ink: paper mixed 6% (light) / 5.5% (dark) toward ink (about 4.5-6 L*), half that and only the peaks inside the text column; about 2% of margin cells in cobalt, one vermilion cell mid left margin; no teal or sun (the portfolio pair is cobalt + vermilion). It ticks every 2 x `--dur-cell`, redraws only the cells that changed (about 0.5-0.9ms a tick at 1440 in software rendering), blits on scroll, and stops under reduced motion, when the tab is hidden and when offscreen.
