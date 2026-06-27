# Subdomain Development Setup

This guide explains how to test subdomain routing locally for **FriendlyDrop**.

## How It Works

The app runs as a **single Next.js server**. Middleware detects the incoming hostname and rewrites the request internally:

| Hostname | Zone | Serves |
|---|---|---|
| `app.friendlydrop.in` | Main storefront | `/` |
| `vendor.friendlydrop.in` | Vendor dashboard | `/vendor/*` |
| `admin.friendlydrop.in` | Admin dashboard | `/admin/*` |

In local dev the same pattern applies with `.localhost` instead of `.friendlydrop.in`.

---

## Step 1 — Edit Your Hosts File

### Windows
1. Open Notepad **as Administrator**
2. Open the file: `C:\Windows\System32\drivers\etc\hosts`
3. Add these lines at the bottom:

```
127.0.0.1  app.localhost
127.0.0.1  vendor.localhost
127.0.0.1  admin.localhost
```

4. Save and close.

### macOS / Linux
```bash
sudo nano /etc/hosts
```
Add:
```
127.0.0.1  app.localhost
127.0.0.1  vendor.localhost
127.0.0.1  admin.localhost
```

---

## Step 2 — Start the Dev Server

```bash
npm run dev
```

The dev server binds to `0.0.0.0:3000` so all hostnames resolve to it.

---

## Step 3 — Open in Browser

| URL | What You'll See |
|---|---|
| http://localhost:3000 | Main storefront |
| http://app.localhost:3000 | Main storefront |
| http://vendor.localhost:3000 | Vendor dashboard |
| http://admin.localhost:3000 | Admin dashboard |

---

## Production DNS

Point the following DNS A/CNAME records to your server:

| Record | Type | Value |
|---|---|---|
| `app.friendlydrop.in` | CNAME | your-server-ip or CDN |
| `vendor.friendlydrop.in` | CNAME | same server |
| `admin.friendlydrop.in` | CNAME | same server |

No separate builds or deploys — one `npm run build` / `npm start` serves all three zones.

---

## Auth Flow

- Unauthenticated users on `vendor.friendlydrop.in` or `admin.friendlydrop.in` are redirected to **`app.friendlydrop.in/login`** (or `localhost:3000/login` in dev).
- The `?redirect=` param carries the original path so the user lands back on the right page after signing in.
