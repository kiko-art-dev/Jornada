# Task Management App Research Findings
## For: Personal Trello-like App (Art Projects, UE5 Plugin Dev, Job Hunting, Life Tasks)

---

## 1. TRELLO — Classic Kanban

**URLs:**
- https://trello.com
- https://simple-web.dev/ten-trello-tidbits
- https://www.interaction-design.org/literature/topics/kanban-boards

### Key UX Patterns Worth Copying

- **Batch card creation**: Paste multiple lines of text and Trello auto-creates separate cards per line break. Works for both cards and checklist items. This is exceptional for brain-dumping tasks fast.
- **Inline quick-edit (E key)**: Opens a lightweight edit overlay directly on the card without navigating away from the board. No modal, no page load.
- **Invisible background saves**: Changes sync silently with no loading spinners or save buttons. Drafts for comments and cards persist automatically, eliminating accidental data loss.
- **Arrow-key navigation that mirrors spatial position**: Pressing Right Arrow takes you to the corresponding nth card in the adjacent list (not just the top), preserving spatial context.
- **Inline assignment during creation**: Type `@name`, `#label`, or `^position` while creating a card to assign metadata inline without extra clicks.
- **Fuzzy search with operators**: `@me`, board name chaining, label filters — all from a single search bar.
- **Drag-and-drop everywhere**: Cards between lists, lists within boards, checklist items — consistent interaction model.
- **Multiple board views**: Kanban, timeline, calendar, and dashboard views from the same data.

### What Makes It Fast / Efficient

- Zero-friction card creation (single click or keyboard shortcut).
- Background sync means the UI never blocks on network.
- Simple visual model: columns = stages, cards = tasks. No learning curve.
- Keyboard shortcuts: **N** (new card), **D** (due date), **E** (quick edit), **F** (search/filter).

### What NOT to Copy

- **2025 sidebar bloat**: Recent update removed the left sidebar in favor of an always-present promotional inbox. Users report increased clutter and lag.
- **Power-Up dependency**: Advanced features (custom fields, automations, dashboards) require paid Power-Ups, fragmenting the experience.
- **No built-in task dependencies**: A fundamental missing feature that forces workarounds.
- **Weak reporting**: No filtering by custom fields, checklist completion, or time-based trends.
- **Butler automations complexity**: The automation system is powerful but has a steep learning curve and arbitrary run limits on free tier.
- **Scalability problems**: Boards with many lists/cards become unwieldy — no WIP limits, no collapsing, poor performance.

### Features Relevant to Your Use Cases

| Feature | Relevance |
|---------|-----------|
| Kanban boards | Core model — simple columns + cards |
| Checklists on cards | Good for sub-tasks within art pieces or plugin features |
| Labels with colors | Quick visual categorization (art / dev / job / life) |
| Due dates + calendar view | Deadline tracking for job applications, releases |
| Card cover images | Useful for art project cards — visual thumbnail preview |
| Batch paste to create cards | Brain-dump task lists fast |

---

## 2. LINEAR — Modern Project Management

**URLs:**
- https://linear.app
- https://gunpowderlabs.com/2024/12/22/linear-delightful-patterns
- https://telablog.com/the-elegant-design-of-linear-app/
- https://linear.app/docs/conceptual-model
- https://shortcuts.design/tools/toolspage-linear/

### Key UX Patterns Worth Copying

- **100ms interaction rule**: Every action should complete within 100ms. This is measurable — build your app around this metric.
- **Command palette (Cmd+K)**: Fuzzy-finder modal that provides access to ALL app functions. The single most important UX pattern in modern apps. Linear shows keyboard shortcuts next to each option in the palette, teaching users organically.
- **Contextual keyboard shortcut tooltips**: Hovering over any UI element for 2 seconds shows a tooltip with the keyboard shortcut. Users learn faster workflows without documentation.
- **Keyboard-first, mouse-optional**: Press **C** to create issue, **X** to select, **P** to set priority. Nearly everything is keyboard-accessible.
- **Inline filtering without modals**: Small filter indicators in the filter row. Modify filters in-place without opening dialogs.
- **Triage queue**: New items land in a dedicated triage inbox for accept/decline workflow. Perfect for managing incoming bug reports.
- **Batch item conversion**: Highlight a list of text, convert to individual issues.
- **Snooze with natural language**: Type "2d" in notification snooze = 2 days. Minimal friction.
- **URLable everything**: Every view, issue, project has a shareable/bookmarkable URL.
- **Smooth animations**: Transitions "flow like water" — subtle but they make interactions feel premium.
- **Resolvable threaded comments**: Comments can be marked resolved, reducing noise on issues.

### Conceptual Model (Data Hierarchy)

