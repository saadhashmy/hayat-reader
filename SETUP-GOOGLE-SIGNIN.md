# Switch on "Sign in with Google"

You do this once. It needs your own Google account. Google renames its menus from time to time, so a label may differ slightly.

## Want to try it on your own computer first?
You can test sign-in before hosting. In step 6 below, add `http://localhost:8765` as an authorized JavaScript origin. Do steps 2 and 3. Then run this inside the `hayat-website` folder (Python must be installed):

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Open `http://localhost:8765` in your browser. Type the address exactly like that. Add your own email as a test user (step 4).

## 1. Put the website online
Upload the whole `hayat-website` folder to a host that serves static files over **https** (for example Netlify, Cloudflare Pages or GitHub Pages). Note the address, such as `https://your-site.example`.

Sign-in does not work if you open `index.html` straight from your computer.

## 2. Create a Client ID at console.cloud.google.com
1. Create a project, for example "Hayat Reader".
2. **APIs & Services → Library:** enable **Google Drive API**.
3. **Google Auth Platform** (or **OAuth consent screen**): enter the app name and your support email. Choose **External**.
4. **Data access / Scopes:** add `openid`, `email`, `profile` and `https://www.googleapis.com/auth/drive.appdata`.
5. **Clients / Credentials:** create an **OAuth client ID** of type **Web application**.
6. Under **Authorized JavaScript origins**, add your site address with no path and no final slash.
7. Copy the **Client ID** (it ends in `.apps.googleusercontent.com`). The site does not use the client secret. Do not put it in any file.

## 3. Add it to the site
Open `config.js` and paste the Client ID between the quotes:

```js
window.HS_CONFIG = {
  googleClientId: '1234567890-abc.apps.googleusercontent.com'
};
```

Upload `config.js` again.

## 4. Test, then open it to everyone
- While the app is in **Testing**, only the email addresses you add as **test users** can sign in.
- To let anyone sign in, **publish** the app. Google may ask for a home page, a privacy policy page and domain verification. Follow what the console asks for.

## Check that syncing works
1. Sign in on one device, mark a story completed and write a note.
2. Open **Reading profile** (your name, top right) and wait for "Saved to your Google Drive".
3. Sign in with the same email on a second device. Both items should appear.
4. Sign in with a different email. It should start empty.

## What is stored, for your privacy page
- One file, `hayat-reader.json`, in a hidden app folder in the reader's own Drive. It holds completed stories, bookmarks, highlights (with the highlighted words), notes and the last reading position.
- A copy stays in that browser. Name and email are kept there to show the profile.
- A temporary Google access token stays only for the browser tab. There is no server, and you do not receive readers' data.
- Google signs a reader out of this access after about an hour. The profile then shows **Reconnect to Google**. Changes made meanwhile stay on the device and are saved after reconnecting.
- On a shared computer, use **Sign out and remove from this device**.
