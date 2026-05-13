# SourceTree Clone - Product Specification

**Document Version**: 1.0  
**Last Updated**: 2026-05-10  
**Status**: Draft

---

## 1. Project Overview

### 1.1 Purpose
Build a fully-featured Git GUI client that replicates SourceTree's functionality, targeting macOS and Windows platforms.

### 1.2 Tech Stack
- **Framework**: Electron (v28+)
- **Language**: TypeScript (v5+)
- **UI Framework**: React (v18+)
- **State Management**: Zustand
- **Git Integration**: simple-git + direct child_process invocation
- **Database**: SQLite (better-sqlite3)
- **Build Tool**: Vite + electron-builder

### 1.3 Scope
- **Git only** (no Mercurial support)
- **Target Platforms**: macOS (10.15+) + Windows (10+)
- **Distributed as**: Native installers (.dmg, .exe)

---

## 2. Functional Requirements

### Priority Legend
- **P0**: Must-have for MVP (Minimum Viable Product)
- **P1**: High priority, first major update after MVP
- **P2**: Nice-to-have, future iterations

---

### 2.1 Repository Management (P0)

#### 2.1.1 Clone Repository
**Priority**: P0

**User Flow**:
1. Click "Clone" button (toolbar or welcome screen)
2. Enter repository URL (HTTPS or SSH)
3. Optionally enter credentials (username/password or select SSH key)
4. Select destination path (browse or type)
5. Click "Clone"
6. Progress indicator shows download status
7. Repository opens in main window upon completion

**Acceptance Criteria**:
- Support HTTPS and SSH protocols
- Support authentication (username/password, SSH keys, OAuth tokens)
- Show clone progress (percentage, speed, current object)
- Handle errors gracefully (network failures, auth errors, invalid URLs)
- Auto-detect repository name from URL
- Option to create subdirectory

**Edge Cases**:
- Destination path already exists
- Insufficient disk space
- URL is not a Git repository
- Clone with submodules (--recursive)
- Shallow clone (--depth)

---

#### 2.1.2 Initialize Repository
**Priority**: P0

**User Flow**:
1. Click "Init" button
2. Select/create destination directory
3. Optionally configure:
   - Initial branch name (main/master)
   - Git ignore template
   - License template
4. Click "Create"
5. Empty repository opens with initial commit prompt

**Acceptance Criteria**:
- Create .git folder structure
- Generate initial .gitignore (optional)
- Generate LICENSE file (optional)
- Prompt for initial commit

---

#### 2.1.3 Add Existing Repository
**Priority**: P0

**User Flow**:
1. Click "Add" button
2. Browse to existing repository directory
3. Repository opens in main window

**Acceptance Criteria**:
- Detect if directory contains valid .git folder
- Detect if directory is a submodule
- Show error if not a Git repository
- Add to bookmarks list automatically

---

#### 2.1.4 Bookmark Management
**Priority**: P0

**User Flow**:
1. Bookmarks window shows all repositories
2. Double-click to open repository
3. Right-click for context menu:
   - Open
   - Remove from bookmarks
   - Show in Explorer/Finder
   - Delete from disk
   - Copy path
4. Drag to reorder
5. Click column headers to sort

**Acceptance Criteria**:
- Display repo name, path, last accessed time
- Show repo icon/logo (GitHub/Bitbucket/GitLab)
- Show branch count indicator
- Show working directory changes count
- Persist bookmarks across app restarts
- Search/filter bookmarks

---

### 2.2 File Status & Staging (P0)

