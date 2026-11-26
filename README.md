# Hayat-us-Sahaba Reader (Part 3)

An Urdu reading website for Hayat-us-Sahaba, volume 3. It is a static site with no build step and no server.

## Run it on your computer

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Then open `http://localhost:8765`.

## Reader accounts

Readers can register with an email and a 6-digit PIN once an account server is connected in `config.js`. See `SETUP-ACCOUNTS.md`. Never commit a secret.

## Files

| File | Purpose |
|---|---|
| `index.html` | Page layout and styles |
| `app.js` | Reading, headings, highlights, notes, bookmarks, search, profiles |
| `journey.js` | Progress display, daily goal and streak |
| `cloud.js` | Email and PIN accounts, and saving to the account server |
| `art.js` | Original illustrations |
| `data/` | The book text and contents |

## About the text

- It has not yet been proofread by a scholar. Check Quran verses and duas against reliable copies.
- Original pages 716 and 717 are missing from the source scan.
