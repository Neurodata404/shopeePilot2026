# ShopeePilot 2026

Monorepo bootstrap for ShopeePilot MVP.

## Where we are right now
- ✅ Backend scaffold exists in `backend/` (Express + Prisma + MySQL schema + auth/accounts/creators/videos routes).
- ✅ Mobile scaffold exists in `mobile/` (Expo app that runs in Expo Go).
- ⚠️ Mobile screens are still starter-level (single scaffold screen), not full feature UI yet.

If your goal is **"I just want to see the app on my iPhone now"**, follow the exact checklist below.


## You are here (Expo Go already installed + ZIP downloaded)
If you already have **Expo Go on iPhone** and already downloaded the repo ZIP, run these exact commands on your Windows laptop:

```bat
cd /d %USERPROFILE%\Desktop\shopeePilot2026-main
dir
cd mobile
npm install
npm run start
```

Then on iPhone:
1. Open **Expo Go**
2. If you cannot find scanner inside Expo Go, open the **iPhone Camera app** and scan the QR directly (this opens Expo Go automatically).
3. Or in Expo Go Home, tap the small QR/scan icon in the top-right, then scan the terminal QR

If connection fails, run:
```bat
npm run start:tunnel
```

If that script is missing in your local copy, use:
```bat
npx expo start --tunnel
```

If your local ZIP says **Missing script: "start:tunnel"**, use either of these:
```bat
npx expo start --tunnel
```
or
```bat
npm run tunnel
```


## If your iPhone shows "project uses SDK 52"
This means the folder on your laptop is still an older ZIP copy.

Run this in Windows CMD inside your project `mobile` folder:

```bat
cd /d C:\Users\mrsai\Desktop\shopeePilot2026-main\mobile
type package.json | findstr "\"expo\""
```

- If it shows Expo `~52.x`, you are on old files.
- If it shows Expo `~54.x`, run:

```bat
npm install --force
npm run start
```

The app now includes a startup SDK checker (`npm run doctor:sdk`) that blocks wrong SDK versions with a clear message before QR launch.

## Emergency fix (works even if `npm run fix:sdk54` / `doctor:sdk` are missing)
If your local ZIP is older and npm says scripts are missing, run these commands directly in `mobile/`:

```bat
cd /d C:\Users\mrsai\Desktop\shopeePilot2026-main\mobile
npm pkg set dependencies.expo="~54.0.33"
npm pkg set dependencies.react-native="0.81.5"
npm pkg set dependencies.react="19.1.0"
npm pkg set dependencies.expo-status-bar="~3.0.9"
npm pkg set dependencies.expo-asset="~12.0.12"
npm install --force
npx expo start --tunnel
```

Then scan the new QR with iPhone Camera app.

## Step-by-step (exact, beginner-friendly)

### Step 1 — Download project to your laptop
1. Open your GitHub repo page.
2. Click **Code** → **Download ZIP**.
3. Extract ZIP to Desktop.
4. Confirm this folder exists:
   - `C:\Users\<you>\Desktop\shopeePilot2026-main`

### Step 2 — Open CMD in the project folder
In Windows CMD, run:
```bat
cd /d C:\Users\<you>\Desktop\shopeePilot2026-main
```
Then run:
```bat
dir
```
You should see `mobile` and `backend` in the list.

### Step 3 — Start Expo server
Still in CMD, run:
```bat
cd mobile
npm install
npm run start
```
Wait until a **QR code** appears.

### Step 4 — Open app in Expo Go (iPhone)
1. Open **Expo Go** on iPhone.
2. Best method on iOS: open the **Camera app** and scan the QR (Expo Go opens automatically).
3. Alternative: in Expo Go Home, tap the scan icon in the top-right.
4. App should open and show **ShopeePilot MVP** screen.

---

## If it does not work

### Problem A: No QR shown
- Wait 20–60 seconds.
- If still no QR, stop and restart:
```bat
Ctrl + C
npm run start
```

### Problem B: iPhone cannot connect
In Expo terminal, press `s` and switch to **Tunnel**.

Or run tunnel mode directly:
```bat
npm run start:tunnel
```

### Problem C: `cd mobile` says path not found
This means `mobile` is not inside your current folder. Do this exactly:

```bat
cd /d %USERPROFILE%\Desktop\shopeePilot2026-main
dir
```

- If you see a folder like `shopeePilot2026` or `shopeePilot2026-main` inside, go one level deeper:
```bat
cd shopeePilot2026
```
(or `cd shopeePilot2026-main`), then run `dir` again.

When you finally see `mobile` in the list, run:
```bat
cd mobile
npm install
npm run start
```

Quick auto-find command (if still stuck):
```bat
dir /s /b mobile
```
Use the returned path and `cd /d` into the parent folder that contains `mobile`.


### Problem D: Folder only shows `first commit`
If `dir` only shows one file named `first commit`, then you downloaded the wrong repo snapshot/branch.

Do this:
1. Open GitHub repo in browser.
2. Switch to the branch that contains project files (`backend/` + `mobile/`).
3. Click **Code → Download ZIP** again.
4. Extract to a **new** folder (for example `C:\Users\mrsai\Desktop\shopeePilot2026-app`).
5. In CMD run:
```bat
cd /d C:\Users\mrsai\Desktop\shopeePilot2026-app
dir
```
You must see folders like `backend` and `mobile`.

If you still only see `first commit`, use this fallback:
- On GitHub, open the commit that added `backend`/`mobile`, then click **Browse files** from that commit and download ZIP from there.


### Problem E: `expo-asset` cannot be found
You are very close — this is fixable in 2 minutes.

In `...\mobile` folder, run exactly:
```bat
del /f /q package-lock.json
rmdir /s /q node_modules
npm install
npm install expo-asset
npm run start
```

If PowerShell is used instead of CMD, use:
```powershell
Remove-Item package-lock.json -Force
Remove-Item node_modules -Recurse -Force
npm install
npm install expo-asset
npm run start
```

Then check quickly:
```bat
npm ls expo-asset
```
It should print a version like `expo-asset@12.x.x`.


### Problem F: `Project is incompatible with this version of Expo Go` (SDK mismatch)
If Expo Go on iPhone says it is SDK 54 but your project is SDK 52, update dependencies in `mobile/package.json` to SDK 54-compatible versions:

```json
{
  "expo": "~54.0.33",
  "expo-asset": "~12.0.12",
  "expo-status-bar": "~3.0.9",
  "react": "19.1.0",
  "react-native": "0.81.5"
}
```

Then run in `mobile/`:
```bat
npm install --force
npx expo start
```

Quick verify:
```bat
npm ls expo react react-native expo-asset expo-status-bar
```
You should see Expo `54.x`, React Native `0.81.5`, and no SDK incompatibility error in Expo Go.


### Problem G: Tunnel works but Expo warns `expected version: ~11.0.5 / 0.76.9`
That warning means your local folder is still on an SDK 52 dependency set.

Use this exact recovery in `mobile/`:
```bat
npm run fix:sdk54
npm install --force
npm run doctor:sdk
npm run start:tunnel
```

If `npm run fix:sdk54` is missing, your ZIP is older than this fix. Re-download the latest ZIP from the correct branch.

---

## Development progress (latest)
- ✅ Mobile now includes functional tabs for: Auth, Accounts, Creators, Videos, Review Queue, and Dashboard.
- ✅ Backend now supports automatic mock product matching on every imported video.
- ✅ Added review-queue endpoints, confirm/reanalyze actions, posting endpoint with daily-limit enforcement, and dashboard summary endpoint.
- ✅ Review Queue now supports one-click alternative product replacement via `GET /videos/:id/alternatives` + `POST /videos/:id/confirm-match` payload override.

Key new backend routes:
- `GET /dashboard/summary`
- `GET /videos/review-queue`
- `GET /videos/:id/alternatives`
- `POST /videos/:id/confirm-match`
- `POST /videos/:id/reanalyze`
- `POST /videos/:id/post`

## Current stack
- Mobile: React Native (Expo)
- Backend: Node.js + Express + Prisma
- Database: MySQL
- External integrations: mocked (TikTok downloader / Shopee search)

## Next development step (after Expo is visible)
Implement real mobile screens in this order:
1. Auth (register/login)
2. Shopee accounts + daily limits
3. Creator monitoring
4. Video intake by TikTok URL

## Optional backend run
If you also want API live locally:
```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```
Backend health: `http://localhost:4000/health`