#### 2.2.1 File Status View
**Priority**: P0

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ [Unstaged Files (5)]          [Staged Files (2)]        │
├─────────────────────────────────────────────────────────┤
│ ▼ Unstaged Files                                Actions │
│   M  src/app.ts                              [Discard]  │
│   M  src/utils.ts                                       │
│   A  src/newfile.ts                                     │
│   D  src/oldfile.ts                                     │
│   ?  untracked.txt                                      │
│                                                         │
│ ▼ Staged Files                                          │
│   M  README.md                                          │
│   M  package.json                                       │
└─────────────────────────────────────────────────────────┘
```

**User Flow**:
1. View list of changed files
2. See file status indicator:
   - M: Modified
   - A: Added
   - D: Deleted
   - R: Renamed
   - C: Copied
   - U: Unmerged (conflict)
   - ?: Untracked
   - !: Ignored
3. Click file to see diff
4. Right-click for actions

**Actions per file**:
- Stage / Unstage
- Discard changes (with confirmation)
- Delete file
- Ignore file (add to .gitignore)
- Ignore pattern (add wildcard to .gitignore)
- Stop tracking
- Open in external editor
- Open in Explorer/Finder
- Copy path

**Acceptance Criteria**:
- Auto-refresh on file system changes (file watcher)
- Group files by directory (tree view toggle)
- Sort by name, status, or modification time
- Multi-select for batch operations
- Show diff stats (+lines/-lines)
- File size indicator

---

#### 2.2.2 Staging Operations
**Priority**: P0

**Stage Options**:
1. **Stage File**: Add entire file to staging area
2. **Stage Hunk**: Add specific hunk (continuous block of changes)
3. **Stage Line**: Add specific line(s)

**User Flow - Stage Hunk**:
1. View file diff
2. See hunks separated by `@@ ... @@` markers
3. Hover over hunk to see "Stage hunk" button
4. Click to stage that hunk only

**User Flow - Stage Line**:
1. View file diff
2. Click individual lines to select
3. Selected lines highlight
4. Click "Stage selected lines" button

**Acceptance Criteria**:
- Visual indicator for staged vs unstaged portions
- Undo staging operation
- Stage hunks with context lines
- Handle file renames during staging

---

### 2.3 Commits (P0)

#### 2.3.1 Commit Panel
**Priority**: P0

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ Commit Message:                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Add user authentication feature                      │ │
│ │                                                      │ │
│ │ - Implement JWT token validation                     │ │
│ │ - Add login/logout endpoints                         │ │
│ │ - Update user model                                  │ │
│ │                                                      │ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [Amend] [Sign-off] [Sign commit (GPG)]              │
│ │                                                      │ │
│ │                    [Commit (2 files)]               │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**User Flow**:
1. Stage desired files/hunks/lines
2. Enter commit message
   - First line: summary (50 chars recommended)
   - Blank line separator
   - Body: detailed description
3. Configure commit options
4. Click "Commit" button

**Commit Options**:
- **Amend**: Amend previous commit (only if HEAD is local)
- **Sign-off**: Add Signed-off-by line
- **Sign commit**: GPG sign the commit
- **Commit staged only**: Only commit indexed changes
- **Commit all unstaged**: Auto-stage all changes then commit

**Acceptance Criteria**:
- Warn if committing with unstaged changes
- Show character count (soft limit 50/72)
- Line wrapping in message body
- Markdown preview (optional)
- Template support (prepare-commit-msg hook)
- Commit template dropdown
- Recent messages history
- Emoji/shortlink support

---

#### 2.3.2 Commit History View
**Priority**: P0

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ [Search...] [Branch: main ▼] [Since: 1 month ▼]        │
├─────────────────────────────────────────────────────────┤
│ o  a1b2c3d  2026-05-10  John Doe                        │
│ │           Add user authentication                     │
│ │                                                        │
│ o  e4f5g6h  2026-05-09  Jane Smith                      │
│ │           Refactor database module                    │
│ │                                                        │
│ o  i7j8k9l  2026-05-08  Bob Wilson                      │
│ │           Fix memory leak in parser                   │
│ │                                                        │
│ M─┐                                                      │
│ │ o  m0n1o2p  2026-05-07  Alice Brown                   │
│ │ │         Add feature flags                           │
│ │ │                                                      │
│ o─┘ q3r4s5t  2026-05-06  John Doe                       │
│             Merge branch 'feature/flags'                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**User Flow**:
1. Browse commits in reverse chronological order
2. Click commit to see details
3. Right-click commit for actions:
   - Checkout this commit
   - Create branch from this commit
   - Create tag at this commit
   - Reset to this commit
   - Revert this commit
   - Cherry-pick this commit
   - Copy commit hash
   - Copy commit message

**Acceptance Criteria**:
- Show commit hash, author, date, message
- Show branch labels and tag labels
- Show merge commits with proper graph lines
- Lazy load commits (infinite scroll)
- Filter commits by:
  - Search term (message, hash, author)
  - Date range
  - Author
  - File path
- Compact mode (single line per commit)

---

### 2.4 Branches (P0)

#### 2.4.1 Branch Management
**Priority**: P0

**Sidebar Layout**:
```
┌────────────────┐
│ BRANCHES       │
├────────────────┤
│ ✓ main        │ ← Current branch
│   develop     │
│   feature/auth│
│   bugfix/123  │
│   [...]       │ ← Show all button
└────────────────┘
```

**User Flow - Create Branch**:
1. Click "Branch" button in toolbar
2. Enter branch name
3. Select starting point:
   - Current HEAD
   - Specific commit
   - Specific tag
   - Remote branch
4. Choose checkout option:
   - Checkout immediately (default)
   - Create only (don't checkout)
5. Click "Create Branch"

**User Flow - Switch Branch**:
1. Double-click branch in sidebar
2. Or right-click → "Checkout"
3. If uncommitted changes exist:
   - Prompt to stash or commit first
   - Show conflict warning if needed

**User Flow - Delete Branch**:
1. Right-click branch → "Delete"
2. If branch has unmerged changes:
   - Warning with force delete option
3. If branch exists on remote:
   - Option to delete remote tracking branch too

**User Flow - Rename Branch**:
1. Right-click branch → "Rename"
2. Enter new name
3. Update remote if exists

**Acceptance Criteria**:
- Branch name validation (no spaces, special chars)
- Show remote tracking status (ahead/behind)
- Multi-select for batch delete
- Drag to reorder (pinned branches)
- Collapse/expand branches by prefix (feature/, bugfix/)

---

#### 2.4.2 Branch Visualization Graph
**Priority**: P0

**Requirements**:
- Render commit graph with branch topology
- Color code branches
- Show merge points with proper connector lines
- Show branch labels at commit tips
- Animate on branch switch
- Support compact/light display modes

**Technical Approach**:
- Use dagre or elk.js for graph layout
- Render with Canvas or SVG
- Virtual scrolling for performance
- Branch color assignment algorithm

---

### 2.5 Push & Pull (P0)

#### 2.5.1 Push
**Priority**: P0

**User Flow**:
1. Click "Push" button in toolbar
2. Push dialog appears:
   ```
   ┌────────────────────────────────────────┐
   │ Push to Remote                          │
   ├────────────────────────────────────────┤
   │ Remote:   [origin          ▼]          │
   │ Branch:   [main            ▼]          │
   │                                          │
   │ ☑ Push to origin/main                   │
   │ ☐ Push all branches                     │
   │ ☐ Push tags                              │
   │                                          │
   │ Advanced:                                │
   │ ☐ Force push                            │
   │ ☑ Force with lease                      │
   │                                          │
   │            [Cancel]  [Push]             │
   └────────────────────────────────────────┘
   ```
3. Select remote and branch
4. Configure push options
5. Click "Push"
6. Progress indicator shows upload status
7. Success/error notification

**Acceptance Criteria**:
- Show ahead count (commits to push)
- Warn on force push (destructive)
- Support force-with-lease by default
- Push multiple branches simultaneously
- Push all tags or specific tags
- Track refspec configuration
- Handle authentication for push

**Edge Cases**:
- Remote rejected (non-fast-forward)
- Remote doesn't exist
- No upstream configured
- Diverged branches (force vs pull)

---

#### 2.5.2 Pull
**Priority**: P0

**User Flow**:
1. Click "Pull" button in toolbar
2. Pull dialog appears:
   ```
   ┌────────────────────────────────────────┐
   │ Pull from Remote                        │
   ├────────────────────────────────────────┤
   │ Remote:   [origin          ▼]          │
   │ Branch:   [main            ▼]          │
   │                                          │
   │ Merge options:                          │
   │ ○ Merge (create merge commit)          │
   │ ○ Rebase (rebase onto fetched)         │
   │ ○ Fast-forward only                    │
   │                                          │
   │ ☑ Fetch all remotes                    │
   │                                          │
   │            [Cancel]  [Pull]            │
   └────────────────────────────────────────┘
   ```
3. Select merge strategy
4. Click "Pull"
5. Handle conflicts if any

**Acceptance Criteria**:
- Show behind count (commits to pull)
- Support merge, rebase, and fast-forward
- Fetch without merge (fetch only)
- Prune deleted remote branches
- Fetch all remotes
- Show diff summary of incoming changes

---

#### 2.5.3 Fetch
**Priority**: P0

**User Flow**:
1. Click "Fetch" button (dropdown from Pull)
2. Fetch all remotes or specific remote
3. Progress indicator
4. Update branch status indicators (ahead/behind)

**Acceptance Criteria**:
- Fetch without merging
- Prune option
- Fetch tags
- Fetch submodules

---

### 2.6 Merge & Rebase (P1)

#### 2.6.1 Merge Branches
**Priority**: P1

**User Flow**:
1. Click "Merge" button in toolbar
2. Select branch to merge into current
3. Configure merge options:
   - No fast-forward (create merge commit)
   - Fast-forward only
   - Squash commits
4. Click "Merge"
5. If conflicts:
   - Show conflict files list
   - Open merge tool
   - Resolve conflicts
   - Stage resolution
   - Commit merge

**Conflict Resolution UI**:
```
┌─────────────────────────────────────────────────────┐
│ Merge Conflicts                                      │
├─────────────────────────────────────────────────────┤
│ Files with conflicts:                               │
│                                                      │
│ UU src/app.ts                                       │
│ UU src/config.ts                                    │
│                                                      │
│ Actions:                                             │
│ • Resolve using mine                                │
│ • Resolve using theirs                              │
│ • Open in merge tool                                │
│ • Mark as resolved                                  │
└─────────────────────────────────────────────────────┘
```

**Acceptance Criteria**:
- Support fast-forward and non-fast-forward
- Squash merge option
- Show merge base
- Conflict markers visualizer
- Three-way merge tool integration
- Abort merge option

---

#### 2.6.2 Rebase
**Priority**: P1

**User Flow - Standard Rebase**:
1. Click "Rebase" button
2. Select upstream branch
3. Click "Rebase"
4. If conflicts:
   - Pause rebase
   - Show conflict files
   - Resolve conflicts
   - Continue/abort rebase

**User Flow - Interactive Rebase**:
1. Right-click commit → "Interactive Rebase from here"
2. Rebase editor appears:
   ```
   ┌────────────────────────────────────────────────┐
   │ Interactive Rebase                              │
   ├────────────────────────────────────────────────┤
   │ [pick   ] a1b2c3d Add login page               │
   │ [squash ] e4f5g6h Fix login button             │
   │ [reword ] i7j8k9l Update README                │
   │ [edit   ] m0n1o2p Add tests                    │
   │ [drop   ] q3r4s5t Debug code                   │
   │                                                  │
   │ Legend:                                          │
   │ pick   - Use commit                             │
   │ reword - Edit commit message                    │
   │ edit   - Pause for amending                     │
   │ squash - Meld into previous commit              │
   │ drop   - Remove commit                          │
   │                                                  │
   │          [Cancel]  [Start Rebase]              │
   └────────────────────────────────────────────────┘
   ```
3. Configure actions per commit
4. Click "Start Rebase"
5. Walk through each step

**Acceptance Criteria**:
- Support all rebase actions (pick, reword, edit, squash, fixup, drop)
- Reorder commits via drag-drop
- Combine consecutive commits (squash)
- Edit commit message during rebase
- Pause on edit, allow amending
- Continue/abort/skip during rebase

---

### 2.7 Stash (P1)

#### 2.7.1 Stash Operations
**Priority**: P1

**User Flow - Create Stash**:
1. Click "Stash" button
2. Enter stash message (optional)
3. Configure stash options:
   - Include untracked files
   - Keep index (don't stash staged changes)
4. Click "Stash"

**User Flow - Apply Stash**:
1. Open Stash sidebar
2. Right-click stash → "Apply"
3. Choose apply option:
   - Apply and keep stash
   - Apply and drop stash
   - Apply with index reinstated

**User Flow - Pop Stash**:
1. Right-click stash → "Pop"
2. Apply and drop stash in one operation

**Stash List UI**:
```
┌────────────────────────────────────────┐
│ STASHES                                 │
├────────────────────────────────────────┤
│ 📦 stash@{0}                            │
│    WIP on main: Add feature           │
│    2026-05-10 14:30                   │
│                                         │
│ 📦 stash@{1}                            │
│    WIP on develop: Fix bug            │
│    2026-05-09 10:15                   │
└────────────────────────────────────────┘
```

**Acceptance Criteria**:
- Multiple stashes support
- Stash message editing
- Show stash diff preview
- Drop stash (with confirmation)
- Clear all stashes
- Apply with conflict handling

---

### 2.8 Tags (P1)

#### 2.8.1 Tag Management
**Priority**: P1

**User Flow - Create Tag**:
1. Right-click commit → "Create Tag"
2. Enter tag name
3. Choose tag type:
   - Lightweight (name only)
   - Annotated (with message, date, author)
4. Configure options:
   - Sign tag (GPG)
   - Push tag to remote
5. Click "Create"

**Tag List UI**:
```
┌────────────────────────────────────────┐
│ TAGS                                    │
├────────────────────────────────────────┤
│ 🏷️ v1.2.0                               │
│    Annotated - 2026-05-01              │
│                                         │
│ 🏷️ v1.1.0                               │
│    Annotated - 2026-04-15              │
│                                         │
│ 🏷️ experiment                           │
│    Lightweight                          │
└────────────────────────────────────────┘
```

**Actions**:
- Push tag to remote
- Delete tag (local and/or remote)
- Checkout tag (detached HEAD)
- Create branch from tag
- Copy tag name

**Acceptance Criteria**:
- Create lightweight and annotated tags
- GPG sign tags
- Push tags individually or all at once
- Delete tags
- Filter/search tags
- Show tag in commit graph

---

### 2.9 Remote Repository Management (P1)

#### 2.9.1 Remote Configuration
**Priority**: P1

**User Flow**:
1. Open Repository Settings → Remotes
2. View list of remotes:
   ```
   ┌────────────────────────────────────────┐
   │ Remotes                                 │
   ├────────────────────────────────────────┤
   │ Name: origin                            │
   │ URL:  https://github.com/user/repo.git │
   │                                          │
   │ Name: upstream                          │
   │ URL:  https://github.com/org/repo.git  │
   │                                          │
   │ [Add Remote]  [Edit]  [Remove]         │
   └────────────────────────────────────────┘
   ```
3. Add/Edit/Remove remotes
4. Configure push/refspec URLs

**Acceptance Criteria**:
- Add multiple remotes
- Set separate push/pull URLs
- Edit remote URL
- Remove remote
- Show remote statistics (last fetch)

---

#### 2.9.2 Remote Repository Browser
**Priority**: P1

**User Flow**:
1. Click "Remote" tab in sidebar
2. View remote repositories from connected accounts
3. Filter by account or search
4. Click to clone repository

**Acceptance Criteria**:
- Browse GitHub/Bitbucket/GitLab repositories
- Filter by owner, visibility (public/private)
- Search repositories
- Clone directly from browser

---

### 2.10 Submodules (P2)

#### 2.10.1 Submodule Management
**Priority**: P2

**User Flow - Add Submodule**:
1. Click "Repository" → "Add Submodule"
2. Enter submodule URL
3. Select target path
4. Configure options:
   - Branch to track
   - Shallow clone
5. Click "Add"

**Submodule Status UI**:
```
┌────────────────────────────────────────┐
│ SUBMODULES                              │
├────────────────────────────────────────┤
│ 📁 lib/utils                             │
│    abc123 (v1.0.0)                      │
│    ↑ 1 commit ahead                     │
│                                          │
│ 📁 lib/parser                            │
│    def456                                │
│    ✓ Up to date                         │
└────────────────────────────────────────┘
```

**Actions**:
- Update submodule
- Initialize submodule
- Sync submodule
- Open submodule in new window
- Remove submodule

**Acceptance Criteria**:
- Show submodule status (current commit, branch)
- Update/init/sync submodules
- Recursive operations (for nested submodules)
- Open submodule as separate repo

---

### 2.11 Cherry-Pick (P2)

#### 2.11.1 Cherry-Pick Commits
**Priority**: P2

**User Flow**:
1. Right-click commit → "Cherry-pick"
2. Select parent if merge commit
3. Configure options:
   - Auto-commit after successful pick
   - Append commit ID to message
4. Click "Cherry-pick"
5. Handle conflicts if any

**Acceptance Criteria**:
- Cherry-pick single or multiple commits
- Handle merge commits (choose parent)
- Option to commit immediately
- Conflict resolution flow
- Abort cherry-pick

---

### 2.12 Git Flow Workflow (P2)

#### 2.12.1 Git Flow Integration
**Priority**: P2

**User Flow - Initialize Git Flow**:
1. Click "Git Flow" → "Initialize"
2. Configure branch names:
   - Master/main branch
   - Develop branch
   - Feature branch prefix
   - Release branch prefix
   - Hotfix branch prefix
   - Support branch prefix
   - Version tag prefix
3. Click "Initialize"

**User Flow - Create Feature**:
1. Click "Git Flow" → "Start New Feature"
2. Enter feature name
3. Feature branch created from develop
4. Work on feature
5. Click "Git Flow" → "Finish Feature"
6. Merge back to develop
7. Delete feature branch

**Similar flows for**:
- Release (merge to master + develop, tag)
- Hotfix (merge to master + develop, tag)
- Support (maintenance branches)

**Acceptance Criteria**:
- Initialize git flow with custom branch names
- Start/finish feature branches
- Start/finish release branches
- Start/finish hotfix branches
- Auto-tag releases and hotfixes
- Push branches on finish

---

### 2.13 Patch Files (P2)

#### 2.13.1 Create Patch
**Priority**: P2

**User Flow**:
1. Select commits (single or range)
2. Right-click → "Create Patch"
3. Choose patch format:
   - Standard diff
   - Mailbox format (git format-patch)
4. Save to file

**Acceptance Criteria**:
- Create patch from commits
- Create patch from staged changes
- Support diff and mailbox format
- Binary file handling

---

#### 2.13.2 Apply Patch
**Priority**: P2

**User Flow**:
1. Click "Repository" → "Apply Patch"
2. Select patch file
3. Preview patch contents
4. Choose apply options:
   - Apply to index
   - Apply to working directory
   - Reject file handling
5. Click "Apply"

**Acceptance Criteria**:
- Apply patch from file
- Apply patch from clipboard
- Preview before applying
- Handle rejects
- Sign off applied commits

---

### 2.14 Diff Viewer (P0)

#### 2.14.1 Unified Diff View
**Priority**: P0

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ File: src/app.ts                                        │
├─────────────────────────────────────────────────────────┤
│  1  | import React from 'react';          │  1  | import React from 'react';          │
│  2  | import { useState } from 'react';   │  2  | import { useState } from 'react';   │
│  3  |                                      │  3  |                                      │
│  4  | function App() {                    │  4  | function App() {                    │
│  5  |   const [count, setCount] = useS... │  5  |   const [count, setCount] = useS... │
│     |------------------------------------  │  6  |   const [user, setUser] = useState...  │
│     |------------------------------------  │  7  |                                      │
│  6  |   return (                          │  8  |   return (                          │
│  7  |     <div>                           │  9  |     <div>                           │
│  8  |       <h1>Hello</h1>                │ 10  |       <h1>Hello {user.name}</h1>    │
│                                                   │       (modified line)                │
└─────────────────────────────────────────────────────────┘
```

