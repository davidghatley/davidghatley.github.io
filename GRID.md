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
Archivo 16/24 -> 17 · Archivo 850 expanded 20/24 -> 19 · Archivo 13/20 -> 14 · Archivo 700 25/28 -> 22 · Stem 7 16/20 -> 16 · Stem 7 16/24 -> 18 · Stem 7 32/40 -> 32 · Plex Mono 11/16 -> 12 · Plex Mono 13/28 -> 18.
Place text so `box top + offset` is a multiple of 4: either hang it from a known baseline (`margin-top: calc(B - offset)`) or nudge it with `position: relative; top: ±n` (body text 16/24 uses `top: -1px`, h2 25/28 `top: 2px`, phone H1 16/24 `top: 2px`). Stem 7 at 16px goes on a 20px line (baseline 16), at 32px on 40 (baseline 32).

## Index rows
- Section head: Stem 7 16/20, 32px tall, baseline at 20, ink hairline in its last pixel row; count right-aligned with its ink on the right edge (Stem 7 has a 2px right bearing, so `margin-right: -2px`). Sections are 48px apart; rows are sorted by `order` within `software, design system, client work, generative art, hardware`.
- Row bar: every item hangs from the top so the first baseline is `--rowb` (44px; 40 on phones). Each text box ends 7px under its last baseline (the title gets `padding-bottom: 2px`), and the bar pads `--rowtail - 7`, so a row ends `--rowtail` (32; 28 on phones) under its last baseline: single-line rows are 76px, two-line 100px.
- Columns (12): number col 1 · glyph col 2 · title cols 3-5 · oneliner cols 6-10 · tags from col 11 · arrow ends on the right edge. (8 cols: title 3-6, tags from col 7, oneliner moves into the open panel.) Phone: glyph at 0, title at 60px (the lockup name's line), then tags, then the arrow in a 26px track.
- Glyph: 5 cells of 8px (40px), whole pixels, centred on the title's cap height (cap 14 -> centre at baseline - 7) and taken out of the row height with a negative bottom margin. Arrow: 7 x 2px cells (14px) on the cap height (baseline - 14 to baseline). Tags: Plex Mono 11px with 1.4px tracking (8px per character), 20px frame, baseline at 14 in the frame = the title's baseline.
- Open row: content starts on the title's line (`2 * --step`), ends on the right edge; the tint bleeds 12px into the margin so no text edge moves. Previews and bespoke case bodies are snapped to a whole number of baselines by `snap4()` (ResizeObserver) so everything after them stays on the grid.
- Rules are drawn by absolutely positioned pseudo-elements in the block's first or last pixel row, never by borders that add height.

## Case shell
Lockup, then a 64px sticky bar (back link and title baselines at 40, arrows on the cap height 26-40, 48px buttons from 8 to 56, centred), then `.case-body` (snapped to 4px), then prev/next: 2px accent rule, Stem 7 baselines at 28 inside 48px links, 20px glyphs (4px cells) on the cap height.

## Known exception
The lockup is a Secret Sauce component: its mark and its line sit on the grid, but its name (Plex Mono 13 on the mark's 28px line) is optically centred on the mark, so its baseline is 2px off the 4px grid. Leave it; don't nudge the lockup.

## The ascii field
`field()` in `site.js`: one fixed canvas behind everything (html carries the paper; body is transparent because its containment stops background propagation). 16px cells, origin at `--x0` and the page top, so on desktop a column is 4 cells and a gutter is 1. Ramp ` .:-=+*#` in Stem 7 16px, chosen by four slow plane waves (separable tables, so it costs O(cols + rows) trig a frame), plus the cursor and the open row's band in the margins. Ink: paper mixed 6% (light) / 5.5% (dark) toward ink (about 4.5-6 L*), half that and only the peaks inside the text column; about 2% of margin cells in cobalt, one vermilion cell mid left margin; no teal or sun (the portfolio pair is cobalt + vermilion). It ticks every 2 x `--dur-cell`, redraws only the cells that changed (about 0.5-0.9ms a tick at 1440 in software rendering), blits on scroll, and stops under reduced motion, when the tab is hidden and when offscreen.
