# Liber — Roadmap

> Working name. Last reviewed 2026-11-03.

## Now — planning (Nov 2026)
- [x] Review the May plan against WordPress 7.1 (PLAN §7).
- [x] Static layout prototype — [`prototype/workspace.html`](prototype/workspace.html).
- [x] Editor spike: Liber's own screen won on speed — ARCHITECTURE §2, branch `spike/editor-host`.
- [ ] GitHub repo (local git for now; needed before v1.0).

## v0.x — Internal
- Build the MVP on a personal site (single site and a multisite subsite). Dogfood before going public.
- First week:
  - [x] Plugin skeleton, Composer tooling (PHPCS, PHPStan, PHPUnit), pre-commit hook.
  - [x] `liber_doc` post type; Member and Viewer roles; every page private — tested on core's test suite, single site and multisite.
  - [x] TypeScript tooling (`@wordpress/scripts`); e2e tests on Playground.
  - [x] Workspace screen: page tree from a cached `liber/v1/tree`, editor that switches pages in place, New page.
  - [x] Continuous saving with revision snapshots; locks per page; read-only view for Viewers.
  - [x] Heartbeat tree refresh.
  - [x] Page actions: add a subpage, move to trash (with subpages); Trash dialog with restore and, for admins, delete; 5-level limit.
  - [x] Drag to move pages (above, below, inside).
  - [x] ⌘K: find pages by title (with their path), New page, Open trash.
  - [x] Page header: emoji icon picker (curated list, any typed emoji), "Edited by … · 2 hours ago".
  - [ ] "Move to…" menu item (keyboard path for moving), pinned and recent (with recently used emoji), mobile drawer.
  - [ ] CI, once the GitHub repo exists.

## v1.0 — MVP (wordpress.org)
Full scope in PLAN §4:
- `liber_doc` pages; tree up to 5 levels; drag to reorder and move.
- Block editor on Liber's own screen (no reload between pages), allowed blocks + Page link and Callout blocks.
- Sidebar: search, new page, pinned, recent, tree, trash, settings.
- Notes on blocks: threads, replies, @mentions (Liber's UI on core's data).
- Core post locks (core's lock dialog) and command palette commands.
- Emoji page icons.
- Workspace mode (opt-in): login landing, hidden admin chrome, private site.
- Roles: Administrator, Member, Viewer.
- Themes from admin color schemes + Liber Light.
- Setup wizard (warns about plugins; never deactivates them).
- Caching with transient fallback; Heartbeat freshness.
- English + pt_BR (translate.wordpress.org); mobile drawer; multisite-safe.

## v1.1 — Quick wins
- Share to web: a page and its subpages become public, with a read-only view and `noindex` by default (PLAN §4.15).
- Import/export: Markdown, and Notion exports rebuilt as a tree.
- Abilities API + MCP: search, read and create pages from AI clients.
- History: saved versions, preview, restore.
- Notes on selected text.
- Read-only view when someone else is editing, instead of the lock dialog.
- Duplicate page (with subtree), bulk actions, cover images, workspace-wide pins.

## v1.2 — Collaboration
- Notification inbox for mentions and replies (core Feature Notifications if it lands), plus email.
- Note reactions.
- Mermaid / diagram block.
- Presence ("who's here") through core's Presence API, if merged.
- Real-time co-editing when core ships it (not before 2027).

## v1.3 — Power users
- Page templates.
- Tags / labels.
- Guest users who see only shared pages; invite by email code + approval.

## v2.0 — Lightweight databases
- Custom properties per page.
- Filters and sorts.
- Table view first; board and calendar later.

## Deliberately delayed
- Real-time co-editing until core ships it.
- Liber Dark, until the editor's own UI can follow a dark scheme.
- Core's private editor UI (visual revisions, Notes, List View): switch to it only if core makes it public.
- Building on the new admin framework (`@wordpress/boot`, `@wordpress/route`) until it's stable.
- Native mobile apps (PWA first); full offline editing.