**Features**:
- Side-by-side or unified view toggle
- Line numbers
- Syntax highlighting (language detection)
- Show whitespace changes
- Ignore whitespace option
- Context lines configurable
- File encoding detection

**Actions**:
- Stage/unstage hunk (click hunk header)
- Stage/unstage line (click line)
- Copy line/hunk
- Open in external diff tool
- Blame/annotate line
- Jump to definition (if available)

---

#### 2.14.2 Image Diff
**Priority**: P1

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ [Side by Side] [Swipe] [Onion Skin] [Difference]        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐    ┌──────────┐                          │
│  │          │    │          │                          │
│  │  Old     │    │  New     │                          │
│  │  Image   │    │  Image   │                          │
│  │          │    │          │                          │
│  └──────────┘    └──────────┘                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**View Modes**:
1. **Side by Side**: Old and new images adjacent
2. **Swipe**: Slider to reveal before/after
3. **Onion Skin**: Fade between old and new
4. **Difference**: Highlight changed pixels

**Acceptance Criteria**:
- Support common image formats (PNG, JPG, GIF, SVG)
- Zoom in/out
- Pan image
- Image metadata display (dimensions, size)

---

### 2.15 External Tools Integration (P1)

#### 2.15.1 External Diff/Merge Tools
**Priority**: P1

