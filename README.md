# Hayat-us-Sahaba Reader (Part 3)

An Urdu reading website for Hayat-us-Sahaba, volume 3. It is a static site with no build step and no server.

## Run it on your computer

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Then open `http://localhost:8765`.

## Google sign-in

The OAuth Client ID is in `config.js`. A Client ID is public. Never commit a client secret. See `SETUP-GOOGLE-SIGNIN.md`.

## Files

| File | Purpose |
|---|---|
| `index.html` | Page layout and styles |
| `app.js` | Reading, headings, highlights, notes, bookmarks, search, profiles |
| `journey.js` | Progress display, daily goal and streak |
| `cloud.js` | Google sign-in and saving to the reader's Drive app folder |
| `art.js` | Original illustrations |
| `data/` | The book text and contents |

## Before making the book public

- The text has not been proofread by a scholar. Check Quran verses and duas against reliable copies.
- Original pages 716 and 717 are missing from the source scan.
- Get permission for the Urdu translation, and for footnotes taken from the English edition.
