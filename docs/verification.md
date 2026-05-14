# Verification Guide

This document describes all steps to verify the project is working correctly.

---

## 1. Environment Requirements

| Requirement | Minimum | Verified With |
|-------------|---------|---------------|
| Node.js | >= 18.0 | v25.2.1 |
| npm | >= 9.0 | 11.6.2 |
| Git | >= 2.30 | System Git |
| macOS | 10.15+ | macOS 15 (Sequoia) |
| Windows | 10+ | Windows 10/11 x64 |

---

## 2. Build Verification

### TypeScript Check

```bash
npm run typecheck
```
**Expected**: No output (zero errors).

### Full Build

```bash
npm run build
```
**Expected output**:
```
dist/main/index.cjs      ~46 KB
dist/main/preload.cjs     ~1 KB
dist/renderer/index.html  
dist/renderer/assets/*.js ~200 KB
dist/renderer/assets/*.css ~15 KB
```

---

## 3. Test Verification

### Run All Tests

```bash
npm test
```

**Expected**:
```
Test Files  7 passed (7)
     Tests  53 passed (53)
```

### Tests by Suite

| File | Tests | Verifies |
|------|-------|----------|
| `tests/unit/GitService.test.ts` | 13 | Status/log/diff parsers, GitError |
| `tests/unit/CommitGraph.test.ts` | 7 | Graph layout algorithm correctness |
| `tests/unit/Stores.test.ts` | 5 | Theme toggle + persistence |
| `tests/unit/components/BookmarkWindow.test.tsx` | 5 | Empty state, list render, click handlers |
| `tests/unit/components/CommitPanel.test.tsx` | 7 | Textarea, disable logic, commit trigger |
| `tests/unit/components/FileItem.test.tsx` | 6 | Status colors, actions, selection |
| `tests/integration/git.integration.test.ts` | 8 | Real Git: init→commit→branch→stash→tag→cherry-pick |

### Run Single Suite

```bash
npx vitest run tests/unit/GitService.test.ts
npx vitest run tests/integration/git.integration.test.ts
```

---

## 4. Runtime Verification

### Development Mode

```bash
npm run dev
```

**Expected behavior**:
1. Terminal shows `VITE v6.x.x  ready in XXX ms`
2. Terminal shows Vite local URL `http://localhost:5173/`
3. An Electron window appears titled "SourceTree Clone"
4. Window shows the bookmark list (empty initially)
5. Click "Add" → browse to a Git repo → click "Open" → repo appears in list
6. Double-click repo → opens repo view showing file status / branch list

### Verify IPC Communication

In the running app, check the DevTools console (Cmd+Opt+I on macOS):
- No red errors
- Network tab shows `localhost:5173` connected
- Application tab → Local Storage shows `sourcetree-theme` key

### Verify Data Persistence

After closing the app, check the data file exists:

**macOS:**
```bash
cat ~/Library/Application\ Support/sourcetree-clone/sourcetree.json
```

**Windows:**
```powershell
type %APPDATA%/sourcetree-clone/sourcetree.json
```

**Expected**: JSON file with `repositories` array containing added repos.

---

## 5. Package Verification

### macOS

```bash
npm run package:mac
```

**Expected**: `release/SourceTree Clone-*.dmg` is created.

1. Open the `.dmg`
2. Drag app to `/Applications`
3. Launch from Applications
4. App opens with bookmark window

### Windows

```powershell
npm run package:win
```

**Expected**: `release/SourceTree Clone Setup-*.exe` is created.

1. Run the installer
2. Choose install directory
3. Launch from Start Menu or Desktop shortcut
4. App opens with bookmark window

---

## 6. Manual Feature Checklist

Use this checklist when verifying a new build:

### Repository Operations
- [ ] Clone a repo (HTTPS URL) — succeeds, repo opens
- [ ] Clone a repo (SSH URL) — succeeds if key configured
- [ ] Add existing repo — appears in bookmark list
- [ ] Remove repo from bookmarks — removed
- [ ] Double-click bookmark — opens repo window

### File Operations
- [ ] Modified files show in "Unstaged" with yellow "M"
- [ ] New files show as untracked "?"
- [ ] Click Stage button → file moves to "Staged"
- [ ] Click Unstage → file moves back to "Unstaged"
- [ ] Stage All / Unstage All buttons work

### Commit
- [ ] Enter message → Commit button enables
- [ ] Click Commit → file status refreshes, commit history updates
- [ ] Commit button disabled with no staged files
- [ ] Commit button disabled with empty message

### Branch Operations
- [ ] Sidebar shows all branches with current highlighted
- [ ] Click branch → switches to that branch
- [ ] "Branch" button → create dialog appears
- [ ] Create branch → appears in sidebar
- [ ] "Merge" button → merge dialog with branch selector

### Remote Operations
- [ ] Pull button → fetches and merges
- [ ] Push button → pushes commits
- [ ] Status shows ahead/behind counts

### Theme
- [ ] Theme toggle cycles light/dark
- [ ] Dark mode persists across restarts
- [ ] Diff colors adjust for dark mode

### Auth & SSH
- [ ] Settings → Accounts → Click GitHub → opens browser
- [ ] After OAuth → account appears in list
- [ ] SSH tab → shows existing keys
- [ ] Generate key → new key appears
- [ ] Copy public key → copies to clipboard

---

## 7. Known Limitations

| Issue | Severity | Notes |
|-------|----------|-------|
| No i18n support | Low | All strings hardcoded in English |
| No interactive rebase UI | Low | Core rebase works via GitService |
| No side-by-side diff | Low | Unified diff only |
| No file watcher | Low | Status refreshes on 5s interval, not real-time |
| Multiline commit body parse bug | Low | `parseLog()` splits by `\n`, body newlines break parsing |
| No conflict resolution UI | Medium | Conflicts detected (status shows 'U'), but no inline resolution tool |
| OAuth requires registered app | Medium | Default client IDs are placeholders; must register your own OAuth apps |
| No menu bar | Low | Right-click context menus only, no native menu bar |

---

## 8. Quick Debugging

### App won't start
```bash
# Check electron binary installed
npx electron --version

# Rebuild if needed
npm run build
```

### White screen in Electron
```bash
# Check Vite is running
curl http://localhost:5173

# Check DevTools console for errors (F12 or Cmd+Opt+I)
```

### Native module errors
The project no longer uses native modules (better-sqlite3 was replaced with JSON storage).
If you see native module errors, delete node_modules and reinstall:
```bash
rm -rf node_modules && npm install
```