**Supported Tools**:
- **Diff**: FileMerge (macOS), Beyond Compare, Araxis Merge, Kaleidoscope, P4Merge, WinMerge (Windows), Meld
- **Merge**: Same as diff + custom configurations

**Configuration**:
- Preferences → Diff Command
- Auto-detect installed tools
- Custom arguments support

**User Flow**:
1. Right-click file → "External Diff"
2. Selected tool launches with file comparison
3. For merge: use merge tool during conflict resolution

---

#### 2.15.2 External Editor
**Priority**: P1

**User Flow**:
1. Right-click file → "Open in External Editor"
2. Configured editor opens file

**Supported Editors**:
- VS Code
- Sublime Text
- Atom
- IntelliJ IDEA
- Vim/Neovim
- Emacs
- Custom command

---

#### 2.15.3 Terminal Integration
**Priority**: P1

**User Flow**:
1. Click "Terminal" button in toolbar
2. Configured terminal opens at repo root

**Supported Terminals**:
- macOS: Terminal.app, iTerm2, Hyper, Alacritty
- Windows: PowerShell, cmd, Git Bash, Windows Terminal

---

### 2.16 Authentication & Accounts (P1)

#### 2.16.1 OAuth Integration
**Priority**: P1

**Supported Services**:
- GitHub.com
- GitHub Enterprise
- Bitbucket Cloud
- Bitbucket Server
- GitLab.com
- GitLab CE/EE
- Azure DevOps

**User Flow**:
1. Open Preferences → Accounts
2. Click "Add Account"
3. Select service
4. OAuth flow opens in browser
5. Authorize application
6. Return to app with credentials stored
7. Account appears in list

**Acceptance Criteria**:
- OAuth 2.0 with PKCE for security
- Store tokens securely (keychain on macOS, credential manager on Windows)
- Refresh tokens automatically
- Multiple accounts per service
- Revoke authorization from service side

---

#### 2.16.2 SSH Key Management
**Priority**: P1

**User Flow - Generate SSH Key**:
1. Open Preferences → SSH
2. Click "Generate Key"
3. Choose key type: RSA, ED25519, ECDSA
4. Enter passphrase (optional)
5. Key generated and saved
6. Copy public key to clipboard
7. Add to hosting service

**User Flow - Use Existing Key**:
1. Open Preferences → SSH
2. Click "Add Key"
3. Browse to private key file
4. Add passphrase if needed
5. Key available for use

**Acceptance Criteria**:
- Generate SSH keys (RSA, ED25519, ECDSA)
- Import existing keys
- Store passphrase securely
- Test SSH connection
- Copy public key to clipboard
- Auto-detect system SSH agent

---

### 2.17 Search (P1)

#### 2.17.1 Commit Search
**Priority**: P1

**User Flow**:
1. Open search panel (Cmd/Ctrl+F)
2. Enter search term
3. Choose search scope:
   - Commit message
   - Commit hash
   - Author name/email
   - File path
   - Diff content
4. View results list
5. Click result to navigate

**Acceptance Criteria**:
- Fast full-text search
- Regex support
- Filter by date range
- Filter by author
- Filter by branch
- Search in diffs (pickaxe search)

---

### 2.18 Preferences & Settings (P1)

#### 2.18.1 Global Preferences
**Priority**: P1

**Categories**:

1. **General**
   - Theme: Light/Dark/Auto
   - Language: System/English/Chinese/Japanese/etc.
   - Default clone directory
   - Check for updates automatically
   - Confirm destructive actions

2. **Git**
   - Default branch name (main/master)
   - Default Git ignore
   - GPG signing key
   - Auto-fetch interval
   - Enable commit signing by default

3. **Diff**
   - Diff tool (internal/external)
   - Merge tool
   - Ignore whitespace
   - Show line numbers
   - Tab width
   - Context lines

4. **Accounts**
   - Connected accounts list
   - Add/remove accounts
   - SSH keys management

5. **Editor**
   - External editor command
   - Terminal command
   - Custom actions

6. **Advanced**
   - Custom Git path
   - Warning dialogs toggles
   - Experimental features
   - Debug mode