```
Workspace
  └── Teams
        ├── Issues (the atomic unit — task described in plain language)
        ├── Projects (time-bound deliverables grouping issues)
        ├── Cycles (sprints — team-specific, with start/end dates)
        └── Labels, Priorities, Statuses (per-team configuration)
```

For a **single-user app**, simplify to:
```
Workspace
  └── Projects (Art, UE5 Plugin, Job Hunt, Life)
        ├── Issues/Tasks
        ├── Milestones/Releases (instead of Cycles)
        └── Labels, Priorities, Statuses
```

### What Makes It Fast / Efficient

- Optimistic UI updates (changes appear before server confirms).
- Local-first data architecture with realtime sync.
- Keyboard-driven workflow eliminates mouse travel.
- Opinionated defaults (Triage → Backlog → In Progress → Done) reduce decision fatigue.
- Command palette as universal search + action hub.

### What NOT to Copy

- **Team-centric design**: Everything revolves around teams — overkill for a solo user.
- **Cycles/Sprints rigidity**: Sprint-based workflow adds unnecessary ceremony for personal use.
- **Limited customization**: The opinionated approach means you cannot significantly alter workflows — fine for Linear's use case, but your app should allow custom columns.
- **No offline support**: Linear requires internet connectivity.
- **Engineering-only focus**: Labels, priorities, and statuses are tuned for software dev. Art projects and life tasks need different vocabularies.
- **Single assignee limitation**: Not an issue for solo use, but shows the team-centric thinking.

### Features Relevant to Your Use Cases

| Feature | Relevance |
|---------|-----------|
| Command palette (Cmd+K) | **Must-have** — universal action/search hub |
| Keyboard shortcut tooltips | Teach users shortcuts without docs |
| Triage queue | Manage incoming bugs for UE5 plugin |
| Projects with progress tracking | Track UE5 plugin releases, art series |
| Priority levels (Urgent/High/Medium/Low/None) | Prioritize job applications, bug fixes |
| Issue relationships (blocks, is blocked by) | Track dependencies in plugin dev |
| Inline filters | Quick view: "show me all urgent art tasks" |

---

## 3. NOTION — All-in-One Workspace

**URLs:**
- https://www.notion.com
- https://www.notion.com/help/keyboard-shortcuts
- https://super.so/blog/why-is-notion-slow-and-fixes
- https://uxplanet.org/why-i-stopped-using-notion-an-honest-ux-review-ebf03e268a01

### Key UX Patterns Worth Copying

- **Block-based content model**: Everything (text, tables, images, checklists, embeds) is a "block" that can be moved, nested, or transformed. Extremely flexible.
- **Slash command menu (/)**: Press `/` to get a full menu of insertable content types. Type after `/` to fuzzy-filter. Fast, discoverable, learnable.
- **Multiple database views from same data**: Kanban, table, gallery, calendar, list — all showing the same underlying dataset with different visualizations. Switch views instantly.
- **Inline databases**: Embed a filtered database view anywhere — inside a project page, a meeting note, etc.
- **Cmd+K / Cmd+P**: Quick search and page jumping. Same pattern as Linear's command palette.
- **Markdown-native text editing**: Type `#` for heading, `>` for quote, `-` for list, `[]` for checkbox. Feels natural for developers.
- **Templates**: Reusable page templates for recurring structures (e.g., "New Art Project", "Bug Report", "Job Application").
- **Relation properties**: Link database entries to each other (e.g., a Bug can link to a Release).

### What Makes It Fast / Efficient

- Slash commands for rapid content creation without toolbar navigation.
- Same data, multiple views — no duplicating information.
- Templates eliminate repetitive setup.
- Deep linking — everything has a URL.

### What NOT to Copy

- **Catastrophic performance**: Page content takes ~6.2 seconds to render on desktop. Large databases with nested relations, formulas, and rollups become unusable. This is the #1 lesson: **performance must be non-negotiable**.
- **Offline mode is essentially broken**: Can view cached pages but cannot create new pages, edit databases, or add complex blocks offline. For a self-hosted/personal app, offline-first is critical.
- **"Monster system" complexity**: Notion's flexibility means users spend more time configuring than working. The tool for managing work becomes the work.
- **Steep learning curve**: Users need tutorials to become productive. A personal app should be immediately obvious.
- **Mobile experience is terrible**: Sluggish loading, slow rendering, basic navigation becomes a chore.
- **No native calendar function**: Users must manually create calendars from tables.
- **Search indexing bloat**: Large quantities of inactive pages slow down search across the entire workspace.
- **No end-to-end encryption**: Privacy concern for self-hosted scenarios.

### Features Relevant to Your Use Cases

| Feature | Relevance |
|---------|-----------|
| Database with multiple views | Single source of truth viewed as kanban, table, or calendar |
| Templates | "New Bug Report", "New Art Project", "Job Application" templates |
| Slash commands | Quick content insertion pattern |
| Relations between databases | Link bugs to releases, tasks to projects |
| Gallery view with cover images | Visual browsing of art projects |
| Markdown editing | Natural for a developer building UE5 plugins |

