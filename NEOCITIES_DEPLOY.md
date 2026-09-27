# Deploying HAMIN GAMES to Neocities

HAMIN GAMES is a plain static site: HTML, CSS, JavaScript, WebP images. There is no build step,
no server code and no database. Progress is saved only in each visitor's browser (localStorage).

## 1. Build the clean upload folder

From the project root:

```bash
bash tools/build-deploy.sh
```

This creates **`neocities-deploy/`** containing only:

```
index.html  dress-up.html  lunch-time.html  photo-booth.html  run-hamin.html
practice-room.html  my-room.html  collection.html  not_found.html
css/   js/   data/   assets/
```

It never copies `research/`, `art-source/`, `tools/`, `docs/`, `.claude/` or the markdown docs, and it
**aborts** if any file in the folder is identical to a private reference photo from
`research/hamin-reference/`.

Optional check before uploading:

```bash
node tools/check-site.js neocities-deploy
```

It must print `OK` (no missing assets, no absolute or external URLs).

## 2. Upload

### Option A — Neocities dashboard (easiest)
1. Log in at https://neocities.org and open **Dashboard → Edit Site**.
2. Drag the **contents** of `neocities-deploy/` (not the folder itself) into the file manager.
   Keep the folder structure: `css/`, `js/`, `data/`, `assets/…` must sit next to `index.html`.
   Neocities accepts folders when you drag them in a modern browser; otherwise create the folders
   with **New Folder** and upload each folder's files.
3. Neocities serves `index.html` at your site root automatically.
4. `not_found.html` is Neocities' custom 404 page name, so broken links show the cute 404 window.

### Option B — Neocities CLI
```bash
gem install neocities        # once
neocities login
cd neocities-deploy
neocities push .
```
`push` uploads new and changed files (it does not delete remote files you removed locally).

## 3. What NOT to upload
- `research/` (research notes and **private reference photos** — never publish these)
- `art-source/` (raw generations, several hundred MB)
- `tools/`, `docs/`, `.claude/`, `*.md`
- `neocities-deploy/` itself as a nested folder

## 4. Limits & compatibility
- Everything uses **relative URLs**, so the site works at `https://<name>.neocities.org/` and in a
  sub-folder. Nothing points at `localhost`.
- File types used: `.html .css .js .webp .png` — all allowed on free Neocities accounts.
- Total size is printed by the build script (well under the free 1 GB quota).
- The site makes **no network requests** besides loading its own files (no analytics, no fonts CDN,
  no APIs). The visitor counter is decorative and local.

## 5. Testing locally before upload
Opening `index.html` directly (file://) works for everything except **Photo Booth PNG export**
(browsers block reading canvas pixels from local files). To test the full site, run any static server
in the project or deploy folder, for example:

```bash
python3 -m http.server 8765
```

and open http://localhost:8765/ in a browser. On Neocities (https) the export works normally.

## 6. Updating the site
1. Change files in the project (not in `neocities-deploy/`).
2. Re-run `bash tools/build-deploy.sh`.
3. Upload the changed files (or `neocities push .`).
Players keep their progress: saves are versioned (`haminGamesSave`, see `js/save.js`) and migrated
automatically when the save format changes.
