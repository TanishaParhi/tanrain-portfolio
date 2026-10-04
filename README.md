# TanRain — a small room at blue hour

The portfolio of Tanisha Parhi (TanRain). The home page is a 3D diorama room floating on
still water: click the **screen** for films, the **desk** for the lab (experiments), the
**bookshelf** for the library (poems and stories), and the **window** for about. Each
opens as its own scrolling room. Phones get the same rooms. If 3D can't run (no WebGL,
or a blocked CDN), the site falls back to a plain scrolling page; `?flat` forces that
version.

**Stack:** plain HTML/CSS/JS with no build step. The 3D room uses three.js from the
jsDelivr CDN and is built entirely from code, with no model files. Videos are embedded
from Google Drive (nothing self-hosted). Stills are compressed JPEGs in `assets/img/`.

| file | what it holds |
|---|---|
| `index.html` | all the words, films, experiments and poems |
| `style.css` | the look (colours and fonts are variables at the top) |
| `app.js` | panels, film carousel, bookshelf, sound, simple-version fallback |
| `room.js` | the 3D room |

## Run locally

```
python3 -m http.server 8137
# open http://localhost:8137
```

## How to update this later

Everything you'd normally change lives in `index.html`. To add a **film**, find the
`02 · THE SCREENING ROOM` section, copy one `<article class="film">` block, and edit its
`data-` attributes: `data-title`, `data-year`, `data-yy` (two-digit year for the
handwritten tag), `data-label` (the handwritten banner), `data-status`, `data-img` (a
still in `assets/img/`) and `data-drive` (the long ID in a Drive share link). Then edit
the logline and notes inside the block. The carousel and the film index build themselves
from these blocks. An **experiment** works the same way inside `<div class="collage">` in
the lab section; add `data-aspect="portrait"` for vertical videos. A **poem** is a
`<details class="poem">` block in the library section, and its book spine is generated
automatically. Every Drive video must be shared as "Anyone with the link — Viewer", or
it shows "file does not exist" to visitors. Compress new images before adding them
(`sips -Z 1400 -s format jpeg -s formatOptions 64 in.png --out assets/img/out.jpg`) to
stay well under the 15 MB budget (currently about 4.5 MB). To change what plays on the
3D projection screen or hangs on the polaroid wall, edit the `stillUrls` list and the
polaroid list in `room.js`. After any change, bump the `?v=` number on the
`style.css` / `app.js` / `room.js` links in `index.html` so browsers fetch the new files.
Test locally, then commit and push; GitHub Pages redeploys on its own.
