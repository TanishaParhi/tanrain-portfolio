# TanRain — dive into the eyes

The portfolio of Tanisha Parhi (TanRain). It opens on a pair of eyes. Scroll or tap and
you dive through the iris into a small room floating on black glass water. The room has
portals:

- **the screen**: the screening hall, where each film is a 3D world built from its own frames
- **the shelf**: a magical library tower, where each floating book opens a poem into its own sky
- **the floating stairs**: a moonlit stairwell hung with posters from @aesthetes_meraki,
  with the archive of brand, ad and thumbnail work at the top
- **the desk**: the lab (experiments, Viviana world-building, generation tests, boards)
- **the window**: about

Palette is blues, whites, blacks and greens only. If 3D can't run (no WebGL, or a blocked
CDN), every page still works as a plain scrolling site; `?flat` forces that version.

**Stack:** static HTML/CSS/JS, no build step. three.js (jsDelivr), GSAP + ScrollTrigger
(cdnjs) and Lenis (unpkg) load from CDNs. Videos are embedded from Google Drive; nothing
is self-hosted. Images are WebP in `assets/`. Total weight is about 6.4 MB with every world
visited.

| file | what it holds |
|---|---|
| `data.js` | **all the content**: films, lab pieces, posters, archive, poems, links |
| `app.js` | routing, the eye dive, page layouts, scroll effects, stickers, modal, sound |
| `js/main.js` | the 3D engine: one renderer, switches worlds, labels, picking |
| `js/scenes/*.js` | one file per world: room, hall, film, library, poem, stairs, ambient |
| `js/shaders.js` | the black-glass water, portals, skies |
| `style.css` | the look (colours are variables at the top) |

## Run locally

```
python3 -m http.server 8137
# open http://localhost:8137
```

## How to update this later

Almost every change happens in `data.js`, and the pages and 3D worlds rebuild themselves
from it. To add a **film**, copy one entry in `films`. Give it an `id`, `title`, `year`,
`status`, `kind`, the `drive` ID (the long string in its Drive share link; the file must be
shared "Anyone with the link — Viewer"), a `logline`, a few `lines` that float through its
world, and a `world` (booth · ocean · glass · flame · stars · garden · neon). Then put its
stills in `assets/films/<id>/` as `00.webp, 01.webp …` and set `frames` to how many there
are. An **experiment** goes in `lab` the same way (`portrait: true` for vertical video). A
**poster** is one line in `posters` plus `assets/posters/<slug>.webp`. An **archive** piece
is one line in `archive` plus `assets/archive/<slug>.webp`. A **poem** goes in `poems`
(paste its paragraphs as HTML) and gets a sky in `worlds` (aurora · words · polaroid ·
kaleido · abyss · dawn · waves · nebula), with optional glossary `stickers`. Convert new
images to WebP at about 1100px wide so the site stays far under 15 MB, for example
`python3 -c "from PIL import Image; Image.open('in.png').convert('RGB').save('out.webp', quality=70)"`.
After any code change, bump the `?v=` number in `index.html` (it appears in several places,
including the import map) so browsers fetch the new files. Test locally, then commit and
push; GitHub Pages redeploys on its own.
