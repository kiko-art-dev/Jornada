# FlowBoard — Personal Project & Task Management App
## Complete Product Design & Technical Architecture

---

## EXECUTIVE SUMMARY

**FlowBoard** is a personal, single-user Trello-like web app designed for managing four distinct workflow domains: Art Production, UE5 Plugin Development, Job Hunting, and Daily Life. It is hosted as a static frontend on GitHub Pages with Supabase as the managed backend.

**Core design principles:**
- **100ms interaction target** — every action feels instant (borrowed from Linear)
- **Keyboard-first, mouse-optional** — command palette + vim-style navigation
- **Two-level hierarchy max** — Project → Task (with optional subtasks). No deep nesting.
- **Custom statuses per project** — art workflow ≠ dev workflow ≠ job workflow
- **Releases as first-class objects** — semantic versions, changelog generation, fix-version linking (for UE5 plugin dev)
- **Zero-config defaults** — works out of the box with sensible presets; customizable later

**Tech stack decision:** React 19 + Vite + TypeScript + Tailwind CSS + Supabase (Postgres + Auth + Storage + Realtime). Deployed as a static SPA on GitHub Pages.

**MVP timeline:** 3–4 weeks for a solo developer. Delivers: workspace navigation, kanban boards, task drawer, quick capture, keyboard shortcuts, releases/changelog, export/import.

---

## 1. SPEC CRITIQUE & REFINEMENT

### 1.1 What's Good in the Original Spec

- Four clear workspace domains (Art, UE5 Plugins, Job Hunt, Life) — these map to real workflows
- Multi-view per project (Board, List, Calendar) — essential, borrowed from Notion/Focalboard
- Task drawer with rich metadata — covers the core task management needs
- Bug-specific fields (severity, repro steps, environment) — critical for UE5 plugin dev
- Release management with changelog generation — high-value, rare in personal tools
- Art templates and reference library — domain-specific, adds real value
- Inbox + Today view for Life workspace — Todoist-inspired, excellent for daily planning

### 1.2 Missing Features (Add These)

| Feature | Why |
|---------|-----|
| **Command palette (Cmd+K)** | The single most impactful UX feature. Universal search + action hub. Every modern tool has this. |
| **Global quick-capture** | Todoist-style: hotkey opens a minimal input that parses `#project @tag !priority due:tomorrow` inline. |
| **"Today" dashboard across ALL workspaces** | Not just for Life — aggregate top tasks from Art, UE5, Job, and Life into one daily view. |
| **Task relationships (blocks/blocked-by)** | Essential for UE5 plugin dev where tasks have dependencies. |
| **Batch paste-to-create** | Paste 10 lines → 10 tasks. Trello's best feature for brain-dumping. |
| **Keyboard shortcut help overlay (?)** | Press `?` anywhere to see all available shortcuts. Zero-cost discoverability. |
| **Undo/redo** | At least 20-level undo. Nullboard has 50. Non-negotiable for a single-user tool with no "other pair of eyes." |
| **Archive (not delete)** | Soft-delete everything. Tasks, projects, releases. Recoverable within 30 days. |
| **Dark mode** | You're an artist and a developer. You live in dark mode. Ship it from day one. |

### 1.3 Unnecessary / Overbuilt Features (Cut or Defer)

| Feature | Verdict | Reason |
|---------|---------|--------|
| **Attachments on tasks** | **Defer to Phase 2** | Supabase Storage adds complexity. Use external links (Google Drive, Dropbox) for MVP. |
| **Comments/timeline on tasks** | **Simplify** | Solo user doesn't need threaded comments. Replace with a simple "notes log" — append-only markdown. |
| **Time tracking (estimate/time spent)** | **Defer to Phase 3** | Nice but not critical. Adds UI clutter. Track time externally (Toggl) if needed. |
| **Recurring tasks** | **Defer to Phase 2** | Requires a scheduler/cron mechanism. Complex to build correctly. |
| **WIP limits** | **Defer to Phase 2** | Useful but not MVP. A visual indicator (column count) suffices initially. |
| **Calendar view** | **Defer to Phase 2** | Board + List views cover 90% of needs. Calendar requires a date-picker library and layout engine. |
| **Art reference library** | **Defer to Phase 2** | For MVP, use a project with a "Gallery" tag. Build the dedicated reference library later. |
| **Snooze** | **Defer to Phase 2** | Requires a timer/scheduler. For MVP, use due dates. |

### 1.4 Risks Identified

| Risk | Mitigation |
|------|------------|
| **Scope creep** | Ruthless MVP. Ship the board + task drawer + quick capture + export first. Everything else is Phase 2+. |
| **Supabase cold starts** | Supabase free tier pauses after 1 week of inactivity. Mitigate: use a cron ping (GitHub Actions, every 6 days) or upgrade to Pro ($25/mo). |
| **Data loss (single user, no team backup)** | Auto-export JSON backup weekly (via Supabase Edge Function or manual button). Store in GitHub repo or local drive. |
| **Offline usage** | MVP is online-only (Supabase dependency). Phase 2 adds service worker + IndexedDB cache for offline reads. |
| **Performance with large datasets** | Paginate task lists (50 per page). Use Supabase's built-in Postgres indices. Virtualize long lists (react-window). |
| **GitHub Pages SPA routing** | GitHub Pages doesn't support client-side routing natively. Use hash routing (`/#/project/123`) or a 404.html redirect trick. |

### 1.5 Information Architecture (IA) — Refined

```
FlowBoard
├── Today (dashboard — top tasks across all workspaces)
├── Inbox (quick-capture landing zone)
├── Workspaces
│   ├── Art
│   │   ├── Project: Environment Concepts
│   │   │   ├── Board View (Kanban)
│   │   │   └── List View
│   │   └── Project: Weapon Designs
│   ├── UE5 Plugins
│   │   ├── Project: MyPlugin v2
│   │   │   ├── Board View
│   │   │   ├── List View
│   │   │   ├── Bugs (filtered view: type=bug)
│   │   │   └── Releases (version list + changelog)
│   │   └── Project: ShaderTools
│   ├── Job Hunt
│   │   ├── Project: Applications 2026
│   │   │   ├── Board View (Found → Applied → Interview → Offer → Rejected)
│   │   │   └── List View
│   │   └── Project: Portfolio
│   └── Life
│       ├── Project: Admin & Finance
│       ├── Project: Health
│       └── Project: Home
├── Search (Cmd+K)
└── Settings
    ├── Theme (dark/light)
    ├── Export/Import
    └── Account
```

**Key IA decisions:**
- **Workspaces are just tag groups, not separate databases.** All tasks live in one Postgres table. Workspaces are a UI-level grouping for navigation.
- **Bugs are not a separate entity.** A bug is a task with `type: 'bug'` and extra fields (severity, repro_steps, environment). The "Bugs" view is a filtered view of the project's tasks.
- **Releases are a separate entity** linked to tasks via a `release_id` foreign key.
- **Inbox is a virtual project** — tasks created via quick-capture land here with no project assignment. Triage them later.

### 1.6 Status System (Consistent Across Workspace Types)

Every project has a customizable ordered list of statuses. Defaults per workspace type:

**Art Projects:**
| Status | Category | Color |
|--------|----------|-------|
| Idea | backlog | gray |
| Reference | backlog | blue |
| Sketch | active | yellow |
| Rendering | active | orange |
| Polish | active | purple |
| Done | done | green |

**UE5 Plugin (Dev):**
| Status | Category | Color |
|--------|----------|-------|
| Backlog | backlog | gray |
| Todo | backlog | blue |
| In Progress | active | yellow |
| In Review | active | orange |
| Done | done | green |
| Won't Fix | done | red |

