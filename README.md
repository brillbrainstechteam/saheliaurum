# Saheli Aurum — Website

A modern jewellery-house website for **Saheli Aurum** (Sunil Jain Legacy, est. 1984, Raipur & Durg).
*Indian craftsmanship, contemporary luxury.*

This is a multipage static site — plain HTML/CSS/JS, no build step. It can be opened
directly or deployed to any static host (GitHub Pages, Netlify, etc.).

## Status

- ✅ **Homepage** (`index.html`) — the flagship brand page.
- ✅ **About** (`about.html`) — legacy, philosophy, craft, awards and recognition.
- ✅ **Collections** (`collections.html`) — all 11 signature collections.
- ✅ **Shop** (`shop.html`) — assisted exploration by category, jewellery and style.
- ✅ **The Saheli Bride** (`bridal.html`) — bridal worlds, ceremonies and consultation path.
- ✅ **Bespoke** (`bespoke.html`) — one-of-one process and consultation path.
- ✅ **Stores & Contact** (`stores.html`) — Raipur, Durg, WhatsApp, directions and appointment form.

## Homepage sections

Hero → Discover (brand essence + stats) → Signature Collections (11 collections, each with its
own visual personality) → **Jewellery for Every Moment** (cinematic sticky scroll sequence:
Bride, Engagement, Family, Achievement, Gifting, Self) → Craftsmanship → Bespoke (concept→creation)
→ The Saheli Bride → Our Promise (trust) → Saheli Privileges (saving schemes) → Heritage timeline
(1984 → awards → 2026) → Visit (stores + appointment booking) → Footer.

## Structure

```
index.html              Homepage markup
about.html              Legacy, craft and recognition page
collections.html        Signature collections directory
shop.html               Assisted shopping exploration page
bridal.html             Bridal world and ceremony page
bespoke.html            Bespoke jewellery page
stores.html             Stores, contact and appointment page
assets/css/styles.css   Design system + all components (single stylesheet)
assets/js/main.js       Header state, active route, mobile nav, scroll reveals, hero parallax,
                        the cinematic "moments" sequence, appointment form
assets/img/             Web-optimised photography (cropped from the brand brochure + catalogue)
images_catalogue/       Original source photography (not used directly by the site)
*.docx                  Source brand + IA documents (reference only)
```

## Design system

- **Type:** Cormorant Garamond (display), EB Garamond (body), Jost (UI/labels) — via Google Fonts.
- **Palette:** ivory/cream grounds, warm gold, deep emerald, charcoal, with per-section accents.
- Motion respects `prefers-reduced-motion`. Fully responsive (desktop / tablet / mobile).

## Run locally

```bash
cd saheli_aurum
node -e "const http=require('http'),fs=require('fs'),path=require('path');const root=process.cwd();http.createServer((req,res)=>{let url=decodeURIComponent(req.url.split('?')[0]);if(url==='/'||url==='')url='/index.html';fs.readFile(path.join(root,url),(err,data)=>{if(err){res.writeHead(404);return res.end('Not found')}res.end(data)})}).listen(8781)"
```

Then open http://127.0.0.1:8781/ . (A dev server is only needed so the browser loads the
image/CSS/JS assets over HTTP; opening `index.html` from disk works too, minus some paths.)

## Notes

- Imagery was cropped and colour-preserved from the brand brochure and the catalogue photo;
  the brochure itself is a **content source**, not reproduced as-is.
- The appointment form is a front-end demo — it does not send data anywhere yet.