---

#### 2.18.2 Repository Settings
**Priority**: P1

**Categories**:

1. **General**
   - Repository name (in app)
   - Repository icon
   - Description

2. **Remotes**
   - Manage remotes

3. **Branches**
   - Default branch
   - Branch protection rules

4. **Submodules**
   - Submodule settings

5. **Hooks**
   - View/edit hooks

---

### 2.19 UI/UX Features (P1)

#### 2.19.1 Themes
**Priority**: P1

**Options**:
- Light theme
- Dark theme
- Auto (follow system)

**Customization**:
- Diff colors (additions, deletions, modifications)
- Graph line colors
- Accent color

---

#### 2.19.2 Internationalization
**Priority**: P1

**Supported Languages**:
- English (default)
- Chinese (Simplified)
- Chinese (Traditional)
- Japanese
- Korean
- French
- German
- Spanish
- Portuguese (Brazil)
- Italian
- Russian
- Ukrainian

---

#### 2.19.3 Keyboard Shortcuts
**Priority**: P1

**Essential Shortcuts**:
- `Cmd/Ctrl + N`: New repository
- `Cmd/Ctrl + O`: Open repository
- `Cmd/Ctrl + S`: Stage changes
- `Cmd/Ctrl + Enter`: Commit
- `Cmd/Ctrl + P`: Push
- `Cmd/Ctrl + Shift + P`: Pull
- `Cmd/Ctrl + Shift + K`: Create branch
- `Cmd/Ctrl + Shift + M`: Merge
- `Cmd/Ctrl + F`: Search
- `Cmd/Ctrl + ,`: Preferences

**Customization**:
- User can customize shortcuts
- Import/export shortcut mappings

---

### 2.20 Notifications (P2)

#### 2.20.1 Desktop Notifications
**Priority**: P2

**Events**:
- Push completed
- Pull completed with changes
- Merge conflicts detected
- Action failed
- Update available

**Acceptance Criteria**:
- Native OS notifications
- Configurable per event type
- Quiet hours support

---

### 2.21 Performance & Reliability (Non-functional)

#### 2.21.1 Performance Requirements

| Metric | Target |
|--------|--------|
| App startup time | < 2 seconds |
| Repository open time | < 1 second |
| Commit list load (1000 commits) | < 500ms |
| Diff render time | < 200ms |
| File status refresh | < 300ms |
| Memory usage (idle) | < 200 MB |
| Memory usage (active) | < 500 MB |
| Large repo support (100k+ commits) | Should work smoothly |

---

#### 2.21.2 Reliability Requirements

- Auto-save state (open repositories, unsaved commit messages)
- Safe shutdown (prompt for ongoing operations)
- Crash recovery (restore last state)
- Undo/redo for destructive actions where possible

---

### 2.22 Security (Non-functional)

#### 2.22.1 Credential Storage
- Use OS keychain (macOS Keychain, Windows Credential Manager)
- Encrypt sensitive data at rest
- Never log credentials
- Secure memory handling

#### 2.22.2 Safe URL Handling
- Validate all URLs before processing
- Prevent code injection via URLs
- Sanitize user input

#### 2.22.3 Update Security
- Code signing (macOS: notarized, Windows: Authenticode)
- HTTPS-only updates
- Signature verification

---

## 3. Data Models

### 3.1 Core Entities

```typescript
// Repository
interface Repository {
  id: string;
  path: string;
  name: string;
  icon?: string;
  description?: string;
  defaultBranch: string;
  currentBranch: string;
  remoteUrl?: string;
  remoteName?: string;
  lastAccessed: Date;
  createdAt: Date;
  isGithub?: boolean;
  isGitlab?: boolean;
  isBitbucket?: boolean;
  ahead: number;
  behind: number;
  workingDirectoryChanges: number;
  stagedChanges: number;
}

// Branch
interface Branch {
  name: string;
  upstream?: string;
  headCommit: Commit;
  isCurrent: boolean;
  isRemote: boolean;
  ahead: number;
  behind: number;
  lastCommitDate: Date;
}

// Commit
interface Commit {
  hash: string;
  shortHash: string;
  message: string;
  subject: string;
  body: string;
  author: Author;
  committer: Author;
  date: Date;
  parents: string[];
  refs: string[]; // branches, tags pointing to this commit
  treeHash: string;
}

// Author
interface Author {
  name: string;
  email: string;
  avatarUrl?: string;
}

// FileStatus
interface FileStatus {
  path: string;
  oldPath?: string; // for renames
  status: FileStatusType;
  staged: boolean;
  additions: number;
  deletions: number;
  binary: boolean;
}

enum FileStatusType {
  Added = 'A',
  Modified = 'M',
  Deleted = 'D',
  Renamed = 'R',
  Copied = 'C',
  Unmerged = 'U',
  Untracked = '?',
  Ignored = '!',
}

// Tag
interface Tag {
  name: string;
  commitHash: string;
  message?: string;
  tagger?: Author;
  date?: Date;
  isAnnotated: boolean;
  isSigned: boolean;
}

// Stash
interface StashEntry {
  index: number;
  message: string;
  branchName: string;
  commitHash: string;
  date: Date;
}

// Remote
interface Remote {
  name: string;
  fetchUrl: string;
  pushUrl?: string;
  branches: RemoteBranch[];
}

interface RemoteBranch {
  name: string;
  localBranch?: string;
  status: 'upToDate' | 'ahead' | 'behind' | 'diverged';
}

// Account
interface Account {
  id: string;
  service: 'github' | 'gitlab' | 'bitbucket' | 'azure-devops';
  username: string;
  email: string;
  avatarUrl?: string;
  accessToken: string;  // encrypted
  refreshToken?: string;  // encrypted
  tokenExpiry?: Date;
  url?: string; // for enterprise/server instances
}

// Bookmark
interface Bookmark {
  id: string;
  repositoryId: string;
  order: number;
  pinned: boolean;
  addedAt: Date;
}

// Settings
interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  defaultCloneDir: string;
  defaultBranchName: string;
  autoFetchInterval: number;
  confirmDestructiveActions: boolean;
  diffTool: DiffToolConfig;
  mergeTool: MergeToolConfig;
  externalEditor: string;
  terminal: string;
  gitPath?: string;
}

interface DiffToolConfig {
  type: 'internal' | 'external';
  name?: string;
  command?: string;
  arguments?: string[];
}

interface MergeToolConfig {
  name: string;
  command: string;
  arguments?: string[];
}
```

---

### 3.2 Database Schema (SQLite)

```sql
-- Repositories (bookmarks)
CREATE TABLE repositories (
  id TEXT PRIMARY KEY,
  path TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  default_branch TEXT DEFAULT 'main',
  last_accessed DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  metadata JSON
);

-- Accounts
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  service TEXT NOT NULL,
  username TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  access_token TEXT, -- encrypted
  refresh_token TEXT, -- encrypted
  token_expiry DATETIME,
  url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(service, username, url)
);

-- Settings
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Recent repositories
CREATE TABLE recent_repositories (
  repository_id TEXT PRIMARY KEY,
  last_opened DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (repository_id) REFERENCES repositories(id)
);

-- Commit message templates
CREATE TABLE commit_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  template TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. Git Command API Design

### 4.1 GitService Interface

```typescript
interface IGitService {
  // === Repository ===
  