**Job Hunt:**
| Status | Category | Color |
|--------|----------|-------|
| Found | backlog | gray |
| Applied | active | blue |
| Phone Screen | active | yellow |
| Interview | active | orange |
| Offer | active | green |
| Rejected | done | red |
| Accepted | done | green |

**Life:**
| Status | Category | Color |
|--------|----------|-------|
| Inbox | backlog | gray |
| Today | active | blue |
| In Progress | active | yellow |
| Waiting | active | orange |
| Done | done | green |

**Status categories** (backlog / active / done) drive the "Today" dashboard algorithm and analytics.

### 1.7 Tag Taxonomy

Tags are global (cross-project, cross-workspace). Suggested starter set:

| Tag | Color | Use |
|-----|-------|-----|
| `urgent` | red | Time-sensitive items |
| `blocked` | orange | Waiting on external dependency |
| `quick-win` | green | < 30 min effort |
| `creative` | purple | Art/design work |
| `technical` | blue | Code/engineering work |
| `research` | teal | Investigation, learning |
| `admin` | gray | Paperwork, emails, forms |
| `ue5` | dark-blue | Unreal Engine specific |
| `portfolio` | pink | Portfolio/showcase related |

Users can create custom tags freely. Tags are freeform strings with optional color.

---

## 2. COMPETITIVE RESEARCH SUMMARY

*(Full detailed research in `research-findings.md` — 12 apps analyzed with 746 lines of findings)*

### Top 12 Apps Analyzed

| App | Key Takeaway for FlowBoard | What NOT to Copy |
|-----|---------------------------|------------------|
| **Trello** | Batch paste-to-create, inline quick-edit (E key), background auto-save, card cover images | Sidebar bloat, Power-Up dependency, no dependencies |
| **Linear** | Command palette (Cmd+K), 100ms target, keyboard-first design, triage queue, shortcut tooltips on hover | Team-centric, sprint rigidity, no offline |
| **Notion** | Multi-view from same data, slash commands, markdown editing, templates, database relations | 6.2s render times, broken offline, "monster system" complexity |
| **Jira** | J/K vim navigation, Versions/Releases as first-class objects, Components, saved filters, `?` shortcut help | 24MB page loads, configuration labyrinth, feature creep |
| **ClickUp** | Composable shortcuts (G+S, V+B), custom statuses per project, "Everything" view | Feature bloat, bugs, 5-level nesting, performance issues |
| **Todoist** | Global Quick Add hotkey, natural language date parsing, inline `# @ !` parsing, clean minimal UI | Not a PM tool, upgrade banners, filter syntax complexity |
| **Asana** | Tab+key metadata shortcuts, split-panel detail view, multi-home tasks, My Tasks (Today/Upcoming/Later) | Team-heavyweight, notification flood, slow view switching |
| **Shortcut** | Stories→Epics→Milestones hierarchy, integrated docs, fast load times | Missing personal features, drag-drop fails at scale |
| **Nullboard** | Single-file simplicity, in-place editing everywhere, 50-level undo, JSON export | localStorage only, no sync, no metadata |
| **Focalboard** | Multi-view (kanban+table+calendar+gallery), custom properties, self-hosted | Less polished UX, slowing development |
| **Planka** | "Remarkably fast and responsive", Trello simplicity without bloat, React/Redux | Kanban-only, no search, no keyboard shortcuts |
| **Vikunja** | Go backend speed, multiple views including Gantt, CalDAV sync, task relationships, active dev | Mobile issues, no command palette |

### Patterns Adopted (Priority Order)

1. **Command Palette (Cmd+K)** — Linear/Todoist → Universal search + actions
2. **Global Quick Add** — Todoist → Capture from anywhere
3. **J/K Vim Navigation** — Jira/Linear → Keyboard-first browsing
4. **100ms Interaction Target** — Linear → Performance as feature
5. **Background Auto-Save** — Trello → Never show save buttons
6. **Multi-View from Same Data** — Notion/Focalboard → Board + List (+ Calendar Phase 2)
7. **Custom Statuses per Project** — ClickUp → Art ≠ Dev ≠ Job workflow
8. **Releases/Versions** — Jira → UE5 plugin version management
9. **Inline Metadata Parsing** — Todoist → `#project @tag !priority` during creation
10. **Split-Panel Task Detail** — Asana → View details without losing board context
11. **? Shortcut Help** — Jira/Todoist → Instant discoverability
12. **JSON Export** — Nullboard/Kanri → Portable, human-readable backups

---

## 3. PRODUCT DESIGN

### 3.1 MVP Scope (Weeks 1–4)

**Week 1: Foundation**
- Project setup (Vite + React + TS + Tailwind + Supabase)
- Auth (single-user magic link or password)
- Database schema + migrations
- Basic navigation shell (sidebar + main area)

**Week 2: Core Task Management**
- Kanban board view (drag-and-drop columns + cards)
- Task drawer (slide-in panel with all fields)
- Task CRUD (create, read, update, archive)
- List view (table-style with sortable columns)
- Quick-capture modal (Cmd+K → "new task" or `Q` hotkey)

**Week 3: Workspace Features**
- Workspace/project navigation
- Custom statuses per project
- Tags (create, assign, filter)
- Priority levels
- Bug-specific fields (severity, repro steps, environment)
- Release management (create version, assign tasks, generate changelog)

**Week 4: Polish & Ship**
- Keyboard shortcuts (full set — see 3.4)
- Command palette (Cmd+K)
- Today dashboard
- Export (JSON + CSV)
- Import (JSON restore)
- Dark mode
- Deploy to GitHub Pages
- Supabase RLS policies

### Phase 2 Roadmap (Weeks 5–8)
- Calendar view
- Recurring tasks
- Attachments (Supabase Storage)
- Offline mode (service worker + IndexedDB)
- WIP limits (visual warnings)
- Art reference library (gallery view with cover images)
- Snooze / defer tasks
- Batch operations (multi-select + bulk status change)
- Task templates (Art, Bug Report, Job Application)
- Saved filter views

### Phase 3 Roadmap (Weeks 9–12)
- Time tracking (estimate + actual)
- Task relationships (blocks/blocked-by) with visual graph
- GitHub integration (link tasks to commits/PRs)
- Auto-backup to GitHub repo (scheduled JSON export)
- Undo/redo (20-level history)
- Mobile-responsive layout
- PWA support (installable)
- Search with full-text indexing

### 3.2 Core Screens — Wireframe Descriptions

#### Screen 1: Today Dashboard

```
┌──────────────────────────────────────────────────────┐
│ [Sidebar]  │  TODAY — Monday, Feb 9                  │
│            │                                         │
│ ★ Today    │  Good morning. You have 8 tasks today.  │
│ ○ Inbox(3) │                                         │
│            │  ── OVERDUE (2) ────────────────────     │
│ ART        │  ☐ !1 Finish cliff shader · EnvConcepts │
│  EnvConcep │  ☐ !2 Fix normal map bug · ShaderTools  │
│  WeaponDes │                                         │
│            │  ── DUE TODAY (3) ──────────────────     │
│ UE5        │  ☐ !1 Submit v2.1 release · MyPlugin    │
│  MyPlugin  │  ☐ !2 Apply to Studio X · Applications  │
│  ShaderTls │  ☐ !3 Pay electricity bill · Admin       │
│            │                                         │
│ JOB HUNT   │  ── HIGH PRIORITY (no date) (3) ───     │
│  Apps 2026 │  ☐ !1 Review PR feedback · MyPlugin     │
│  Portfolio │  ☐ !2 Sculpt hero weapon · WeaponDesigns │
│            │  ☐ !3 Update LinkedIn · Portfolio        │
│ LIFE       │                                         │
│  Admin     │  ── QUICK WINS ────────────────────     │
│  Health    │  ☐ Reply to recruiter email · Apps2026   │
│  Home      │                                         │
│            │  [+ Quick Add]  [View All Tasks]        │
│ ──────     │                                         │
│ ⚙ Settings │                                         │
└──────────────────────────────────────────────────────┘
```

