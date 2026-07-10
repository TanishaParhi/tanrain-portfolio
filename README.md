# TanRain — a house at blue hour

The interactive portfolio of Tanisha Parhi (TanRain): a navigable four-room "house" —
entry hall (about), screening room (AI films), the lab (experiments), and the library
(creative writing). Desktop gets the explorable camera-pan world; phones and no-JS
browsers get the same content as a plain scroll page.

**Stack:** plain HTML/CSS/JS, no build step, no dependencies. Videos are embedded from
Google Drive (nothing self-hosted), stills are compressed JPEGs in `assets/img/`.

## Run locally

```
python3 -m http.server 8137
# open http://localhost:8137
```

## How to update this later

Everything lives in three files. To add or change a **film**, open `index.html`, find the
`<!-- ROOM · SCREENING ROOM -->` section, copy an existing `<article class="film">` block,
and edit the title, meta line, logline, and the Drive file ID in the iframe's `data-src`
(the ID is the long string in any Drive share link — the file must be shared "anyone with
the link"). To add a **poem**, copy a `<details class="poem">` block in the library section
and paste the text in as `<p>` paragraphs (use `<br>` for line breaks inside a stanza).
New **images** go in `assets/img/` — compress them first
(`sips -Z 1400 -s format jpeg -s formatOptions 62 in.png --out out.jpg`) to keep the site
under its 15 MB budget. Colors and fonts are CSS variables at the top of `style.css`;
the room-navigation logic is all in `app.js` (the `ROOMS` map defines the floor plan).
After editing, test locally with the command above, then commit and push — the host
(GitHub Pages / Vercel / static host) redeploys from the repo automatically.