  /** Clone a repository from URL */
  clone(url: string, path: string, options?: CloneOptions): Promise<CloneResult>;
  
  /** Initialize a new repository */
  init(path: string, options?: InitOptions): Promise<void>;
  
  /** Check if path is a Git repository */
  isRepo(path: string): Promise<boolean>;
  
  /** Get repository information */
  getRepoInfo(path: string): Promise<RepoInfo>;
  
  // === Status ===
  
  /** Get file status */
  status(path: string): Promise<StatusResult>;
  
  /** Get diff of changes */
  diff(path: string, options?: DiffOptions): Promise<DiffResult>;
  
  // === Staging ===
  
  /** Stage files */
  add(path: string, files: string[]): Promise<void>;
  
  /** Stage specific hunks */
  addHunks(path: string, file: string, hunks: Hunk[]): Promise<void>;
  
  /** Stage specific lines */
  addLines(path: string, file: string, lines: number[]): Promise<void>;
  
  /** Unstage files */
  reset(path: string, files: string[]): Promise<void>;
  
  /** Unstage specific hunks */
  resetHunks(path: string, file: string, hunks: Hunk[]): Promise<void>;
  
  // === Commit ===
  
  /** Create a commit */
  commit(path: string, message: string, options?: CommitOptions): Promise<CommitResult>;
  
  /** Amend last commit */
  amend(path: string, message?: string, options?: AmendOptions): Promise<CommitResult>;
  
  // === History ===
  
  /** Get commit log */
  log(path: string, options?: LogOptions): Promise<Commit[]>;
  
  /** Get a specific commit */
  showCommit(path: string, hash: string): Promise<CommitDetail>;
  
  /** Get commit diff */
  diffCommit(path: string, hash: string, options?: DiffOptions): Promise<DiffResult>;
  
  /** Annotate/blame a file */
  blame(path: string, file: string): Promise<BlameLine[]>;
  
  /** Search commits */
  searchCommits(path: string, query: SearchQuery): Promise<Commit[]>;
  
  // === Branch ===
  
  /** List branches */
  listBranches(path: string): Promise<Branch[]>;
  
  /** Create branch */
  createBranch(path: string, name: string, options?: BranchOptions): Promise<void>;
  
  /** Delete branch */
  deleteBranch(path: string, name: string, force?: boolean): Promise<void>;
  
  /** Rename branch */
  renameBranch(path: string, oldName: string, newName: string): Promise<void>;
  
  /** Checkout branch/commit */
  checkout(path: string, ref: string, options?: CheckoutOptions): Promise<void>;
  
  /** Get current branch */
  currentBranch(path: string): Promise<string>;
  
  // === Merge & Rebase ===
  
  /** Merge branch */
  merge(path: string, branch: string, options?: MergeOptions): Promise<MergeResult>;
  
  /** Abort merge */
  mergeAbort(path: string): Promise<void>;
  
  /** Rebase onto branch */
  rebase(path: string, onto: string, options?: RebaseOptions): Promise<RebaseResult>;
  
  /** Continue rebase */
  rebaseContinue(path: string): Promise<RebaseResult>;
  
  /** Abort rebase */
  rebaseAbort(path: string): Promise<void>;
  
  /** Interactive rebase */
  rebaseInteractive(path: string, onto: string, commits: RebaseCommitAction[]): Promise<RebaseResult>;
  
  // === Remote ===
  
  /** List remotes */
  listRemotes(path: string): Promise<Remote[]>;
  
  /** Add remote */
  addRemote(path: string, name: string, url: string): Promise<void>;
  
  /** Remove remote */
  removeRemote(path: string, name: string): Promise<void>;
  
  /** Fetch from remote */
  fetch(path: string, remote?: string, options?: FetchOptions): Promise<FetchResult>;
  
  /** Pull from remote */
  pull(path: string, remote?: string, branch?: string, options?: PullOptions): Promise<PullResult>;
  
  /** Push to remote */
  push(path: string, remote?: string, branch?: string, options?: PushOptions): Promise<PushResult>;
  
  // === Stash ===
  
  /** List stashes */
  listStashes(path: string): Promise<StashEntry[]>;
  
  /** Create stash */
  stash(path: string, message?: string, options?: StashOptions): Promise<void>;
  
  /** Apply stash */
  stashApply(path: string, index: number, drop?: boolean): Promise<void>;
  
  /** Drop stash */
  stashDrop(path: string, index: number): Promise<void>;
  
  // === Tag ===
  
  /** List tags */
  listTags(path: string): Promise<Tag[]>;
  
  /** Create tag */
  createTag(path: string, name: string, options?: TagOptions): Promise<void>;
  
  /** Delete tag */
  deleteTag(path: string, name: string): Promise<void>;
  
  /** Push tag */
  pushTag(path: string, name: string, remote?: string): Promise<void>;
  
  // === Advanced ===
  
  /** Cherry-pick commits */
  cherryPick(path: string, commits: string[], options?: CherryPickOptions): Promise<void>;
  
  /** Reset to commit */
  reset(path: string, commit: string, mode: ResetMode): Promise<void>;
  
  /** Revert commit */
  revert(path: string, commit: string): Promise<void>;
  
  /** Clean untracked files */
  clean(path: string, options?: CleanOptions): Promise<void>;
  
  // === Submodule ===
  
  /** List submodules */
  listSubmodules(path: string): Promise<Submodule[]>;
  
  /** Add submodule */
  addSubmodule(path: string, url: string, subPath: string, options?: SubmoduleOptions): Promise<void>;
  
  /** Update submodule */
  updateSubmodule(path: string, subPath: string, options?: SubmoduleUpdateOptions): Promise<void>;
  
  /** Remove submodule */
  removeSubmodule(path: string, subPath: string): Promise<void>;
  
  // === Patch ===
  
  /** Create patch from commits */
  createPatch(path: string, commits: string[], outputPath: string): Promise<void>;
  
  /** Apply patch */
  applyPatch(path: string, patchPath: string, options?: PatchOptions): Promise<void>;
  
  // === Config ===
  
  /** Get config value */
  getConfig(path: string, key: string, global?: boolean): Promise<string | undefined>;
  
  /** Set config value */
  setConfig(path: string, key: string, value: string, global?: boolean): Promise<void>;
  
  // === Hooks ===
  
  /** List hooks */
  listHooks(path: string): Promise<Hook[]>;
  
  /** Execute custom Git command */
  exec(path: string, args: string[]): Promise<ExecResult>;
}
```

### 4.2 Type Definitions

```typescript
interface CloneOptions {
  depth?: number;
  branch?: string;
  recursive?: boolean;
  singleBranch?: boolean;
  sshKey?: string;
}

interface CloneResult {
  path: string;
  warnings: string[];
}

interface InitOptions {
  branch?: string;
  bare?: boolean;
}

interface RepoInfo {
  path: string;
  headBranch: string;
  rootPath: string;
  bare: boolean;
  workdirGitPath?: string;
}

interface StatusResult {
  files: FileStatus[];
  staged: number;
  unstaged: number;
  untracked: number;
  conflicts: number;
  ahead: number;
  behind: number;
  branch: string;
  trackingBranch?: string;
}

interface DiffOptions {
  staged?: boolean;
  file?: string;
  commit?: string;
  commitCompare?: string;
  ignoreWhitespace?: boolean;
  contextLines?: number;
  unified?: number;
}