**Layout:** Fixed left sidebar (240px, collapsible) + scrollable main content area.

**Components:**
- **Sidebar:** Workspace groups (collapsible), project links, unread inbox count, settings link
- **Today header:** Date, greeting, task count summary
- **Task sections:** Grouped by urgency tier (overdue → due today → high priority → quick wins)
- **Task row:** Checkbox, priority badge, title, project tag, due date. Click opens task drawer.
- **Quick Add button:** Opens the quick-capture modal

#### Screen 2: Kanban Board

```
┌──────────────────────────────────────────────────────┐
│ [Sidebar]  │  MyPlugin v2  [Board] [List] [Bugs]    │
│            │  [+ Add Status] [Filter ▾] [Sort ▾]    │
│            │                                         │
│            │  BACKLOG(4)   IN PROGRESS(2)  DONE(7)   │
│            │  ┌─────────┐ ┌─────────────┐ ┌───────┐ │
│            │  │ #142    │ │ #156        │ │ #130  │ │
│            │  │ Add LOD │ │ Fix shader  │ │ Setup │ │
│            │  │ !3 @ue5 │ │ compile err │ │ CI/CD │ │
│            │  │ v2.1    │ │ !1 @bug     │ │ ✓     │ │
│            │  ├─────────┤ │ v2.1        │ ├───────┤ │
│            │  │ #143    │ ├─────────────┤ │ #131  │ │
│            │  │ Update  │ │ #157        │ │ Auth  │ │
│            │  │ docs    │ │ Implement   │ │ flow  │ │
│            │  │ !4      │ │ new mat.    │ │ ✓     │ │
│            │  │         │ │ editor      │ │       │ │
│            │  ├─────────┤ │ !2 @ue5     │ └───────┘ │
│            │  │ + Add   │ │ v2.1        │           │
│            │  └─────────┘ └─────────────┘           │
│            │                                         │
└──────────────────────────────────────────────────────┘
```

**Layout:** Sidebar + horizontal scrolling column area.

**Components:**
- **Project header:** Project name, view tabs (Board / List / Bugs / Releases), filter/sort controls
- **Columns:** One per status. Header shows status name + task count. Drag-to-reorder columns.
- **Cards:** Task number, title (2 lines max), priority badge, tags, release version badge. Drag between columns.
- **Add card:** `+ Add` button at column bottom or press `C` with column focused.
- **Click card → opens Task Drawer** (slide-in from right, Asana-style)

#### Screen 3: Task Drawer (Slide-in Panel)

```
┌─────────────────────────────────────────────────────────┐
│ [Board behind, dimmed]          │ TASK #156              │
│                                 │ ✕ Close (Esc)          │
│                                 │                        │
│                                 │ Fix shader compile err │
│                                 │ ──────────────────     │
│                                 │ Status: [In Progress ▾]│
│                                 │ Priority: [!1 Urgent ▾]│
│                                 │ Tags: [@bug] [@ue5] [+]│
│                                 │ Release: [v2.1 ▾]      │
│                                 │ Due: Feb 12, 2026      │
│                                 │ Project: MyPlugin v2   │
│                                 │                        │
│                                 │ ── Description ──────  │
│                                 │ Shader fails to compile│
│                                 │ on UE 5.5 with DX12... │
│                                 │ [Edit markdown]        │
│                                 │                        │
│                                 │ ── Bug Details ──────  │
│                                 │ Severity: [Critical ▾] │
│                                 │ Repro Steps:           │
│                                 │ 1. Open material editor│
│                                 │ 2. Apply custom node   │
│                                 │ 3. Compile → crash     │
│                                 │ Expected: Compiles OK  │
│                                 │ Actual: Crash + log    │
│                                 │ Environment:           │
│                                 │   UE: 5.5.1           │
│                                 │   Platform: Win11/DX12 │
│                                 │   Plugin: v2.0.3       │
│                                 │                        │
│                                 │ ── Checklist (2/5) ──  │
│                                 │ ☑ Reproduce locally    │
│                                 │ ☑ Identify root cause  │
│                                 │ ☐ Write fix            │
│                                 │ ☐ Test on UE 5.4+5.5  │
│                                 │ ☐ Update changelog     │
│                                 │                        │
│                                 │ ── Notes Log ────────  │
│                                 │ Feb 8: Found the issue │
│                                 │ in CustomNode.cpp:142  │
│                                 │                        │
│                                 │ [Archive] [Delete]     │
└─────────────────────────────────────────────────────────┘
```

**Layout:** 50% width slide-in panel from right. Board remains visible but dimmed behind. Press Esc to close.

**Components:**
- **Title:** Editable inline (click to edit)
- **Metadata grid:** Status, Priority, Tags, Release, Due Date, Project — each is a dropdown/picker
- **Bug Details section:** Only visible when task type is "bug". Collapsible.
- **Description:** Markdown editor (edit mode) / rendered markdown (view mode)
- **Checklist:** Add/remove/reorder items. Checkbox toggle. Progress indicator (2/5).
- **Notes log:** Append-only timestamped notes. Simple textarea + "Add note" button.
- **Actions:** Archive (soft delete), Delete (hard delete with confirmation)

#### Screen 4: List View

```
┌──────────────────────────────────────────────────────┐
│ [Sidebar]  │  MyPlugin v2  [Board] [List] [Bugs]    │
│            │  [Filter ▾] [Sort ▾] [Group ▾]          │
│            │                                         │
│            │  #  Title           Status    Pri  Due  │
│            │  ── ─────────────── ──────    ───  ───  │
│            │  156 Fix shader err In Prog   !1   Feb12│
│            │  157 New mat editor In Prog   !2   Feb15│
│            │  142 Add LOD system Backlog   !3   —    │
│            │  143 Update docs    Backlog   !4   —    │
│            │  158 Perf profiling Backlog   !3   Feb20│
│            │  ─────────────────────────────────────  │
│            │  [+ New Task]                           │
│            │                                         │
└──────────────────────────────────────────────────────┘
```

**Layout:** Table with sortable column headers. Click a row → opens Task Drawer.

**Components:**
- **Table headers:** Sortable by any column (click header to toggle asc/desc)
- **Row:** Task number, title, status badge, priority badge, due date
- **Grouping:** Group by status, priority, release, or tag
- **Inline editing:** Double-click status/priority cells to change via dropdown

#### Screen 5: Releases View (UE5 Plugin Projects Only)

```
┌──────────────────────────────────────────────────────┐
│ [Sidebar]  │  MyPlugin v2  [Board] [List] [Bugs]    │
│            │  [Releases]                             │
│            │                                         │
│            │  ── v2.1.0 (In Progress) ─── Feb 15 ── │
│            │  Tasks: 5 total · 2 done · 3 remaining  │
│            │  ████████░░░░░░░░░ 40%                  │
│            │                                         │
│            │  [View Tasks] [Generate Changelog]      │
│            │                                         │
│            │  ── v2.0.3 (Released) ───── Jan 28 ──── │
│            │  Tasks: 8 total · 8 done                │
│            │  █████████████████ 100%                  │
│            │                                         │
│            │  ### Changelog — v2.0.3                  │
│            │  **Added**                              │
│            │  - Custom material node editor (#145)   │
│            │  - LOD auto-generation for meshes (#142)│
│            │  **Fixed**                              │
│            │  - Shader compile crash on DX12 (#156)  │
│            │  - Memory leak in texture loader (#151) │
│            │  **Changed**                            │
│            │  - Migrated to UE 5.5 API (#149)       │
│            │                                         │
│            │  [Copy Markdown] [Export]                │
│            │                                         │
│            │  ── v2.0.2 (Released) ───── Dec 10 ──── │
│            │  ...                                    │
│            │                                         │
│            │  [+ New Release]                        │
└──────────────────────────────────────────────────────┘
```

