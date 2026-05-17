---
name: feedback_blob_paths
description: Blob storage path conventions and security check pattern for this project
metadata:
  type: feedback
---

All Vercel Blob paths use sanitized email + human-readable slugs via `src/utils/blobPaths.ts`:
- Save files: `saves/{email}/{game-slug}/{save-slug}-{id[0..8]}/save.sav`
- Games: `games/{email}/{game-slug}-{id[0..8]}/{filename}`

**Why:** opaque userId/UUID paths made storage impossible to reason about in the Vercel dashboard.

**How to apply:**
- Always import `saveBlobPath` or `gameBlobDir` from `src/utils/blobPaths.ts` — never construct blob paths inline.
- Both `/api/blob/upload` and `/api/blob/route.ts` (DELETE) security checks accept either `session.user.id` OR the sanitized email slug — update both if adding new blob routes.
- All blob writes use `addRandomSuffix: true` + delete-old pattern: upload new → `updateOne($set)` → `del(oldUrl)`. Never `allowOverwrite: true` for save files.
- Use `SaveState.updateOne({ _id }, { $set: { filePath } })` not `saveState.save()` for filePath updates — avoids Mongoose document-cache issues under HMR. [[feedback_mongoose_updateone]]