interface DiffResult {
  files: FileDiff[];
  raw: string;
}

interface FileDiff {
  path: string;
  oldPath?: string;
  binary: boolean;
  additions: number;
  deletions: number;
  hunks: Hunk[];
}

interface Hunk {
  header: string;
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

interface DiffLine {
  type: 'add' | 'delete' | 'context';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

interface CommitOptions {
  amend?: boolean;
  signoff?: boolean;
  gpgSign?: boolean;
  noVerify?: boolean;
  author?: { name: string; email: string };
}

interface CommitResult {
  hash: string;
  branch: string;
}

interface LogOptions {
  maxCount?: number;
  skip?: number;
  since?: Date;
  until?: Date;
  author?: string;
  grep?: string;
  file?: string;
  branches?: string[];
}

interface CommitDetail extends Commit {
  files: FileStatus[];
  diff: DiffResult;
  body: string;
}

interface BlameLine {
  lineNumber: number;
  content: string;
  hash: string;
  author: Author;
  date: Date;
}

interface SearchQuery {
  text?: string;
  hash?: string;
  author?: string;
  message?: string;
  file?: string;
  diff?: string; // pickaxe search
  since?: Date;
  until?: Date;
}

interface BranchOptions {
  startPoint?: string;
  checkout?: boolean;
  track?: boolean;
}

interface CheckoutOptions {
  createBranch?: string;
  force?: boolean;
  theirs?: boolean;
  ours?: boolean;
}

interface MergeResult {
  fastForward: boolean;
  conflicts: string[];
  merged: string[];
}

interface MergeOptions {
  noFastForward?: boolean;
  fastForwardOnly?: boolean;
  squash?: boolean;
  noCommit?: boolean;
  message?: string;
}

interface RebaseOptions {
  interactive?: boolean;
  autosquash?: boolean;
  autostash?: boolean;
}

interface RebaseResult {
  success: boolean;
  conflicts: string[];
  currentStep: number;
  totalSteps: number;
}

interface RebaseCommitAction {
  hash: string;
  action: 'pick' | 'reword' | 'edit' | 'squash' | 'fixup' | 'drop';
  message: string;
}

interface FetchResult {
  remote: string;
  branches: { name: string; updated: boolean }[];
  newBranches: string[];
  deletedBranches: string[];
}

interface PullResult extends MergeResult {
  fetchedCommits: number;
  fastForward: boolean;
}

interface PushOptions {
  force?: boolean;
  forceWithLease?: boolean;
  setUpstream?: boolean;
  all?: boolean;
  tags?: boolean;
}

interface PushResult {
  remote: string;
  branch: string;
  updated: boolean;
}

interface StashOptions {
  includeUntracked?: boolean;
  keepIndex?: boolean;
}

interface TagOptions {
  annotated?: boolean;
  message?: string;
  sign?: boolean;
  commit?: string;
}

interface CherryPickOptions {
  noCommit?: boolean;
  mainlineParent?: number;
  signoff?: boolean;
}

type ResetMode = 'soft' | 'mixed' | 'hard' | 'merge' | 'keep';

interface CleanOptions {
  directories?: boolean;
  ignored?: boolean;
  force?: boolean;
  dryRun?: boolean;
}

interface Submodule {
  path: string;
  url: string;
  currentCommit: string;
  branch?: string;
  status: 'initialized' | 'not-initialized' | 'outdated' | 'ahead' | 'behind';
}

interface SubmoduleOptions {
  branch?: string;
  depth?: number;
}

interface SubmoduleUpdateOptions {
  init?: boolean;
  recursive?: boolean;
  remote?: boolean;
}

interface PatchOptions {
  check?: boolean;
  apply?: boolean;
  index?: boolean;
}

interface Hook {
  name: string;
  path: string;
  enabled: boolean;
}

interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}
```

---

## 5. IPC Communication

### 5.1 Main Process ↔ Renderer Process

```typescript
// IPC Channels
enum IpcChannel {
  // Repository
  REPO_CLONE = 'repo:clone',
  REPO_INIT = 'repo:init',
  REPO_OPEN = 'repo:open',
  REPO_STATUS = 'repo:status',
  
  // Git operations
  GIT_COMMIT = 'git:commit',
  GIT_PUSH = 'git:push',
  GIT_PULL = 'git:pull',
  GIT_FETCH = 'git:fetch',
  GIT_BRANCH = 'git:branch',
  
  // Progress events
  PROGRESS_UPDATE = 'progress:update',
  
  // Settings
  SETTINGS_GET = 'settings:get',
  SETTINGS_SET = 'settings:set',
  
  // Accounts
  ACCOUNT_ADD = 'account:add',
  ACCOUNT_REMOVE = 'account:remove',
  ACCOUNT_LIST = 'account:list',
  
