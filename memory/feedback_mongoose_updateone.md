---
name: feedback_mongoose_updateone
description: Use updateOne/$set not instance .save() for critical field updates in API routes
metadata:
  type: feedback
---

Use `Model.updateOne({ _id }, { $set: { field } })` instead of `doc.field = x; await doc.save()` when committing critical fields like `filePath` in API routes.

**Why:** The connect route had a comment explaining this was needed to bypass Mongoose model-cache issues during Next.js HMR. The port and extract routes used `.save()` and intermittently failed to commit the new blob URL, leaving the DB pointing at a deleted blob — causing silent 404s on page refresh.

**How to apply:** Any time an API route needs to update a single field on a document it just fetched (especially `filePath`, `status`, `connected`), prefer `updateOne/$set`. Reserve `.save()` for multi-field updates where the full document state is being set intentionally. [[feedback_blob_paths]]
