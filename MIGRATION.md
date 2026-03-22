# AWS Amplify → Vercel Migration Plan

## Overview

Migrating from AWS Amplify (Cognito + AppSync + DynamoDB + S3) to a Vercel-hosted stack using free-tier services.

## Stack Mapping

| AWS Service | Role | Replacement |
|---|---|---|
| Cognito | Auth (signup, login, email verify, reset, groups) | NextAuth.js v5 (Auth.js) |
| AppSync GraphQL | Data API | Next.js Route Handlers |
| DynamoDB (via AppSync) | Database | MongoDB Atlas (free M0 tier) |
| S3 | File storage (ROMs, save states, avatars) | Vercel Blob |
| Cognito transactional email | Email verification / password reset | Resend (free: 3k/mo) |

All replacements have free tiers compatible with Vercel's hobby plan.

---

## What Changes

### 1. Auth
**Files affected:** `src/app/(auth)/login/page.tsx`, `signup/page.tsx`, `confirm-signup/page.tsx`, `reset-password/page.tsx`, `src/contexts/AuthContext.tsx`

Every Amplify auth call gets replaced:

| Amplify | Replacement |
|---|---|
| `signUp` | POST `/api/auth/register` → create user in MongoDB, send verify email via Resend |
| `confirmSignUp` | POST `/api/auth/verify` → validate token, mark user verified |
| `resendSignUpCode` | POST `/api/auth/resend-verification` |
| `signIn` | NextAuth `signIn('credentials', ...)` |
| `signOut` | NextAuth `signOut()` |
| `getCurrentUser` | NextAuth `useSession()` / `getServerSession()` |
| `resetPassword` | POST `/api/auth/forgot-password` → email reset token via Resend |
| `confirmResetPassword` | POST `/api/auth/reset-password` → validate token, update hash |

`AuthContext` rewired to wrap NextAuth's `useSession`. The `admin` boolean moves from Cognito user groups to the MongoDB Profile document (already modeled this way in TypeScript types).

Email verification and password reset tokens stored as short-lived hashed tokens in MongoDB (e.g. `verificationToken` + `verificationTokenExpiry` fields on User model).

### 2. Data API
**Files affected:** ~15 files using `generateClient` from `aws-amplify/api`

Every `client.models.X.list/get/create/update/delete()` call replaced with `fetch()` to Next.js route handlers:

```
app/api/games/route.ts              GET (list), POST (create)
app/api/games/[id]/route.ts         GET (one), PUT (update), DELETE
app/api/save-states/route.ts        GET (list), POST (create)
app/api/save-states/[id]/route.ts   GET (one), PUT (update), DELETE
app/api/profiles/route.ts           GET (list), POST (create)
app/api/profiles/[id]/route.ts      GET (one), PUT (update), DELETE
app/api/notifications/route.ts      GET (list), POST (create)
app/api/notifications/[id]/route.ts PUT (mark read), DELETE
```

Each route handler:
1. Calls `getServerSession()` to verify auth
2. Checks ownership / admin status before any write operation
3. Talks to MongoDB via Mongoose

The current AppSync owner-based authorization rules become explicit checks inside each handler.

### 3. Storage
**Files affected:** ~8 files using `uploadData`, `getUrl`, `downloadData`, `remove` from `aws-amplify/storage`

| Amplify | Replacement |
|---|---|
| `uploadData({ path, data })` | `put(pathname, data)` from `@vercel/blob` |
| `getUrl({ path })` | Blob URLs are permanent — store the URL directly at upload time |
| `downloadData({ path })` | `fetch(blobUrl)` directly |
| `remove({ path })` | `del(blobUrl)` from `@vercel/blob` |

Path structure maps directly to Vercel Blob pathnames:
- ROMs: `games/{userId}/{gameId}/{filename}.gb`
- Save states: `save-states/{userId}/{gameId}/{saveStateId}/{title}.sav`
- Screenshots: `save-states/{userId}/{gameId}/{saveStateId}/screenshot.{ext}`
- Avatars: `avatars/{userId}/{timestamp}-{filename}`