---

## 4. JIRA — Bug Tracking and Releases

**URLs:**
- https://www.atlassian.com/software/jira
- https://support.atlassian.com/jira-software-cloud/docs/use-keyboard-shortcuts/
- https://confluence.atlassian.com/jirasoftware/blog/2015/12/4-essential-jira-software-keyboard-shortcuts

### Key UX Patterns Worth Copying

- **J/K navigation** (vim-style): Navigate through issue lists without mouse. Roots in Unix — universal, muscle-memory friendly. **Copy this pattern.**
- **G + key for navigation**: `G` then another key to jump to a destination. Composable shortcuts.
- **? for shortcut help**: Press `?` anywhere to see all available keyboard shortcuts. Simple, discoverable.
- **Issue types with distinct icons**: Bug, Story, Task, Epic — each has a unique icon for instant visual identification. Relevant for distinguishing art tasks from dev bugs from life tasks.
- **Versions/Releases as first-class objects**: Group issues into releases with release notes, fix versions, and release dates. **Essential for UE5 plugin development.**
- **Workflow engine**: Configurable status transitions (e.g., a bug must go through "In Review" before "Done"). Useful for enforcing quality gates on plugin releases.
- **Components**: Sub-categorize issues within a project (e.g., "Rendering", "UI", "Networking" for a UE5 plugin).
- **Filters and JQL**: Powerful query language for finding issues. Though complex, the concept of saved filters is valuable.

### What Makes It Fast / Efficient

- J/K navigation for rapid issue scanning.
- Saved filters for recurring searches.
- Bulk operations on multiple issues.
- Backlog grooming view with drag-to-prioritize.

### What NOT to Copy

- **Abysmal performance**: Opening a lightly populated board downloads ~24MB across ~350 requests. Each ticket preview adds ~20MB across ~90 requests. **This is the anti-pattern for performance.**
- **Configuration labyrinth**: Workflows, issue types, screens, schemes, field configurations — nested settings 5+ levels deep. Configuring a workflow is "one of the most overly complex and poorly designed process flows."
- **Feature creep via custom fields**: Teams add custom fields incrementally until the system is bloated and unusable. Lesson: **limit the number of metadata fields per card**.
- **Click-wrong-option trap**: Clicking the wrong settings option takes you from project settings to global settings with no intuitive way back.
- **Notification overload**: Default settings produce massive email volume.
- **"Make tea" load times**: Users joke about making tea while waiting for issues to load.
- **Enterprise permission complexity**: Roles, schemes, global permissions — none of this applies to a solo user.
- **UI clutter**: Tabs, menus, buttons everywhere. Simple design becomes invisible under layers of configuration.

### Features Relevant to Your Use Cases

| Feature | Relevance |
|---------|-----------|
| Versions/Releases | **Critical** — track UE5 plugin versions (v1.0, v1.1, etc.) |
| Release notes generation | Auto-generate changelog from resolved issues in a version |
| Components | Categorize UE5 plugin areas (Rendering, UI, Core) |
| Issue types (Bug, Task, Feature) | Distinguish between bug fixes and new features |
| Fix Version field on issues | Know which release includes which fix |
| Workflow transitions | Enforce review steps before marking bugs "Done" |
| J/K vim navigation | Fast keyboard-driven issue browsing |
| Saved filters | "All open bugs for v2.0", "Unresolved high priority" |

---

## 5. CLICKUP — Feature-Rich PM

**URLs:**
- https://clickup.com
- https://help.clickup.com/hc/en-us/articles/6309030550167-Use-keyboard-shortcuts
- https://clickup.com/features/hotkeys-shortcuts

### Key UX Patterns Worth Copying

- **Navigation shortcuts with composable keys**: `G+S` (go to Space), `G+F` (go to Folder), `G+L` (go to List), `V+L` (list view), `V+B` (board view), `V+C` (calendar view). Composable shortcuts are elegant.
- **Single-key task creation**: Press `T` to create a task from anywhere.
- **J/K for task navigation**: Same vim-style pattern as Jira.
- **X to mark complete**: Instant completion toggle.
- **Multiple hierarchy levels**: Spaces → Folders → Lists → Tasks → Subtasks. While too deep for personal use, the concept of nested organization is useful.
- **Everything view**: A global view showing all tasks across all projects. Useful for a "today" or "focus" view.
- **Custom statuses per list**: Different projects can have different status workflows (art: Sketch → Ink → Color → Done; dev: Todo → In Progress → Review → Done).
- **View switching**: Toggle between board, list, calendar, Gantt, and table views for the same data.

### What Makes It Fast / Efficient