**Components:**
- **Release card:** Version string, status (Draft/In Progress/Released), target date, progress bar
- **Task count:** Total / done / remaining
- **Changelog:** Auto-generated from tasks in this release, grouped by type (Added/Fixed/Changed)
- **Actions:** View linked tasks, generate/regenerate changelog, copy as markdown, export

#### Screen 6: Quick Capture Modal

```
         ┌────────────────────────────────────────┐
         │  ⚡ Quick Add Task                      │
         │                                        │
         │  ┌────────────────────────────────────┐│
         │  │ Fix normal map sampling #MyPlugin  ││
         │  │ @bug !1 due:friday                 ││
         │  └────────────────────────────────────┘│
         │                                        │
         │  Project: MyPlugin v2  (auto-detected) │
         │  Priority: !1 Urgent   (from inline)   │
         │  Tags: bug             (from inline)   │
         │  Due: Feb 14, 2026     (from "friday") │
         │                                        │
         │  [Enter to save] [Esc to cancel]       │
         └────────────────────────────────────────┘
```

**Behavior:**
1. Press `Q` from anywhere (or `Cmd+K` then type "new task")
2. Modal appears centered with auto-focused text input
3. Type task title with inline parsing: `#project`, `@tag`, `!1-4`, `due:date`
4. Parsed metadata shown below input in real-time
5. Press Enter to save. Task goes to Inbox if no `#project` specified.
6. Press Esc to cancel.
7. Press `Shift+Enter` to save and immediately open the task drawer for more details.

#### Screen 7: Command Palette

```
         ┌────────────────────────────────────────┐
         │  🔍 Search or run a command...          │
         │  ┌────────────────────────────────────┐│
         │  │ fix shader                         ││
         │  └────────────────────────────────────┘│
         │                                        │
         │  TASKS                                 │
         │  → #156 Fix shader compile error  !1   │
         │  → #134 Fix shader LOD transition !3   │
         │                                        │
         │  ACTIONS                                │
         │  → New Task                    Q       │
         │  → Go to Today               G T      │
         │  → Switch to Board View       V B     │
         │  → Export Data               ──       │
         │                                        │
         │  PROJECTS                               │
         │  → MyPlugin v2                         │
         │  → ShaderTools                         │
         │                                        │
         │  [↑↓ Navigate] [Enter Select] [Esc]    │
         └────────────────────────────────────────┘
```

**Behavior:**
1. Press `Cmd+K` (or `Ctrl+K` on Windows) from anywhere
2. Fuzzy search across: task titles, project names, actions, tags
3. Results grouped by category (Tasks, Actions, Projects)
4. Keyboard shortcuts shown next to actions
5. Arrow keys to navigate, Enter to select, Esc to close
6. Empty state shows recent items + common actions

### 3.3 "Today" Dashboard Algorithm

The Today view aggregates tasks across all workspaces and presents them in priority tiers:

```
function getTodayTasks(allTasks: Task[]): TodaySection[] {
  const now = new Date()
  const endOfToday = endOfDay(now)

  // Exclude archived and done tasks
  const active = allTasks.filter(t =>
    t.status_category !== 'done' && !t.archived
  )

  // Tier 1: OVERDUE — past due date, any priority
  const overdue = active
    .filter(t => t.due_date && t.due_date < now)
    .sort(byPriorityThenDate)

  // Tier 2: DUE TODAY — due date is today
  const dueToday = active
    .filter(t => t.due_date && isToday(t.due_date))
    .sort(byPriority)

  // Tier 3: HIGH PRIORITY — !1 or !2 priority, no due date or future due
  const highPriority = active
    .filter(t =>
      (t.priority <= 2) &&
      !overdue.includes(t) &&
      !dueToday.includes(t)
    )
    .sort(byPriorityThenProject)
    .slice(0, 5) // Cap at 5 to avoid overwhelm

  // Tier 4: IN PROGRESS — status_category is 'active', not already shown
  const inProgress = active
    .filter(t =>
      t.status_category === 'active' &&
      !overdue.includes(t) &&
      !dueToday.includes(t) &&
      !highPriority.includes(t)
    )
    .sort(byPriorityThenDate)
    .slice(0, 5)

  // Tier 5: QUICK WINS — tagged 'quick-win', not already shown
  const quickWins = active
    .filter(t =>
      t.tags.includes('quick-win') &&
      !shown.includes(t)
    )
    .slice(0, 3)

  return [
    { title: 'Overdue', tasks: overdue, style: 'danger' },
    { title: 'Due Today', tasks: dueToday, style: 'warning' },
    { title: 'High Priority', tasks: highPriority, style: 'default' },
    { title: 'In Progress', tasks: inProgress, style: 'muted' },
    { title: 'Quick Wins', tasks: quickWins, style: 'success' },
  ].filter(s => s.tasks.length > 0)
}
```

**Design rules:**
- Maximum ~20 tasks shown on Today. More than that causes decision paralysis.
- Each section has a hard cap (overdue: unlimited, due today: unlimited, high priority: 5, in progress: 5, quick wins: 3).
- Tasks are distributed across workspaces — if you have 5 high-priority slots, they come from ALL workspaces proportionally, not just the one with the most tasks.
- A task can only appear in ONE section (first match wins, in tier order).

### 3.4 Keyboard Shortcuts (20 shortcuts)

| Shortcut | Action | Context |
|----------|--------|---------|
| `Cmd+K` / `Ctrl+K` | Open command palette | Global |
| `Q` | Quick add task | Global (not in text input) |
| `?` | Show keyboard shortcuts help | Global |
| `Esc` | Close panel / modal / go back | Global |
| `J` / `↓` | Next task | Board or List view |
| `K` / `↑` | Previous task | Board or List view |
| `H` / `←` | Previous column | Board view |
| `L` / `→` | Next column | Board view |
| `Enter` | Open selected task drawer | Board or List view |
| `C` | Create new task in current column/project | Board or List view |
| `E` | Edit task title inline | Task selected |
| `X` | Toggle task complete | Task selected |
| `D` | Set/change due date | Task selected or drawer open |
| `P` | Set/change priority | Task selected or drawer open |
| `T` | Add/remove tag | Task selected or drawer open |
| `M` | Move task to different status/project | Task selected |
| `G` then `T` | Go to Today dashboard | Global |
| `G` then `I` | Go to Inbox | Global |
| `V` then `B` | Switch to Board view | Project view |
| `V` then `L` | Switch to List view | Project view |
| `1`–`9` | Jump to nth project in sidebar | Global (not in text input) |

**Implementation:** Use a lightweight hotkey library (`hotkeys-js` or custom). Disable single-key shortcuts when focus is in a text input/textarea. Composable shortcuts (`G` then `T`) use a 500ms timeout for the second key.

### 3.5 Templates (Structured Checklists)

#### Art Project — Environment Template

When creating a new task in an Art workspace with the "Environment" template:

```
Title: [Environment Name]
Type: task
Tags: environment, creative
Status: Idea
Priority: !3

Checklist:
☐ Gather reference images (mood, lighting, scale)
☐ Block out composition (gray box layout)
☐ Define color palette and lighting direction
☐ Model primary structures (hero assets)
☐ Model secondary/tertiary elements
☐ UV unwrap and texture base
☐ Material creation and assignment
☐ Lighting pass (direct + ambient)
☐ Atmosphere/fog/post-process
☐ Detail pass (decals, particles, foliage)
☐ Optimization pass (LODs, draw calls, texture budget)
☐ Final render / beauty shots
☐ Breakdown / process screenshots for portfolio
```