Key difference: Vercel Blob URLs are **permanent public URLs** (no signed URL expiry), which removes the need to call `getUrl` every render. Store the blob URL directly in MongoDB at upload time.

Free tier: 1GB storage / 1GB transfer per month. ROM files are 1–4MB each. Sufficient for personal use; upgrade to paid if needed, or swap to Cloudflare R2 (zero egress cost) later.

### 4. Config Cleanup
**Files affected:** `src/app/layout.tsx`, `src/app/(auth)/layout.tsx`, `src/app/play/layout.tsx`, `src/utils/saveLoad.js`

- Remove all `import outputs from '../../../amplify_outputs.json'` and `Amplify.configure(outputs)` calls
- Delete the `amplify/` directory entirely
- Delete `amplify_outputs.json`
- Replace with `.env.local`:

```
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000

MONGODB_URI=mongodb+srv://...

BLOB_READ_WRITE_TOKEN=...

RESEND_API_KEY=...
RESEND_FROM=noreply@yourdomain.com
```

- Remove from `package.json`: `aws-amplify`, `@aws-amplify/backend`, `@aws-amplify/backend-cli`, `aws-cdk`, `aws-cdk-lib`, `@aws-amplify/data-construct`, `@aws-amplify/graphql-api-construct` (eliminates the remaining 29 npm vulnerabilities)

---

## What Stays the Same

- All UI components, CSS, and styled-components
- The emulator core and game logic
- TypeScript model types (minor field adjustments only)
- Next.js App Router structure and route groups
- View transitions and all visual work

---

## New Dependencies

```
next-auth          # v5 (Auth.js) — session management + credentials provider
mongoose           # MongoDB ODM
@vercel/blob       # File storage
resend             # Transactional email
bcryptjs           # Password hashing
```

---

## MongoDB Schemas

Four collections mirroring the current Amplify models:

### User
```
_id, email, passwordHash, emailVerified (bool),
verificationToken, verificationTokenExpiry,
resetToken, resetTokenExpiry,
createdAt, updatedAt
```

### Profile
```
_id, userId (ref User), username, email, bio,
avatar (blob URL), admin (bool),
createdAt, updatedAt
```

### Game
```
_id, userId, title, filePath (blob URL), img (URL),
metadata { description, series, generation, releaseDate },
createdAt, updatedAt
```

### SaveState
```
_id, userId, gameId (ref Game), title, description,
filePath (blob URL), img (blob URL),
createdAt, updatedAt
```

### Notification
```
_id, userId, sender, type (FRIEND_REQUEST | SYSTEM | INFO),
title, body, readAt,
createdAt, updatedAt
```

---

## Recommended Order of Attack

- [x] **1. MongoDB connection + Mongoose models** — `src/lib/db.ts`, `src/models/*.ts`
- [x] **2. NextAuth setup** — `app/api/auth/[...nextauth]/route.ts`, credentials provider, session config
- [x] **3. Auth API routes** — register, verify, resend, forgot-password, reset-password
- [x] **4. Auth pages** — rewire signup/login/confirm/reset to new API
- [x] **5. AuthContext** — swap `getCurrentUser` → `useSession`
- [x] **6. Data API routes** — one model at a time: Game → SaveState → Profile → Notification
- [x] **7. Replace `generateClient` calls** — swap component by component to `fetch()`
- [x] **8. Storage** — swap `uploadData`/`getUrl`/`remove` to Vercel Blob
- [x] **9. Config cleanup** — remove Amplify imports, delete `amplify/` directory, update `package.json`
- [x] **10. Deploy to Vercel** — set env vars, verify all flows end-to-end

**Step 9 — Config cleanup**
- Removed from `package.json` dependencies: `aws-amplify`, `@aws-sdk/client-cognito-identity-provider`
- Removed from `package.json` devDependencies: `@aws-amplify/backend`, `@aws-amplify/backend-cli`, `aws-cdk`, `aws-cdk-lib`, `constructs`, `esbuild`
- Removed entire `overrides` block (was only needed to patch Amplify/CDK transitive vulns)
- Deleted `amplify/` directory and `amplify_outputs.json`
- Result: **0 npm vulnerabilities** (down from 84)

---

## Progress Notes

### Steps 1–7 complete as of 2026-03-21