- Keyboard shortcut coverage is extensive.
- Global search with Cmd+K.
- Quick task creation from any context.
- Custom statuses mean the tool adapts to the workflow, not vice versa.

### What NOT to Copy

- **Overwhelming feature density**: ClickUp tries to be everything — docs, whiteboards, goals, time tracking, chat, forms, dashboards. The result is feature bloat that confuses new users.
- **Performance problems from complexity**: Users report slow loading, freezing, and data loss. Large dashboards with multiple widgets lag significantly.
- **Notification overload**: Default notification settings are overwhelming.
- **Steep learning curve**: The abundance of features means significant onboarding time.
- **Bug density**: Users report tasks disappearing, search malfunctioning, unexpected crashes. Feature velocity over stability is a warning sign.
- **Deep nesting confusion**: Spaces → Folders → Lists → Tasks → Subtasks creates organizational paralysis. For personal use, **two levels max** (Project → Task, with optional subtasks).
- **Mobile app instability**: Bugs and glitches on mobile platforms.

### Features Relevant to Your Use Cases

| Feature | Relevance |
|---------|-----------|
| Custom statuses per project | Different workflows for art vs. dev vs. job hunting |
| Everything view | "Show me ALL my tasks across all projects" |
| Composable keyboard shortcuts | `G+S`, `V+B` — elegant and learnable |
| Multiple view types | Board, list, calendar from same data |
| Task creation from anywhere (T) | Minimal-friction capture |
| Subtask support | Break down UE5 features or art pieces into steps |

---

## 6. TODOIST — Personal Task Management

**URLs:**
- https://todoist.com
- https://www.todoist.com/help/articles/use-task-quick-add-in-todoist-va4Lhpzz
- https://www.todoist.com/help/articles/use-keyboard-shortcuts-in-todoist-Wyovn2
- https://www.todoist.com/inspiration/todoist-command-menu-keyboard-shortcuts

### Key UX Patterns Worth Copying

- **Global Quick Add (Q)**: Press Q from anywhere in the app to open a task creation dialog. Supports natural language: "Finish character sketch tomorrow p1 #ArtProjects" sets the due date, priority, and project inline.
- **System-wide Quick Add (Ctrl+Cmd+A / global hotkey)**: Capture tasks from ANY app without switching to Todoist. **This is the gold standard for quick capture in personal task management.**
- **Natural language date parsing**: "tomorrow", "next Monday", "every 2 weeks", "Jan 15" — all parsed automatically from the task title. Misinterpretation (e.g., "weekly" treated as date) can be toggled off inline.
- **Inline metadata with special characters**: `#` for project, `@` for label, `!` for priority, `/` for section. All typed inline during task creation.
- **Command menu (Cmd+K)**: Central hub for finding actions, navigation, and shortcuts. Same pattern as Linear.
- **? for keyboard shortcut list**: Press `?` to see all shortcuts. Same as Jira.
- **Minimal, clean interface**: Focus on the task list. No visual clutter.
- **Karma/productivity tracking**: Gamification element — completing tasks earns karma points. Light, motivating, non-intrusive.

### What Makes It Fast / Efficient

