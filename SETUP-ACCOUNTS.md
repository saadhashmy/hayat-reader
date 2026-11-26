# Switch on reader accounts

Readers register with an email and a 6-digit PIN. Their progress is saved on a small account server. The website can stay on GitHub Pages. The server runs on Cloudflare (a Worker with a D1 database). Check Cloudflare's current free limits before you start. Cloudflare may rename menus.

The server files (`worker.js`, `schema.sql`) are not part of the website. They are kept in a separate private repository, in its `server` folder.

1. Create or sign in to your own Cloudflare account.
2. Create a **D1 database** named `hayat-accounts`. Open its **Console**, paste all of `schema.sql` and run it. If the console accepts only one statement at a time, run them one by one.
3. Create a **Worker** named `hayat-accounts`. Replace its code with all of `worker.js` and deploy.
4. In the Worker's settings, add a **D1 database binding** named `DB` that points to `hayat-accounts`.
5. Add a **secret** named `PEPPER`: at least 32 random characters from a password manager. Keep a private copy. **If it is lost or changed, no reader can sign in with their PIN or recovery code.** Never put it in a file in this website.
6. Add a text variable named `ALLOWED_ORIGINS` with the website's origin, for example `https://yourname.github.io` (no path and no final slash).
7. Deploy again. Copy the Worker's address.
8. Put that address in `config.js` as `apiBase`, then commit and push.
9. Test: register, mark a story read, sign in on a second device and check that it appears.

## What the server stores

Email, name, a protected form of the PIN and recovery code, sign-in records, and each reader's progress, bookmarks, highlights, notes and last position. It also keeps short records, with addresses and emails in coded form, to limit repeated attempts. The owner of the Cloudflare account can access the stored data.

## Limits to know

- No email is sent, so the server cannot check that an address belongs to the person registering.
- A forgotten PIN needs the recovery code. If both are lost, the reader cannot get back into that account.
- After 5 wrong PINs, an email waits 15 minutes (20 tries in a day at most). Someone else could use this to lock a reader out for a while.
- A 6-digit PIN is weaker than a good password.