**Step 1 — MongoDB + Models**
- `src/lib/db.ts` — singleton Mongoose connection with hot-reload guard
- `src/models/` — User, Profile, Game, SaveState, Notification (all with `toJSON: { virtuals: true }` so `id` virtual serializes correctly)
- Notification `userId` is `String` (not ObjectId ref) to support `'BROADCAST'` for system-wide messages

**Step 2 — NextAuth**
- `src/auth.ts` — credentials provider, JWT strategy, session callbacks inject `id` and `admin`
- `src/types/next-auth.d.ts` — augments `Session.user` and `JWT` with `id: string` and `admin: boolean`
- `src/app/api/auth/[...nextauth]/route.ts` — exports handlers

**Step 3 — Auth API routes**
- `POST /api/auth/register` — bcrypt hash, 6-digit verification code, creates User + Profile, emails via Resend
- `POST /api/auth/verify` — validates code + expiry, marks `emailVerified: true`
- `POST /api/auth/resend-verification` — regenerates code, user-enumeration safe
- `POST /api/auth/forgot-password` — 64-char hex reset token, 1-hour expiry, user-enumeration safe
- `POST /api/auth/reset-password` — validates token, bcrypt hashes new password

**Step 4 — Auth pages**
- signup, confirm-signup, reset-password: fully rewired to new API routes
- login: uses `signIn('credentials', ...)` from next-auth/react; shows `?verified=true` and `?reset=success` status messages

**Step 5 — AuthContext**
- Rewrapped with `SessionProvider`; `AppUser` interface maps `session.user.id` → `userId` for backward compat

**Step 6 — Data API routes**
- `GET/POST /api/games` — list (own or `?all=true` for admin), create
- `GET/PUT/DELETE /api/games/[id]` — ownership-gated, admin can override
- `GET/POST /api/save-states` — list (own, optional `?gameId=`), create
- `GET/PUT/DELETE /api/save-states/[id]`
- `GET/PATCH /api/profiles` — own profile; `?userId=` for admin lookup; `?all=true` lists all (admin)
- `GET/PUT/DELETE /api/profiles/[id]` — PUT/DELETE admin-only
- `GET/POST /api/notifications` — own + BROADCAST; `?unread=true` filter; `?all=true` admin; POST admin-only
- `PUT/DELETE /api/notifications/[id]` — mark read / delete

**Step 7 — Replace `generateClient`**
- All 14 files migrated; zero `aws-amplify/*` imports remain in `src/`
- `uploadData` / `remove` calls stubbed with clear step-8 TODO errors (ProfileModal avatar upload, GameManagement cover image, ImportGame ROM upload, useSaveState)
- `fetchUserSaveStates` now calls real `/api/save-states` endpoint
- `response.body.blob()` fixed to `response.blob()` in play/page.tsx
- Frontend model types updated: `owner` → `userId` throughout
- Admin page reads `admin` flag directly from session instead of fetching profile

**Step 8 — Storage (Vercel Blob)**
- `src/app/api/blob/upload/route.ts` — POST handler; enforces path contains `session.user.id`; calls `put()` from `@vercel/blob`
- `src/app/api/blob/route.ts` — DELETE handler; enforces URL contains `session.user.id` (or admin)
- `src/utils/blobUpload.ts` — client helpers `uploadBlob(file, path)` and `deleteBlob(url)` routing through those API handlers
- `ProfileModal` — avatar upload/remove fully wired to `uploadBlob`/`deleteBlob`
- `GameManagement/index.tsx` — cover image upload on edit wired to `uploadBlob`
- `ImportGame.tsx` — ROM + cover image upload wired; preset cover URLs stored directly; progress steps at 10/60/90/100%
- `useSaveState.ts` — save blob + screenshot upload wired; POST vs PUT path selected by `isUpdate`
- `LoadStateModal.tsx` — `handleDeleteConfirmed` now calls `deleteBlob` on both `filePath` and `img` after API delete
- `saveLoad.js` — removed dead stubs (`saveGameToS3`, `saveGameStateToDDB`, `saveSRAM`, `uploadImageToS3`); removed stale warning comment from `loadInGameFile`