- Natural language parsing eliminates separate fields for date, priority, project.
- Global hotkey captures thoughts without context switching.
- The entire flow from "I have an idea" to "it's captured with metadata" takes under 5 seconds.
- Minimal UI means fast rendering and low cognitive load.
- Keyboard-driven workflow (Q, #, @, !, /).

### What NOT to Copy

- **Not a project management tool**: No dependencies, no Gantt, no release tracking. It is purely a task list.
- **Limited free tier**: Reminders, collaboration, and some features require paid plans. For a self-hosted personal app, everything should be available.
- **Upgrade banners everywhere**: Distracting promotional UI for paid features. Never do this in a personal app.
- **Complex filter syntax**: Power user filters use a query language that has a learning curve.
- **No kanban as primary view**: Board view exists but is secondary to the list view. Not ideal if kanban is core.
- **Natural language mis-parsing**: Words like "week" or "monthly" get interpreted as dates when they are part of the task name. Needs an easy override mechanism.

### Features Relevant to Your Use Cases

| Feature | Relevance |
|---------|-----------|
| Global Quick Add hotkey | **Must-have** — capture ideas from any context |
| Natural language dates | "Finish UE5 shader bug fix Friday" auto-sets date |
| Inline project/label assignment | `#UE5Plugin @bug !1` during creation |
| Priority levels (p1-p4) | Quick triage of tasks |
| Recurring tasks | "Review job boards every Monday" |
| Sections within projects | Organize tasks into logical groups |
| Command menu (Cmd+K) | Universal action/search hub |

---

## 7. ASANA — Project Management

**URLs:**
- https://asana.com
- https://help.asana.com/hc/en-us/articles/14139246202779-Keyboard-shortcuts
- https://asana.com/guide/resources/info-sheets/keyboard-shortcuts

### Key UX Patterns Worth Copying

- **Tab+key shortcuts for task metadata**: `Tab+D` (due date), `Tab+A` (assign), `Tab+P` (project), `Tab+L` (like/heart). The Tab modifier is clever — it does not conflict with in-field typing.
- **Ctrl+/ to show all shortcuts**: Discoverable shortcut reference.
- **Task detail as right panel**: Clicking a task opens a detail panel on the right side (split view) without navigating away from the list. You maintain context of where you are in the project.
- **Multi-home tasks**: A single task can appear in multiple projects without duplication. E.g., "Update portfolio website" could appear in both "Job Hunting" and "Art Projects".
- **Custom rules for automation**: "When task moves to Done, set completion date" — simple if/then automations.
- **My Tasks view**: A personal view showing all tasks assigned to you across all projects, sorted by Today / Upcoming / Later. **Essential for a solo user.**
- **Board view with sections**: Kanban columns are actually "sections" that can be renamed and reordered.

### What Makes It Fast / Efficient

- Tab+key shortcuts are fast and avoid conflicts.
- Split-panel detail view preserves list context.
- My Tasks view aggregates work across projects.
- Inline task creation in any view.

### What NOT to Copy

- **Heavyweight for solo use**: Asana is designed for teams. Solo users encounter empty fields (assignee, followers, approvals) that add noise.
- **Minimum 2-seat paid plan**: Pricing model penalizes individual users. Your app should be designed solo-first.
- **Notification email flood**: Default settings produce excessive email notifications.
- **Feature overload for basic tasks**: Goals, portfolios, workload management, timelines — features that add complexity without value for personal use.
- **Slow view switching**: Users report lag when changing between views and occasional freezing.
- **No board keyboard shortcuts**: Asana's keyboard shortcuts were designed for list view; board view navigation is lacking.
- **Mobile performance with attachments**: Extremely slow with large attachments.

### Features Relevant to Your Use Cases

| Feature | Relevance |
|---------|-----------|
| Tab+key metadata shortcuts | Fast, conflict-free shortcut pattern |
| Multi-home tasks | Task appears in multiple projects |
| My Tasks (Today/Upcoming/Later) | Personal daily planning view |
| Split-panel task detail | View details without losing board context |
| Sections as kanban columns | Flexible column management |
| Custom rules | Simple automations for workflow |

---

## 8. SHORTCUT (Formerly Clubhouse) — Dev Project Management

**URLs:**
- https://www.shortcut.com
- https://weareindy.com/blog/shortcut-project-management-review
- https://devops.com/clubhouse-becomes-shortcut-to-transform-software-project-management/

### Key UX Patterns Worth Copying

- **Stories + Epics + Milestones hierarchy**: Stories (tasks) group into Epics (features), which group into Milestones (releases). Clean, three-level hierarchy good for plugin development.
- **Iteration/Sprint tracking with burndown charts**: Visual progress tracking for development cycles.
- **Documentation integrated with project management**: Docs live alongside stories and epics — no separate wiki needed.
- **Quick load times + keyboard shortcuts**: Emphasis on speed as a core value.
- **Simple, self-explanatory interface**: Users report the UX is intuitive without training.
- **Labels and story states**: Customizable workflow states per project.

### What Makes It Fast / Efficient

- Fast load times as a design priority.
- Self-explanatory interface reduces onboarding friction.
- Stories are lightweight (less metadata than Jira issues).
- Integrated docs eliminate context switching.

### What NOT to Copy

- **Missing features for personal use**: No personal task lists, no custom fields, no task dependencies, no time tracking. Too focused on team software development.
- **Drag-and-drop scaling problems**: With 20-30 stories in a column, drag and drop becomes nearly impossible. No auto-sort by priority.
- **No budget/invoice features**: Not relevant to your use case, but shows the narrow focus.
- **Legacy tech stack concerns**: The platform is built on older technology, which may affect long-term responsiveness.
- **Completion dates are buried**: Important metadata is hard to find in the UI.
- **Team-only design**: Not designed for individual use. Many features assume multi-person collaboration.

### Features Relevant to Your Use Cases

| Feature | Relevance |
|---------|-----------|
| Stories → Epics → Milestones | Clean hierarchy for UE5 plugin releases |
| Integrated documentation | Notes alongside tasks for dev work |
| Burndown/velocity charts | Track progress on UE5 plugin development |
| Iteration tracking | Plan development sprints for plugin work |
| Label-based categorization | Tag tasks by area (rendering, UI, core) |

---

## 9. PERSONAL KANBAN / OFFLINE-FIRST DISCOVERIES

### Brisqi — Offline-First Personal Kanban

**URL:** https://brisqi.com

- **Offline-first architecture**: Works without internet. All data stored locally.
- **Privacy-first**: No analytics, no monitoring, no cloud dependency.
- **Cross-platform**: macOS, Linux, Windows, iOS, Android.
- **Simple kanban boards**: No team features, no enterprise complexity. Built for individual use.
- **Data ownership**: You control your data completely.

**Worth Copying**: The offline-first, privacy-first philosophy. No analytics, no telemetry, no cloud requirement.

**Not Worth Copying**: Limited feature set may be too minimal (no labels, no priorities, no multiple views).

---

### Kanri — Modern Offline Kanban

**URL:** https://www.kanriapp.com | **GitHub:** https://github.com/kanriapp/kanri

- **Built with Tauri + Nuxt**: Modern tech stack (Rust backend, web frontend). Lightweight and fast.
- **Offline-only**: No server, no sync, no accounts. Data saved as .json files.
- **Rich-text descriptions, sub-tasks, due dates, tags**: Core task management features without bloat.
- **Customizable themes**: Dark mode, light mode, Catppuccin.
- **Clean, minimalist interface**: "No unnecessary clutter or overwhelming features."
- **Export/backup**: Individual boards or entire workspace to JSON.
- **100% free and open source**.

**Worth Copying**: Tauri + web stack for a fast, native-feeling desktop app. JSON file storage for simplicity and portability. Minimalist-but-complete feature set. Theme customization.

**Not Worth Copying**: No multiple views (kanban only). No search. No keyboard shortcuts documented.

---

### Personal Kanban (personalkanban.js.org)

**URL:** https://personalkanban.js.org

- Single-page web app for personal kanban.
- Virtual offline board — runs entirely in the browser.
- Minimal, no-setup approach.

**Worth Copying**: Zero-setup philosophy.

**Not Worth Copying**: Too minimal for serious project management.

---

## 10. INDIE / SMALL SELF-HOSTED TOOLS

### Nullboard — Minimalist Single-Page Kanban

**URL:** https://github.com/apankrat/nullboard

- **Single HTML file**: The entire app is ONE HTML file + jQuery + a webfont. No build system, no server, no database.
- **localStorage for persistence**: All data stored in browser localStorage.
- **50 revisions of undo/redo**: Automatic revision history.
- **Everything editable in-place**: Click any text to edit. No modals, no forms.
- **JSON export/import**: Plain text backup format.
- **Drag-and-drop cards between lists**.
- **Auto-save on every change**.

**Worth Copying**:
- **In-place editing everywhere** — this is the fastest possible interaction model.
- **Automatic revision history** — 50-level undo is better than most apps.
- **JSON as the data format** — simple, portable, human-readable.
- **Single-file architecture** as inspiration — your app should be deployable with minimal setup.

**Not Worth Copying**:
- localStorage limits (5-10MB browser limit).
- Single device only (no sync).
- No labels, priorities, due dates, or filtering.
- No keyboard shortcuts.

---

### Focalboard — Open Source Trello/Notion Alternative

**URL:** https://www.focalboard.com | **GitHub:** https://github.com/mattermost-community/focalboard

- **Multiple views**: Kanban, table, gallery, calendar from the same data (like Notion).
- **Custom properties**: Create any metadata field you need (text, number, date, select, multi-select).
- **Personal Desktop + Personal Server editions**: Designed for both solo and team use.
- **Self-hosted**: Full control over data with Docker deployment.
- **Card comments with @mentions**: Collaboration features (useful if you ever want to share).
- **Filtered views**: Create and save custom filtered views.
- **Keyboard shortcuts**: Ctrl+Shift+F (search), Ctrl+D (duplicate card).

**Worth Copying**:
- Multiple views from same data (kanban + table + calendar).
- Custom properties on cards — flexible metadata.
- Desktop edition for offline personal use.

**Not Worth Copying**:
- Less polished than Trello — the UX execution needs work.
- Development may be slowing (Mattermost shifting focus).
- No command palette or comprehensive keyboard shortcut system.

---

### Planka — Self-Hosted Trello Clone

**URL:** https://planka.app | **GitHub:** https://github.com/plankanban/planka

- **React/Redux frontend**: Modern, responsive web app.
- **Real-time updates**: WebSocket-based instant sync.
- **Trello-like UX without bloat**: Described as "remarkably fast and responsive."
- **Drag-and-drop task management**: Cards between columns, intuitive.
- **Markdown support**: Rich descriptions and comments.
- **Due dates, labels, checklists, attachments, time tracking**.
- **Docker deployment**: Easy self-hosting.
- **OpenID Connect**: SSO support for self-hosted auth.

**Worth Copying**:
- **Speed and responsiveness** as a design priority.
- **Trello-like simplicity** without the Atlassian bloat.
- Clean, modern UI that does not overwhelm.
- Docker-based self-hosting model.

**Not Worth Copying**:
- No multiple views (kanban only, no table/calendar).
- No mobile app or responsive mobile layout.
- Limited reporting.
- No keyboard shortcuts documented.
- No command palette or search features.

---

### Vikunja — Self-Hosted Todo App

**URL:** https://vikunja.io | **GitHub:** https://github.com/go-vikunja/vikunja

- **Go backend + Vue.js frontend**: Lightweight, fast, easy to deploy.
- **Multiple views**: List, Kanban, Table, Gantt chart.
- **Rich task features**: Recurring tasks, subtasks, priorities, due dates, reminders (with email), labels/tags, attachments, task relationships.
- **Smart filters and saved filters**: Query tasks across all projects.
- **CalDAV support**: Sync with calendar apps.
- **Docker deployment**: Simple self-hosting.
- **Active development**: Frequent commits and releases through 2026.
- **Namespaces and projects**: Organizational hierarchy.
- **API-first design**: REST API for integrations.

**Worth Copying**:
- **Go backend** — fast, single binary, low resource usage. Perfect for self-hosted.
- Multiple views including Gantt (useful for release planning).
- Task relationships (blocks/is-blocked-by).
- CalDAV integration for calendar sync.
- Saved filters for recurring queries.
- Active development and community.

**Not Worth Copying**:
- Mobile syncing and iOS client stability issues.
- No command palette or comprehensive keyboard shortcuts.
- UI is functional but not as polished as Linear or Trello.
- Namespaces add complexity unnecessary for solo use.

---

### Obsidian + Tasks/Kanban Plugins

**URL:** https://obsidian.md | Plugins: Tasks, Kanban

- **Markdown-native**: Tasks are just checkboxes in markdown files. Data is plain text.
- **Kanban plugin**: Drag-and-drop boards where each card can link to a full note.
- **Tasks plugin**: Query tasks across all notes with filters (due date, tags, status).
- **Auto-complete on column move**: Moving a card to a "Done" column auto-checks the task.
- **Offline-first**: All data is local markdown files.
- **Extensible**: 1000+ community plugins.
- **Cross-linked notes**: A kanban card can link to a note containing images, research, links, sub-tasks.

**Worth Copying**:
- **Plain-text data format** — future-proof, portable, version-controllable.
- **Cards linking to rich notes** — perfect for art projects (reference images, inspiration) and UE5 dev (technical notes, API docs).
- **Offline-first by design**.
- **Auto-complete on column move**.
- Query tasks across ALL notes/projects.

**Not Worth Copying**:
- Plugin ecosystem fragility — plugins can break on updates.
- Not a purpose-built PM tool — requires significant configuration.
- No native web UI (desktop app only).
- Performance degrades with large vaults.

---

## SYNTHESIS: Patterns to Adopt for Your Personal App

### Tier 1 — Must-Have Patterns

| Pattern | Source | Why |
|---------|--------|-----|
| **Command Palette (Cmd+K)** | Linear, Todoist, Notion | Universal search + action hub. Single most important UX feature. |
| **Global Quick Add hotkey** | Todoist | Capture tasks from anywhere without context switching. |
| **Keyboard-first design with J/K navigation** | Linear, Jira, ClickUp | Vim-style navigation is universal among power users. |
| **100ms interaction target** | Linear | Measurable performance goal. Non-negotiable. |
| **Background auto-save** | Trello, Nullboard | Never show a save button. Never lose data. |
| **? for shortcut help overlay** | Jira, Todoist | Discoverable shortcut reference. |
| **Multiple views from same data** | Notion, Focalboard, ClickUp, Vikunja | Kanban + list + calendar from one dataset. |
| **Offline-first architecture** | Nullboard, Kanri, Brisqi, Obsidian | Self-hosted + solo user = must work without internet. |

### Tier 2 — High-Value Patterns

| Pattern | Source | Why |
|---------|--------|-----|
| **Natural language date parsing** | Todoist | "tomorrow", "next Friday", "Jan 15" inline. |
| **Inline metadata during creation** | Todoist, Trello | `#project @label !priority` while typing task name. |
| **Contextual keyboard shortcut tooltips** | Linear | Hover to learn shortcuts. Organic education. |
| **In-place editing** | Nullboard, Trello | Click any text to edit. No modals. |
| **Custom statuses per project** | ClickUp | Art workflow != dev workflow != job hunting workflow. |
| **Versions/Releases** | Jira | Track UE5 plugin versions with linked issues. |
| **Task relationships (blocks/blocked-by)** | Linear, Jira, Vikunja | Dependencies for dev work. |
| **Batch card creation (paste multiple lines)** | Trello | Brain-dump a list of tasks instantly. |
| **Split-panel detail view** | Asana | View task details without losing board context. |
| **Tab+key shortcuts for metadata** | Asana | Conflict-free keyboard shortcuts for task fields. |

### Tier 3 — Nice-to-Have

| Pattern | Source | Why |
|---------|--------|-----|
| Composable shortcuts (G+S, V+B) | ClickUp | Elegant for navigation. |
| Triage queue / inbox | Linear | For incoming bugs and ideas. |
| Smooth micro-animations | Linear | Polish and perceived quality. |
| Card cover images / thumbnails | Trello | Visual preview for art projects. |
| Revision history / undo stack | Nullboard | 50-level undo for peace of mind. |
| JSON data format | Nullboard, Kanri | Portable, human-readable, version-controllable. |
| Templates for recurring structures | Notion | "New Bug Report", "New Art Project". |
| Saved/pinned filter views | Linear, Vikunja | "All urgent bugs for v2.0". |
| Markdown descriptions | Planka, Obsidian | Rich text without a WYSIWYG editor. |
| CalDAV sync | Vikunja | Sync due dates to calendar apps. |

### Anti-Patterns to Avoid

| Anti-Pattern | Source | Lesson |
|--------------|--------|--------|
| **24MB page loads** | Jira | Measure and minimize payload size. |
| **6-second render times** | Notion | Performance is a feature. Test with real data volumes. |
| **Deep nesting (5+ levels)** | ClickUp, Jira | Max 2-3 levels: Project → Task (→ Subtask). |
| **Team-centric design for solo tools** | Linear, Asana, Shortcut | Remove assignee, followers, team fields. Solo-first. |
| **Notification systems** | Jira, Asana, ClickUp | Solo user does not need notifications. Remove entirely. |
| **Feature creep / "everything app"** | ClickUp, Notion | Do kanban + task management excellently. Do not add docs, chat, whiteboards, goals. |
| **Enterprise permissions** | Jira, Asana | No roles, no permissions, no admin. Solo user. |
| **Upgrade banners / monetization UI** | Todoist | Self-hosted = no upselling. Ever. |
| **Required internet connectivity** | Linear, Notion, Trello | Offline-first. Sync when available. |
| **Configuration as a feature** | Jira | Sensible defaults > infinite options. |
| **Modal dialogs for everything** | Various | Prefer inline editing, panels, and popovers. |

---

## Recommended Data Model for Your App

Based on patterns from all researched tools:

```
Workspace (single, implicit — no multi-tenant)
  └── Projects (Art, UE5 Plugin, Job Hunt, Life)
        ├── Statuses (custom per project)
        │     e.g., Art: Idea → Sketch → Render → Done
        │     e.g., Dev: Backlog → In Progress → Review → Done
        │     e.g., Job: Found → Applied → Interview → Offer → Done
        ├── Tasks (the atomic unit)
        │     ├── Title (with inline natural language parsing)
        │     ├── Description (markdown)
        │     ├── Status (from project's status list)
        │     ├── Priority (p1-p4 or Urgent/High/Medium/Low)
        │     ├── Labels/Tags (cross-project)
        │     ├── Due Date
        │     ├── Cover Image (for art projects)
        │     ├── Subtasks (one level only)
        │     ├── Relationships (blocks / blocked-by)
        │     └── Custom Fields (per-project, limited set)
        ├── Releases/Milestones (for dev projects)
        │     ├── Version string (v1.0, v2.0)
        │     ├── Target date
        │     ├── Linked tasks
        │     └── Release notes (auto-generated from resolved tasks)
        └── Saved Filters/Views
              ├── View type (kanban, list, table, calendar)
              └── Filter criteria
```

## Recommended Keyboard Shortcut Scheme

Based on best patterns across all tools:

```
GLOBAL
  Cmd+K          Command palette (search + actions)
  Q              Quick add task (global hotkey from outside app too)
  ?              Show all keyboard shortcuts
  /              Focus search
  Esc            Close panel / go back / clear selection

NAVIGATION (vim-style)
  J / K          Next / previous task
  H / L          Move focus left / right (between columns in kanban)
  G then P       Go to Projects
  G then I       Go to Inbox / Triage
  G then T       Go to Today view
  1-9            Switch between projects

TASK ACTIONS
  C / Enter      Create new task
  E              Edit task (inline)
  X              Toggle task complete
  D              Set due date
  P              Set priority
  L              Add label
  Tab+Enter      Create subtask
  Backspace/Del  Delete task (with confirmation)
  M              Move task to different project/status

VIEW SWITCHING
  V then B       Board/kanban view
  V then L       List view
  V then C       Calendar view
  V then T       Table view

DURING TASK CREATION (inline parsing)
  #              Assign to project
  @              Add label
  !1-!4          Set priority
  "tomorrow"     Natural language date
```

---

*Research compiled: February 2026*
*Sources cited inline per app section above*