#### Art Project — Weapon Template

```
Title: [Weapon Name]
Type: task
Tags: weapon, creative
Status: Idea
Priority: !3

Checklist:
☐ Gather reference (silhouette, mechanism, scale)
☐ Concept sketches (3+ variations)
☐ Select final concept
☐ High-poly sculpt (ZBrush/Blender)
☐ Retopology (game-ready mesh)
☐ UV layout
☐ Bake maps (normal, AO, curvature)
☐ Texture (base color, roughness, metallic)
☐ Material setup in engine
☐ First-person viewport check
☐ Animation-ready pivot/bones check
☐ Final presentation renders
☐ Add to portfolio / ArtStation
```

#### UE5 Plugin — Bug Report Template

```
Title: [Bug Summary]
Type: bug
Tags: bug, ue5
Status: Backlog
Priority: !2

Bug Details:
  Severity: [Critical / Major / Minor / Trivial]

  Repro Steps:
  ☐ 1. [Step one]
  ☐ 2. [Step two]
  ☐ 3. [Step three]

  Expected: [What should happen]
  Actual: [What actually happens]

  Environment:
    UE Version: [e.g., 5.5.1]
    Platform: [e.g., Win11 / DX12]
    Plugin Version: [e.g., v2.0.3]

  Additional:
  ☐ Attach crash log / screenshot
  ☐ Check if reproducible on other UE versions
  ☐ Identify affected code file(s)

Checklist:
☐ Reproduce locally
☐ Identify root cause
☐ Write fix
☐ Test on minimum supported UE version
☐ Test on latest UE version
☐ Update changelog entry
☐ Assign to release version
```

#### UE5 Plugin — Feature Template

```
Title: [Feature Name]
Type: task
Tags: feature, ue5
Status: Backlog
Priority: !3

Checklist:
☐ Write technical design (approach, affected modules)
☐ Create branch from develop
☐ Implement core logic
☐ Add editor UI (if applicable)
☐ Write usage documentation
☐ Test on supported UE versions (5.4, 5.5)
☐ Test on supported platforms (Win, Mac if applicable)
☐ Performance profile (no regression)
☐ Code review / self-review
☐ Merge to develop
☐ Add changelog entry (Added: ...)
☐ Assign to release version
```

#### Job Application Template

```
Title: [Company Name] — [Role]
Type: task
Tags: application, job
Status: Found
Priority: !3

Description:
  Company: [Name]
  Role: [Title]
  Location: [City / Remote]
  Salary Range: [If listed]
  Link: [Job posting URL]

  Why interested: [1-2 sentences]
  Key requirements I meet: [List]
  Gaps: [List any missing requirements]

Checklist:
☐ Read full job description
☐ Research company (Glassdoor, LinkedIn, product)
☐ Tailor resume for this role
☐ Write cover letter (if required)
☐ Submit application
☐ Log application date
☐ Follow up (1 week after)
☐ Prep for phone screen (if contacted)
☐ Prep for technical interview (if applicable)
☐ Send thank-you email after interview
```

---

## 4. TECHNICAL ARCHITECTURE

### 4.1 Stack Decision

| Layer | Choice | Justification |
|-------|--------|---------------|
| **Framework** | React 19 | Mature ecosystem, largest community, best library support. You know it. |
| **Build tool** | Vite 6 | Fast HMR, zero-config TS support, optimized production builds. |
| **Language** | TypeScript (strict mode) | Catches bugs early, self-documenting, essential for a solo dev. |
| **Styling** | Tailwind CSS 4 | Utility-first, no context switching, fast prototyping. Dark mode via `class` strategy. |
| **Routing** | React Router v7 (hash mode) | GitHub Pages compatible. Hash routing (`/#/project/123`) avoids 404 issues. |
| **State management** | Zustand | Minimal boilerplate, no providers, works with React 19. Simpler than Redux for a solo app. |
| **Drag & drop** | @dnd-kit/core | Modern, accessible, performant. Better than react-beautiful-dnd (deprecated). |
| **Markdown** | react-markdown + remark-gfm | Lightweight, GFM support (checklists, tables). |
| **Date handling** | date-fns | Tree-shakeable, functional API. Smaller than dayjs for the functions we need. |
| **Command palette** | cmdk (pacocoursey/cmdk) | 2KB, unstyled, composable. Used by Vercel, Linear-inspired. |
| **Hotkeys** | Custom hook (~50 lines) | Simpler than a library for 20 shortcuts. Use `useEffect` + keydown listener. |
| **Backend** | Supabase | See 4.2 below. |
| **Deployment** | GitHub Pages | Free, static hosting, CI/CD via GitHub Actions. |

### 4.2 Backend: Supabase vs Firebase — Decision: **Supabase**

| Criterion | Supabase | Firebase |
|-----------|----------|---------|
| **Database** | PostgreSQL (full SQL, joins, views, functions) | Firestore (NoSQL, denormalized, limited queries) |
| **Query flexibility** | Full SQL — complex filters, aggregations, changelog generation via SQL | Limited query operators, no joins, must denormalize data |
| **Auth** | Built-in, supports magic link + password + OAuth | Built-in, similar feature set |
| **Storage** | S3-compatible object storage | Cloud Storage (similar) |
| **Realtime** | Postgres changes → websocket (free tier) | Firestore onSnapshot (free tier) |
| **Row-Level Security** | Postgres RLS policies (SQL-based, powerful) | Firestore security rules (JSON-based, less flexible) |
| **Pricing** | Free tier: 500MB DB, 1GB storage, 50K monthly active users | Free tier: 1GB Firestore, 5GB storage, generous |
| **Self-host option** | Yes (Docker) | No |
| **Export** | `pg_dump`, direct SQL access | Must use admin SDK, no direct DB access |
| **Vendor lock-in** | Low (standard Postgres) | High (proprietary Firestore) |

**Decision: Supabase wins decisively** for this use case:
1. **SQL is essential** for changelog generation (`SELECT tasks WHERE release_id = X GROUP BY type`), complex filters, and export queries.
2. **Postgres is a standard** — if Supabase disappears, migrate to any Postgres host.
3. **RLS policies** elegantly solve single-user auth without application-level checks.
4. **Direct SQL access** makes export/import trivial.
5. Firestore's NoSQL model would force painful denormalization for releases + tasks + tags relationships.

### 4.3 Database Schema

#### Entity Relationship Diagram (Text)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  workspaces  │     │   projects   │     │   statuses   │
│──────────────│     │──────────────│     │──────────────│
│ id (PK)      │◄──┐ │ id (PK)      │◄──┐ │ id (PK)      │
│ name         │   └─│ workspace_id │   └─│ project_id   │
│ icon         │     │ name         │     │ name         │
│ color        │     │ description  │     │ category     │
│ sort_order   │     │ type         │     │ color        │
│ created_at   │     │ sort_order   │     │ sort_order   │
│ updated_at   │     │ archived     │     │ is_default   │
└──────────────┘     │ created_at   │     └──────────────┘
                     │ updated_at   │
                     └──────────────┘
                            │
           ┌────────────────┼─────────────────┐
           ▼                ▼                  ▼
