# Liber — Roadmap

> Working name. Last reviewed 2026-11-02.

## Now — planning (Nov 2026)
- [x] Review the May plan against WordPress 7.1 (PLAN §7).
- [x] Static layout prototype — [`prototype/workspace.html`](prototype/workspace.html).
- [ ] Editor spike: option B vs C (2–3 days, throwaway) — ARCHITECTURE §2.
- [ ] GitHub repo (local git for now; needed before v1.0).

## v0.x — Internal
- Build the MVP on a personal site (single site and a multisite subsite). Dogfood before going public.
- First week: plugin skeleton, tooling, CI, and private-page handling with its tests.

## v1.0 — MVP (wordpress.org)
Full scope in PLAN §4:
- `liber_doc` pages; tree up to 5 levels; drag to reorder and move.
- Block editor with allowed blocks + Page link and Callout blocks.
- Sidebar: search, new page, pinned, recent, tree, trash, settings.
- Core features switched on for pages: Notes (with inline notes and @mentions), post locks, visual revisions, command palette commands.
- Emoji page icons.
- Workspace mode (opt-in): login landing, hidden admin chrome, private site.
- Roles: Administrator, Member, Viewer.
- Themes from admin color schemes + Liber Light / Liber Dark.
- Setup wizard (warns about plugins; never deactivates them).
- Caching with transient fallback; Heartbeat freshness.
- English + pt_BR (translate.wordpress.org); mobile drawer; multisite-safe.

## v1.1 — Quick wins
- Share to web: a page and its subpages become public, with a read-only view and `noindex` by default (PLAN §4.15).
- Import/export: Markdown, and Notion exports rebuilt as a tree.
- Abilities API + MCP: search, read and create pages from AI clients.
- WP 7.2 Notes extras (reactions, margin display) once 7.2 is the minimum.
- Duplicate page (with subtree), bulk actions, cover images, workspace-wide pins.

## v1.2 — Collaboration
- Notification inbox for mentions and replies (core Feature Notifications if it lands), plus email.
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
- Building on the new admin framework (`@wordpress/boot`, `@wordpress/route`) until it's stable.
- Native mobile apps (PWA first); full offline editing.
