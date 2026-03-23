# Project Roadmap

## UX / UI Overhaul

### Modal System
- [ ] Establish a consistent modal design language (spacing, typography, header/footer patterns)
- [ ] **Profile modal** — rebuild layout; avatar upload UX, bio editing, clear save/cancel flow
- [ ] **Settings modal** — visual hierarchy, grouped controls, better toggle/select components
- [ ] **Game Management modal** — reduce visual noise; cleaner game card grid; separate list vs edit views
- [ ] **Game Edit modal** — simplify form layout; collapse memory watcher section by default; clearer save/delete affordances
- [ ] **Save State modal** — thumbnail previews, cleaner slot layout, keyboard nav
- [ ] **Load State modal** — consistent with Save State modal; confirm-to-overwrite pattern

### Onboarding
- [ ] First-run experience: detect new users with no games and guide them to import
- [ ] Empty states with contextual prompts (no games, no saves, no profile photo)
- [ ] Inline import hints in the Cartridges selector when library is empty
- [ ] Tooltips or short copy on memory watcher fields for new users

### General UI Polish
- [ ] Audit and normalise spacing, font sizes, and colour usage across all modals
- [ ] Consistent loading and error states (skeleton screens or inline loaders, not blank panels)
- [ ] Mobile modal UX — full-screen sheets on small viewports
- [ ] Keyboard accessibility audit (focus trapping, Escape to close, tab order)

---

## Testing

### Unit Tests
- [ ] Set up Vitest (or Jest) + React Testing Library
- [ ] Core utilities: `MemoryWatcher`, `saveLoad`, `blobUpload`, `usernames`
- [ ] Auth helpers: token validation, password hashing utilities
- [ ] API route handlers (mock MongoDB + NextAuth session)

### Integration Tests
- [ ] Save state create / update / delete flow
- [ ] Game import flow (blob upload → DB record)
- [ ] Profile update flow
- [ ] Notification read / delete flow

### E2E Tests
- [ ] Set up Playwright
- [ ] Critical paths: sign up → verify → log in
- [ ] Import a game → play → save state → load state
- [ ] Admin: create notification → user receives it

---

## Performance

### Emulator
- [ ] Audit frame-skip and canvas rendering for dropped frames
- [ ] Memory cleanup on game stop / ROM swap

### State & Data
- [ ] Auto-save with configurable interval (debounced, non-blocking)
- [ ] Save state compression before blob upload
- [ ] Cache game list client-side to avoid refetch on every modal open

---

## Game & Player Features

- [ ] Screenshot capture on save (hook into canvas)
- [ ] Quick-save / quick-load keybinding
- [ ] Custom control mapping (keyboard + gamepad)
- [ ] Speed control improvements
- [ ] Game-specific settings persistence (speed, palette per ROM)

---

## Mobile

- [ ] Full-screen immersive mode polish
- [ ] Touch control layout configurability
- [ ] PWA manifest + offline shell

---

## Infrastructure

- [ ] Error logging service (Sentry or similar)
- [ ] Rate limiting on auth routes
- [ ] Admin audit log (who did what, when)

---

## Stretch Goals

- [ ] Save state sharing (public link with expiry)
- [ ] Community features (view others' progress, team comparison)
- [ ] Advanced game analysis tools