  // Dialog
  DIALOG_OPEN_FILE = 'dialog:openFile',
  DIALOG_SAVE_FILE = 'dialog:saveFile',
  DIALOG_SHOW_MESSAGE = 'dialog:showMessage',
}

// Example message
interface IpcMessage<T = any> {
  channel: IpcChannel;
  id: string; // for request/response matching
  payload?: T;
}

// Progress message
interface ProgressMessage {
  operationId: string;
  operation: 'clone' | 'push' | 'pull' | 'fetch';
  progress: number; // 0-100
  stage: string;
  transferred?: number;
  total?: number;
}
```

---

## 6. UI Component Hierarchy

```
App
├── WindowManager
│   ├── BookmarkWindow
│   │   ├── Toolbar (Clone, Init, Add)
│   │   ├── RepoSearchBar
│   │   └── RepoList (bookmarks + recent)
│   │       └── RepoListItem
│   │
│   └── RepoWindow (multiple instances)
│       ├── Toolbar
│       │   ├── ToolbarButton (Branch, Commit, Push, Pull, Stash, Terminal)
│       │   ├── SearchBar
│       │   └── MenuButton (Actions)
│       │
│       ├── Sidebar
│       │   ├── BranchesSection
│       │   ├── TagsSection
│       │   ├── StashesSection
│       │   ├── RemotesSection
│       │   └── SubmodulesSection
│       │
│       ├── MainContent
│       │   ├── FileStatusView (default tab)
│       │   │   ├── UnstagedFilesList
│       │   │   ├── StagedFilesList
│       │   │   └── CommitPanel
│       │   │       ├── CommitMessageBox
│       │   │       └── CommitOptions
│       │   │
│       │   ├── HistoryView
│       │   │   ├── CommitGraph
│       │   │   └── CommitListView
│       │   │       └── CommitListItem
│       │   │
│       │   └── CommitDetailView
│       │       ├── CommitMeta
│       │       └── DiffView
│       │           └── FileDiffViewer
│       │
│       └── StatusBar
│           ├── BranchIndicator
│           ├── SyncStatus (ahead/behind)
│           └── GitVersion
│
├── Dialogs
│   ├── CloneDialog
│   ├── InitDialog
│   ├── PushDialog
│   ├── PullDialog
│   ├── MergeDialog
│   ├── RebaseDialog
│   ├── BranchDialog
│   ├── TagDialog
│   ├── StashDialog
│   ├── ConflictDialog
│   └── PreferencesDialog
│
├── Preferences
│   ├── GeneralPane
│   ├── GitPane
│   ├── DiffPane
│   ├── AccountsPane
│   ├── EditorPane
│   └── AdvancedPane
│
└── Notifications
    └── NotificationToast
```

---

## 7. Implementation Priority (MVP)

### Phase 1: Core Repository & Commits (Week 1-2)
- [ ] Project scaffolding (Electron + React + Vite)
- [ ] Basic window management
- [ ] Bookmark/Repository list view
- [ ] Clone repository
- [ ] Init repository
- [ ] Add existing repository
- [ ] File status view
- [ ] Basic staging (whole files)
- [ ] Basic commit
- [ ] Repository open/close

### Phase 2: Branches & Remote (Week 3-4)
- [ ] Branch list in sidebar
- [ ] Create branch
- [ ] Switch/checkout branch
- [ ] Delete branch
- [ ] Push (basic)
- [ ] Pull (basic)
- [ ] Fetch
- [ ] Remote status (ahead/behind)
- [ ] Commit history list (simple)

### Phase 3: Visualization (Week 5-6)
- [ ] Commit graph visualization
- [ ] Diff viewer (unified)
- [ ] Stage hunks
- [ ] Stage lines
- [ ] Better file status refresh
- [ ] Annotate/blame

### Phase 4: Advanced Git (Week 7-8)
- [ ] Merge branches
- [ ] Conflict resolution UI
- [ ] Merge tool integration
- [ ] Rebase (basic)
- [ ] Stash operations
- [ ] Tags
- [ ] Cherry-pick
- [ ] Reset

### Phase 5: Integration & Polish (Week 9-10)
- [ ] GitHub OAuth
- [ ] Bitbucket OAuth
- [ ] SSH key management
- [ ] Remote repository browser
- [ ] Create pull request
- [ ] Interactive rebase
- [ ] Git-flow
- [ ] External editor integration
- [ ] Terminal integration
- [ ] Search

### Phase 6: UX Polish (Week 11-12)
- [ ] Dark/Light themes
- [ ] Internationalization (en, zh)
- [ ] Keyboard shortcuts
- [ ] Settings persistence
- [ ] Notifications
- [ ] Performance optimization
- [ ] Testing
- [ ] Documentation
- [ ] Packaging & distribution

---

## 8. Testing Strategy

### 8.1 Unit Tests
- GitService methods (using temp repos)
- Utility functions
- State management logic

### 8.2 Integration Tests
- Clone → Status → Commit → Push workflow
- Branch creation and switching
- Merge with conflicts
- Authentication flows (mocked)

### 8.3 E2E Tests (Playwright)
- Complete user journeys
- UI interactions
- Cross-platform testing

### 8.4 Manual Testing Matrix
| Scenario | macOS | Windows |
|----------|-------|---------|
| Clone HTTPS repo | ✓ | ✓ |
| Clone SSH repo | ✓ | ✓ |
| Commit workflow | ✓ | ✓ |
| Push/Pull | ✓ | ✓ |
| Branch management | ✓ | ✓ |
| Merge conflicts | ✓ | ✓ |
| Large repo (10k+ commits) | ✓ | ✓ |
| File permissions | ✓ | ✓ |
| Symlinks | ✓ | - |
| Long paths | ✓ | ✓ |

---

## 9. Release Milestones

| Version | Scope | Timeline |
|---------|-------|----------|
| v0.1.0 | Basic clone, init, status, commit | Week 2 |
| v0.2.0 | Branch management, push/pull | Week 4 |
| v0.3.0 | Commit graph, diff viewer | Week 6 |
| v0.5.0 | MVP - All core features | Week 8 |
| v0.7.0 | OAuth, SSH, search | Week 10 |
| v0.9.0 | Polish, i18n, themes | Week 12 |
| v1.0.0 | Production release | Week 14 |

---

## 10. Open Questions

1. **Monaco Editor vs CodeMirror for commit messages?**
   - Monaco: Heavier, but better multi-cursor support
   - CodeMirror: Lighter, good enough for commit messages
   - **Decision**: CodeMirror (lighter weight)

2. **Canvas vs SVG for commit graph?**
   - Canvas: Better performance for large graphs
   - SVG: Easier interactivity, styling
   - **Decision**: Canvas for performance, with hit detection overlay

3. **Run Git in main process vs separate worker process?**
   - Main process: Simple, but blocks UI for heavy operations
   - Worker process: Better UI responsiveness
   - **Decision**: Worker process for background operations

4. **Support Git worktrees?**
   - Power user feature
   - **Decision**: P2 feature

---

## 11. Appendix

### A. Competitive Analysis

| Feature | SourceTree | GitKraken | GitHub Desktop | Fork | Our Clone |
|---------|-----------|-----------|----------------|------|-----------|
| Platform | Mac+Win | Mac+Win+Linux | Mac+Win | Mac+Win | Mac+Win |
| Price | Free | $4.95/mo | Free | Free | Free |
| Git | ✓ | ✓ | ✓ | ✓ | ✓ |
| Mercurial | ✓ | ✗ | ✗ | ✗ | ✗ |
| Branch graph | ✓ | ✓ | Limited | ✓ | ✓ |
| Interactive rebase | ✓ | ✓ | ✗ | ✓ | ✓ |
| Git-flow | ✓ | ✓ | ✗ | ✓ | ✓ |
| Merge conflicts | ✓ | ✓ | ✓ | ✓ | ✓ |
| SSH keys | ✓ | ✓ | ✓ | ✓ | ✓ |
| GitHub integration | ✓ | ✓ | ✓✓ | ✓ | ✓ |
| GitLab integration | ✓ | ✓ | ✗ | ✓ | ✓ |
| Bitbucket integration | ✓✓ | ✓ | ✗ | ✓ | ✓ |
| Submodules | ✓ | ✓ | ✗ | ✓ | ✓ |
| LFS | ✓ | ✓ | ✓ | ✓ | ✓ |
| Open source | ✗ | ✗ | ✓ | ✗ | ✓ |

### B. Git Commands Reference

List of Git commands to implement:

```bash
# Repository
git clone <url> [path]
git init [path]

# Status & Diff
git status
git diff [--staged] [-- <file>]
git diff <commit> [-- <file>]

# Staging
git add <files>
git add -p <file>  # interactive
git reset HEAD <files>

# Commit
git commit -m "message"
git commit --amend
git commit -S  # GPG sign

# Log
git log [--oneline] [-n] [-- <file>]
git show <commit>
git blame <file>

# Branch
git branch
git branch <name> [<start-point>]
git branch -d <name>
git branch -m <old> <new>
git checkout <branch>
git checkout -b <branch>

# Merge
git merge <branch>
git merge --no-ff <branch>
git merge --abort

# Rebase
git rebase <onto>
git rebase -i <onto>
git rebase --continue
git rebase --abort

# Remote
git remote
git remote add <name> <url>
git remote remove <name>
git fetch [remote]
git pull [remote] [branch]
git push [remote] [branch]
git push --force-with-lease

# Stash
git stash
git stash list
git stash apply [stash@{n}]
git stash pop
git stash drop

# Tag
git tag
git tag -a <name> -m "message"
git tag -d <name>
git push origin <tag>

# Advanced
git cherry-pick <commit>
git reset --<mode> <commit>
git revert <commit>
git clean -fd

# Config
git config [--global] <key> <value>
git config [--global] <key>

# Submodule
git submodule add <url> <path>
git submodule update --init --recursive
```

---

**End of Specification Document**