┌──────────────┐  ┌──────────────────┐  ┌──────────────┐
│    tasks     │  │    releases      │  │    tags       │
│──────────────│  │──────────────────│  │──────────────│
│ id (PK)      │  │ id (PK)          │  │ id (PK)      │
│ project_id   │  │ project_id (FK)  │  │ name (UNIQUE)│
│ title        │  │ version          │  │ color        │
│ description  │  │ title            │  └──────────────┘
│ type         │  │ status           │         │
│ status_id    │  │ target_date      │         │
│ priority     │  │ released_date    │  ┌──────────────┐
│ due_date     │  │ changelog_md     │  │  task_tags   │
│ release_id   │  │ created_at       │  │──────────────│
│ sort_order   │  │ updated_at       │  │ task_id (FK) │
│ archived     │  └──────────────────┘  │ tag_id (FK)  │
│ created_at   │                        └──────────────┘
│ updated_at   │
│              │  ┌──────────────────┐
│ -- Bug fields│  │  checklist_items │
│ severity     │  │──────────────────│
│ repro_steps  │  │ id (PK)          │
│ expected     │  │ task_id (FK)     │
│ actual       │  │ title            │
│ environment  │  │ checked          │
│              │  │ sort_order       │
└──────────────┘  └──────────────────┘

                  ┌──────────────────┐
                  │   task_notes     │
                  │──────────────────│
                  │ id (PK)          │
                  │ task_id (FK)     │
                  │ content          │
                  │ created_at       │
                  └──────────────────┘
