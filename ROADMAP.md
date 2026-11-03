# Tinta — Roadmap

> Last reviewed 2026-11-03.

## Now — planning (Nov 2026)
- [x] Review the May plan against WordPress 7.1 (PLAN §7).
- [x] Static layout prototype — [`prototype/workspace.html`](prototype/workspace.html).
- [x] Editor spike: Tinta's own screen won on speed — ARCHITECTURE §2, branch `spike/editor-host`.
- [x] GitHub repo (private until the first release).

## v0.x — Internal
- Build the MVP on a personal site (single site and a multisite subsite). Dogfood before going public.
- First week:
  - [x] Plugin skeleton, Composer tooling (PHPCS, PHPStan, PHPUnit), pre-commit hook.
  - [x] `tinta_doc` post type; Member and Viewer roles; every page private — tested on core's test suite, single site and multisite.
  - [x] TypeScript tooling (`@wordpress/scripts`); e2e tests on Playground.
  - [x] Workspace screen: page tree from a cached `tinta/v1/tree`, editor that switches pages in place, New page.
  - [x] Continuous saving with revision snapshots; locks per page; read-only view for Viewers.
  - [x] Heartbeat tree refresh.
  - [x] Page actions: add a subpage, move to trash (with subpages); Trash dialog with restore and, for admins, delete; 5-level limit.
  - [x] Drag to move pages (above, below, inside).
  - [x] ⌘K: find pages by title (with their path), New page, New subpage here, Pin/Unpin, Open trash, Workspace settings, Toggle sidebar; Search button in the sidebar.
  - [x] Page header: emoji icon picker (curated list, any typed emoji), "Edited by … · 2 hours ago".
  - [x] Block allowlist; Page link and Callout blocks.
  - [x] Pinned and Recent sections, remembered tree branches, recently used emoji (per user, per site).
  - [x] CI on GitHub Actions: standards, PHP tests (single site and multisite), e2e on Playground in Chromium, Firefox and WebKit (Safari's engine).
  - [x] "Move to…" (keyboard path for moving).
  - [x] Notes on blocks: threads, replies, @mentions, resolve and reopen (core's data, Tinta's panel).
  - [x] Workspace settings (name, workspace mode, new people's role, versions kept) and the account menu.
  - [x] Workspace mode: login landing, full-window workspace, Members and Viewers kept in it, private site.
  - [x] Mobile: the sidebar as a drawer; Notes and block settings cover the page.
  - [x] Page menu (Pin, Rename, Move to…, Move to trash) from "⋯" in the tree and page header, and on right click; hide the sidebar.
  - [x] Columns block; Blocks panel ("Browse all"); click below the last block to keep writing; markers beside blocks with open notes.
  - [x] Drag handle on hover to move blocks.
  - [x] Drag to reorder pins.
  - [x] Setup wizard: name and icon, conflicting plugins, new people's role, sample pages, workspace mode.
  - [x] `readme.txt`, a minimal release zip (only what WordPress runs), and Plugin Check in CI on it (clean, experimental checks included).
  - [x] Release pipeline: a `v*` tag runs CI and publishes a GitHub release with the zip and its changelog.
  - [x] Named Tinta – Team Wiki; README, GPL-2.0 LICENSE, and a "Try it in Playground" link that installs the latest release.
  - [x] RTL: the workspace's right-to-left stylesheet, mirrored layout offsets, drag handle and note markers.
  - [x] Translation-ready: 196 strings extract cleanly from the release files (pt_BR is translated on translate.wordpress.org after release).
  - [x] Prototype polish: breadcrumbs, bold titles, the editor's avatar in "Edited by", an arrow on page links, "+" beside Pages, your role under your name, the workspace icon in the sidebar, the Notes button as the comment icon with its count.
  - [x] Tinta Light admin color scheme (built on core's scheme partials), given to people who join in workspace mode.
  - [x] The sidebar wears the admin color scheme (Midnight, Ocean, Modern…), so the workspace matches the rest of wp-admin.
  - [x] Security review of permissions and REST, with fixes: reading takes a Tinta role (authors too), pages' files and notes stay out of other roles' listings, open-registration warning, parent rules on every write, loop guards.
  - [x] Scale check on Playground with 630 pages, all expanded: the tree endpoint costs no more than any WordPress request (~40 KB), the sidebar renders ~0.25 s after the page loads, typing in a title stays smooth (one 85 ms task over 25 keys and a save).

## v1.0 — MVP (wordpress.org)
Full scope in PLAN §4:
- `tinta_doc` pages; tree up to 5 levels; drag to reorder and move.
- Block editor on Tinta's own screen (no reload between pages), allowed blocks + Page link and Callout blocks.
- Sidebar: search, new page, pinned, recent, tree, trash, settings.
- Notes on blocks: threads, replies, @mentions (Tinta's UI on core's data).
- Core post locks (core's lock dialog) and command palette commands.
- Emoji page icons.
- Workspace mode (on by default; the setup wizard opens on activation): login landing, hidden admin chrome, private site.
- Roles: Administrator, Member, Viewer.
- Themes from admin color schemes + Tinta Light.
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
- Tinta Dark, until the editor's own UI can follow a dark scheme.
- Core's private editor UI (visual revisions, Notes, List View): switch to it only if core makes it public.
- Building on the new admin framework (`@wordpress/boot`, `@wordpress/route`) until it's stable.
- Native mobile apps (PWA first); full offline editing.