```

#### Full Schema (SQL)

```sql
-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- WORKSPACES (Art, UE5 Plugins, Job Hunt, Life)
-- ============================================================
create table workspaces (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  icon        text,                    -- emoji or icon name
  color       text,                    -- hex color
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- PROJECTS (belong to a workspace)
-- ============================================================
create table projects (
  id            uuid primary key default uuid_generate_v4(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  name          text not null,
  description   text,
  type          text not null default 'general',  -- 'general', 'dev', 'art', 'job'
  sort_order    integer not null default 0,
  archived      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_projects_workspace on projects(workspace_id);

-- ============================================================
-- STATUSES (custom per project, ordered)
-- ============================================================
create table statuses (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references projects(id) on delete cascade,
  name        text not null,
  category    text not null default 'active',  -- 'backlog', 'active', 'done'
  color       text,
  sort_order  integer not null default 0,
  is_default  boolean not null default false
);

create index idx_statuses_project on statuses(project_id);

-- ============================================================
-- TAGS (global, cross-project)
-- ============================================================
create table tags (
  id     uuid primary key default uuid_generate_v4(),
  name   text not null unique,
  color  text
);

-- ============================================================
-- RELEASES (for dev projects — semantic versioning)
-- ============================================================
create table releases (
  id            uuid primary key default uuid_generate_v4(),
  project_id    uuid not null references projects(id) on delete cascade,
  version       text not null,            -- "2.1.0"
  title         text,                     -- optional release title
  status        text not null default 'draft',  -- 'draft', 'in_progress', 'released'
  target_date   date,
  released_date date,
  changelog_md  text,                     -- generated markdown changelog
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique(project_id, version)
);

create index idx_releases_project on releases(project_id);

-- ============================================================
-- TASKS (the atomic unit)
-- ============================================================
create table tasks (
  id            uuid primary key default uuid_generate_v4(),
  project_id    uuid references projects(id) on delete set null,  -- null = Inbox
  status_id     uuid references statuses(id) on delete set null,
  release_id    uuid references releases(id) on delete set null,
  title         text not null,
  description   text,                    -- markdown
  type          text not null default 'task',  -- 'task', 'bug', 'feature'
  priority      integer not null default 4,    -- 1=urgent, 2=high, 3=medium, 4=low
  due_date      date,
  sort_order    integer not null default 0,
  archived      boolean not null default false,

  -- Bug-specific fields (null for non-bugs)
  severity      text,                    -- 'critical', 'major', 'minor', 'trivial'
  repro_steps   text,                    -- markdown
  expected      text,
  actual        text,
  environment   jsonb,                   -- { "ue_version": "5.5", "platform": "Win11/DX12", "plugin_version": "2.0.3" }

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_tasks_project on tasks(project_id);
create index idx_tasks_status on tasks(status_id);
create index idx_tasks_release on tasks(release_id);
create index idx_tasks_priority on tasks(priority);
create index idx_tasks_due_date on tasks(due_date) where due_date is not null;
create index idx_tasks_archived on tasks(archived) where archived = false;

-- ============================================================
-- TASK ↔ TAG (many-to-many)
-- ============================================================
create table task_tags (
  task_id  uuid not null references tasks(id) on delete cascade,
  tag_id   uuid not null references tags(id) on delete cascade,
  primary key (task_id, tag_id)
);

create index idx_task_tags_tag on task_tags(tag_id);

-- ============================================================
-- CHECKLIST ITEMS (belong to a task)
-- ============================================================
create table checklist_items (
  id          uuid primary key default uuid_generate_v4(),
  task_id     uuid not null references tasks(id) on delete cascade,
  title       text not null,
  checked     boolean not null default false,
  sort_order  integer not null default 0
);

create index idx_checklist_task on checklist_items(task_id);

-- ============================================================
-- TASK NOTES (append-only log)
-- ============================================================
create table task_notes (
  id          uuid primary key default uuid_generate_v4(),
  task_id     uuid not null references tasks(id) on delete cascade,
  content     text not null,
  created_at  timestamptz not null default now()
);

create index idx_notes_task on task_notes(task_id);

-- ============================================================
-- UPDATED_AT TRIGGER (auto-update timestamp)
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_workspaces_updated before update on workspaces
  for each row execute function update_updated_at();
create trigger trg_projects_updated before update on projects
  for each row execute function update_updated_at();
create trigger trg_releases_updated before update on releases
  for each row execute function update_updated_at();
create trigger trg_tasks_updated before update on tasks
  for each row execute function update_updated_at();
```

#### Changelog Generation Query

```sql
-- Generate changelog for a specific release
select
  case t.type
    when 'feature' then 'Added'
    when 'bug'     then 'Fixed'
    else                'Changed'
  end as section,
  t.title,
  t.id
from tasks t
join statuses s on t.status_id = s.id
where t.release_id = :release_id
  and s.category = 'done'
order by
  case t.type
    when 'feature' then 1
    when 'bug'     then 2
    else                3
  end,
  t.title;
```

### 4.4 Auth Model (Single User)

**Strategy:** Supabase Auth with email+password. One account. No sign-up flow in the app.

**Setup:**
1. Create your Supabase project
2. Create your user account manually via Supabase dashboard (or a one-time setup script)
3. The app shows a login screen. Enter email + password. Get a JWT.
4. All subsequent API calls include the JWT in the `Authorization` header.
5. Supabase RLS policies ensure only your user ID can read/write data.

**RLS Policies:**

```sql
-- Enable RLS on all tables
alter table workspaces enable row level security;
alter table projects enable row level security;
alter table statuses enable row level security;
alter table tags enable row level security;
alter table releases enable row level security;
alter table tasks enable row level security;
alter table task_tags enable row level security;
alter table checklist_items enable row level security;
alter table task_notes enable row level security;

-- Single user policy: allow everything for authenticated user
-- Option A: Simple — allow any authenticated user (since there's only one)
create policy "Authenticated users have full access" on workspaces
  for all using (auth.role() = 'authenticated');

create policy "Authenticated users have full access" on projects
  for all using (auth.role() = 'authenticated');

create policy "Authenticated users have full access" on statuses
  for all using (auth.role() = 'authenticated');

create policy "Authenticated users have full access" on tags
  for all using (auth.role() = 'authenticated');

create policy "Authenticated users have full access" on releases
  for all using (auth.role() = 'authenticated');

create policy "Authenticated users have full access" on tasks
  for all using (auth.role() = 'authenticated');

create policy "Authenticated users have full access" on task_tags
  for all using (auth.role() = 'authenticated');

create policy "Authenticated users have full access" on checklist_items
  for all using (auth.role() = 'authenticated');

create policy "Authenticated users have full access" on task_notes
  for all using (auth.role() = 'authenticated');

-- Option B: Stricter — lock to a specific user ID
-- Replace the above with:
-- create policy "Only owner" on workspaces
--   for all using (auth.uid() = 'YOUR-USER-UUID-HERE');
```

**Recommendation:** Use Option A for MVP (simpler). Switch to Option B if you ever share the Supabase project URL publicly. Since the app is only for you and the Supabase URL + anon key are in the frontend code, the anon key only grants authenticated access anyway — someone would need your password to do anything.

### 4.5 File Storage Strategy

**MVP (Phase 1): No file uploads. Use external links.**
- Task description supports markdown links: `![screenshot](https://imgur.com/xxx.png)`
- Store art references as URLs to Google Drive, Dropbox, or ArtStation
- This avoids Supabase Storage complexity entirely

**Phase 2: Supabase Storage**
- Bucket: `attachments`
- Path structure: `/{project_id}/{task_id}/{filename}`
- Max file size: 50MB (configurable)
- Allowed types: images (png, jpg, webp, gif), PDFs, zip archives
- RLS on storage: same authenticated-user policy
- Add an `attachments` table:

```sql
create table attachments (
  id          uuid primary key default uuid_generate_v4(),
  task_id     uuid not null references tasks(id) on delete cascade,
  filename    text not null,
  file_path   text not null,      -- Supabase Storage path
  file_size   integer not null,   -- bytes
  mime_type   text not null,
  created_at  timestamptz not null default now()
);
```

### 4.6 Export / Import Design

#### Export (JSON)

**Endpoint:** Button in Settings → "Export All Data"

**Implementation:** A single Supabase RPC function (or client-side query) that fetches all tables and assembles a JSON blob:

```typescript
interface FlowBoardExport {
  version: "1.0"
  exported_at: string          // ISO 8601
  data: {
    workspaces: Workspace[]
    projects: Project[]
    statuses: Status[]
    tags: Tag[]
    releases: Release[]
    tasks: Task[]
    task_tags: TaskTag[]
    checklist_items: ChecklistItem[]
    task_notes: TaskNote[]
  }
}
```

**Client-side export function:**
```typescript
async function exportAll(): Promise<void> {
  const [workspaces, projects, statuses, tags, releases, tasks, task_tags, checklist_items, task_notes] =
    await Promise.all([
      supabase.from('workspaces').select('*'),
      supabase.from('projects').select('*'),
      supabase.from('statuses').select('*'),
      supabase.from('tags').select('*'),
      supabase.from('releases').select('*'),
      supabase.from('tasks').select('*'),
      supabase.from('task_tags').select('*'),
      supabase.from('checklist_items').select('*'),
      supabase.from('task_notes').select('*'),
    ])

  const exportData: FlowBoardExport = {
    version: "1.0",
    exported_at: new Date().toISOString(),
    data: {
      workspaces: workspaces.data!,
      projects: projects.data!,
      statuses: statuses.data!,
      tags: tags.data!,
      releases: releases.data!,
      tasks: tasks.data!,
      task_tags: task_tags.data!,
      checklist_items: checklist_items.data!,
      task_notes: task_notes.data!,
    }
  }

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `flowboard-backup-${format(new Date(), 'yyyy-MM-dd')}.json`
  a.click()
  URL.revokeObjectURL(url)
}
```

#### Export (CSV)

For tasks specifically (most common export need):

```typescript
async function exportTasksCSV(): Promise<void> {
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, projects(name), statuses(name), releases(version)')
    .eq('archived', false)

  const csv = [
    'ID,Title,Project,Status,Priority,Type,Due Date,Release,Created',
    ...tasks!.map(t => [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      t.projects?.name || 'Inbox',
      t.statuses?.name || '',
      t.priority,
      t.type,
      t.due_date || '',
      t.releases?.version || '',
      t.created_at,
    ].join(','))
  ].join('\n')

  // ... trigger download similar to JSON export
}
```

#### Import (JSON Restore)

**Strategy:** Full restore (drop + re-insert). This is a personal app — no need for incremental merge.

```typescript
async function importBackup(file: File): Promise<void> {
  const text = await file.text()
  const backup: FlowBoardExport = JSON.parse(text)

  if (backup.version !== "1.0") {
    throw new Error(`Unsupported backup version: ${backup.version}`)
  }

  // Confirm with user: "This will replace ALL existing data. Continue?"

  // Delete in dependency order (children first)
  await supabase.from('task_notes').delete().neq('id', '')
  await supabase.from('checklist_items').delete().neq('id', '')
  await supabase.from('task_tags').delete().neq('id', '')
  await supabase.from('tasks').delete().neq('id', '')
  await supabase.from('releases').delete().neq('id', '')
  await supabase.from('statuses').delete().neq('id', '')
  await supabase.from('tags').delete().neq('id', '')
  await supabase.from('projects').delete().neq('id', '')
  await supabase.from('workspaces').delete().neq('id', '')

  // Insert in dependency order (parents first)
  await supabase.from('workspaces').insert(backup.data.workspaces)
  await supabase.from('projects').insert(backup.data.projects)
  await supabase.from('statuses').insert(backup.data.statuses)
  await supabase.from('tags').insert(backup.data.tags)
  await supabase.from('releases').insert(backup.data.releases)
  await supabase.from('tasks').insert(backup.data.tasks)
  await supabase.from('task_tags').insert(backup.data.task_tags)
  await supabase.from('checklist_items').insert(backup.data.checklist_items)
  await supabase.from('task_notes').insert(backup.data.task_notes)
}
```

#### Automated Backup Plan

Set up a GitHub Actions workflow that runs weekly:

```yaml
# .github/workflows/backup.yml
name: Weekly FlowBoard Backup
on:
  schedule:
    - cron: '0 3 * * 0'  # Every Sunday at 3am UTC
  workflow_dispatch: {}    # Manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Export data via Supabase API
        run: |
          # Call the export RPC or query each table
          # Save to backups/ directory
          curl -H "apikey: ${{ secrets.SUPABASE_KEY }}" \
               -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_KEY }}" \
               "${{ secrets.SUPABASE_URL }}/rest/v1/rpc/export_all" \
               -o "backups/flowboard-$(date +%Y-%m-%d).json"
      - name: Commit backup
        run: |
          git config user.name "FlowBoard Backup"
          git config user.email "backup@flowboard"
          git add backups/
          git commit -m "Weekly backup $(date +%Y-%m-%d)" || true
          git push
```

### 4.7 GitHub Integration (Optional — Phase 3)

**Approach:** Lightweight linking, not deep integration.

- Add an optional `github_url` field to tasks (text, stores PR/issue/commit URL)
- Add an optional `github_repo` field to projects (text, e.g., "username/my-ue5-plugin")
- In the task drawer, render GitHub URLs as rich previews (use GitHub's OEmbed or just show the URL with an icon)
- For advanced integration: use GitHub's REST API to auto-create task notes when a linked PR is merged

**Not recommended for MVP:** GitHub webhooks, automatic branch creation, or bidirectional sync. These add significant complexity for marginal solo-developer value.

### 4.8 Project Structure

```
flowboard/
├── public/
│   └── 404.html              # SPA redirect for GitHub Pages
├── src/
│   ├── main.tsx               # App entry point
│   ├── App.tsx                # Root component + router
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── MainArea.tsx
│   │   │   └── TopBar.tsx
│   │   ├── board/
│   │   │   ├── Board.tsx       # Kanban board container
│   │   │   ├── Column.tsx      # Single kanban column
│   │   │   └── Card.tsx        # Task card in board
│   │   ├── list/
│   │   │   └── ListView.tsx    # Table/list view
│   │   ├── task/
│   │   │   ├── TaskDrawer.tsx  # Slide-in task detail panel
│   │   │   ├── TaskForm.tsx    # Task create/edit form fields
│   │   │   ├── BugFields.tsx   # Bug-specific fields
│   │   │   └── Checklist.tsx   # Checklist component
│   │   ├── releases/
│   │   │   ├── ReleaseList.tsx
│   │   │   └── Changelog.tsx
│   │   ├── today/
│   │   │   └── TodayDashboard.tsx
│   │   ├── command-palette/
│   │   │   └── CommandPalette.tsx
│   │   ├── quick-capture/
│   │   │   └── QuickCapture.tsx
│   │   └── shared/
│   │       ├── PriorityBadge.tsx
│   │       ├── TagBadge.tsx
│   │       ├── StatusBadge.tsx
│   │       └── DatePicker.tsx
│   ├── hooks/
│   │   ├── useHotkeys.ts       # Keyboard shortcut manager
│   │   ├── useSupabase.ts      # Supabase client + auth
│   │   └── useTodayTasks.ts    # Today dashboard algorithm
│   ├── stores/
│   │   ├── taskStore.ts        # Zustand store for tasks
│   │   ├── projectStore.ts     # Zustand store for projects
│   │   └── uiStore.ts          # UI state (sidebar, drawer, theme)
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client init
│   │   ├── parseQuickCapture.ts # Parse "title #project @tag !1 due:friday"
│   │   ├── changelog.ts        # Generate changelog markdown
│   │   └── export.ts           # Export/import functions
│   ├── types/
│   │   └── index.ts            # TypeScript type definitions
│   └── styles/
│       └── globals.css         # Tailwind directives + custom CSS
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── .github/
│   └── workflows/
│       ├── deploy.yml          # Build + deploy to GitHub Pages
│       └── backup.yml          # Weekly data backup
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 5. BUILD CHECKLIST (Implementation Order)

### Phase 1 — MVP (Weeks 1–4)

#### Week 1: Foundation
- [ ] Initialize Vite + React + TypeScript project
- [ ] Install and configure Tailwind CSS 4 (dark mode via class)
- [ ] Set up React Router v7 with hash routing
- [ ] Create Supabase project (free tier)
- [ ] Run database migration (full schema from section 4.3)
- [ ] Create your single user account in Supabase dashboard
- [ ] Configure Supabase RLS policies
- [ ] Set up `supabase-js` client in the app
- [ ] Build auth flow: login screen → session persistence → redirect
- [ ] Build navigation shell: sidebar + main content area
- [ ] Seed initial data: 4 workspaces, 1 project each, default statuses per project
- [ ] Set up GitHub repo + GitHub Actions deploy workflow for GitHub Pages
- [ ] Configure `404.html` redirect for SPA routing

#### Week 2: Core Task Management
- [ ] Install Zustand; create `taskStore`, `projectStore`, `uiStore`
- [ ] Build `Board.tsx` — kanban board with columns from project statuses
- [ ] Build `Column.tsx` — status column with card list
- [ ] Build `Card.tsx` — task card (title, priority badge, tags, due date)
- [ ] Install @dnd-kit; implement drag-and-drop for cards between columns
- [ ] Implement card reordering within a column (sort_order)
- [ ] Build `TaskDrawer.tsx` — slide-in panel (50% width, right side)
- [ ] Implement task CRUD: create, update, archive in drawer
- [ ] Build `TaskForm.tsx` — editable fields (title, description, status, priority, due date, tags)
- [ ] Build `ListView.tsx` — table view with sortable columns
- [ ] Build view tab switcher (Board / List) in project header
- [ ] Implement optimistic UI updates (update store immediately, sync to Supabase async)

#### Week 3: Features
- [ ] Build sidebar workspace/project navigation (collapsible groups)
- [ ] Implement project CRUD (create, rename, archive) via settings or inline
- [ ] Build tag management: create tags, assign to tasks, filter by tag
- [ ] Build `PriorityBadge`, `TagBadge`, `StatusBadge` shared components
- [ ] Build `BugFields.tsx` — severity, repro steps, expected/actual, environment (JSONB)
- [ ] Add task `type` field: task / bug / feature (icon per type)
- [ ] Build "Bugs" view — filtered board/list showing only type=bug tasks
- [ ] Build `ReleaseList.tsx` — create releases, assign tasks, show progress bar
- [ ] Build `Changelog.tsx` — generate changelog from done tasks in a release (Added/Fixed/Changed)
- [ ] Build "Copy changelog as markdown" button
- [ ] Implement task filtering: by status, priority, tag, type, release

#### Week 4: Polish & Ship
- [ ] Install cmdk; build `CommandPalette.tsx` (Cmd+K / Ctrl+K)
- [ ] Index: tasks (by title), projects (by name), actions (new task, navigate, switch view)
- [ ] Build `QuickCapture.tsx` modal (Q hotkey)
- [ ] Implement inline parsing: `#project @tag !priority due:date`
- [ ] Build `useHotkeys.ts` — all 20 keyboard shortcuts from section 3.4
- [ ] Build `?` shortcut overlay showing all available shortcuts
- [ ] Build `TodayDashboard.tsx` with the algorithm from section 3.3
- [ ] Build Settings page: theme toggle (dark/light), export/import buttons
- [ ] Implement dark mode (Tailwind `dark:` variants)
- [ ] Implement JSON export (full backup)
- [ ] Implement CSV export (tasks only)
- [ ] Implement JSON import (full restore with confirmation)
- [ ] Build inline task creation: `+ Add` at bottom of kanban columns, `+ New Task` in list view
- [ ] Final pass: test all keyboard shortcuts, fix layout issues, performance check
- [ ] Deploy to GitHub Pages
- [ ] Write minimal README with setup instructions

### Phase 2 Tasks (Post-MVP)
- [ ] Calendar view (date-fns + custom grid or react-big-calendar)
- [ ] Recurring tasks (recurrence_rule field, cron-style, auto-create on completion)
- [ ] File attachments (Supabase Storage + attachments table)
- [ ] Offline mode (service worker + IndexedDB cache)
- [ ] WIP limits (configurable per column, visual warning when exceeded)
- [ ] Art reference gallery (gallery view with cover images on cards)
- [ ] Snooze (snooze_until date field, hide from Today until date)
- [ ] Batch operations (multi-select with Shift+click, bulk status/priority change)
- [ ] Task templates (saved structured checklists, apply on creation)
- [ ] Saved filter views (persist filter config, name it, pin to sidebar)
- [ ] Batch paste-to-create (paste multiline text → multiple tasks)

### Phase 3 Tasks (Future)
- [ ] Time tracking (estimate_minutes + actual_minutes fields, timer UI)
- [ ] Task relationships (blocks/blocked-by, separate join table, visual indicators)
- [ ] GitHub integration (github_url on tasks, rich preview in drawer)
- [ ] Automated weekly backup via GitHub Actions
- [ ] Undo/redo (command pattern, 20-level history in memory)
- [ ] Mobile-responsive layout (sidebar → bottom nav, drawer → full screen)
- [ ] PWA support (manifest.json, service worker, installable)
- [ ] Full-text search (Supabase pg_trgm extension for fuzzy matching)
- [ ] Keyboard shortcut tooltips on hover (Linear-style, show after 2s hover)
- [ ] Task number auto-increment per project (#1, #2, ... shown on cards)

---

*Document version: 1.0 — February 9, 2026*
*Total estimated MVP effort: 3–4 weeks (solo developer, ~4 hours/day)*
