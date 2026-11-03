# Tinta — Project Plan

> **Tinta – Team Wiki** (slug and text domain `tinta`).
>
> A free, GPL WordPress plugin that turns a WordPress site into a **private team wiki**: hierarchical documents, written in the block editor, organized in a Notion-like page tree. One site = one workspace.
>
> **Status:** planning done; v0.x starting. Last reviewed **2026-11-03** — the May 2026 plan was updated against WordPress 7.1, and the editor spike chose Tinta's own screen (decision log in §7). Target layout: [`prototype/workspace.html`](prototype/workspace.html).

## 1. Positioning

- **What it is:** a private team wiki on WordPress. Pages live in a tree, are written in the block editor, and only signed-in members can read them.
- **What it isn't:** a CMS, website builder, public knowledge base, database tool or project-management app. Not a security, login or 2FA plugin either — those are other plugins' job.
- **Who it's for:** small teams (under ~10 people) who want their docs on a WordPress they control.
- **Market gap:** WordPress has public docs/knowledge-base plugins (BetterDocs, Echo KB, weDocs, Helpie) and BuddyPress Docs, but no private team workspace with a page tree. Automattic's P2 has closed signups.
- **Distribution:** free on wordpress.org, GPL-2.0-or-later.

## 2. Principles

1. **Core first.** Use what WordPress ships before writing our own: block editor, post locks, Notes and revisions data, the command palette, admin color schemes, the Design System, Heartbeat, core REST endpoints, Site Title and Site Icon. Tinta's own code covers only what core lacks: the workspace shell, the page tree, page icons, two blocks and the privacy layer. When core's UI for a feature is private (Notes), Tinta builds the UI on core's data, so nothing needs migrating if core opens it up.
2. **Stable over shiny.** No private or experimental APIs (`__experimental*`, private-API unlocks, `@wordpress/boot` / `@wordpress/route`). An exception needs a strong reason and a row in the risk register.
3. **Opt-in and reversible.** Activating the plugin changes nothing about how the site behaves. "Workspace mode" is a switch the admin turns on; turning it off (or deactivating) gives back a normal WordPress site.
4. **Focus.** Tinta is a workspace. Security hardening, 2FA, login-screen branding, SMTP and backups stay with dedicated plugins.
5. **Fresh data for signed-in users.** Cache only what's expensive and shared; every write clears it at once.
6. **All WordPress coding standards.** WPCS (Core, Docs, Extra) plus WordPress VIP, unmodified (ARCHITECTURE §7).
7. **Multisite-safe.** Works per site on a multisite network.
8. **Familiar tools.** Tinta is open source, so it uses the tools and conventions WordPress contributors already know — Composer, `@wordpress/scripts`, wp-env, Playground, core's test suite — over custom solutions.

## 3. Requirements

- **WordPress:** latest major at launch — currently **7.1** (7.2 is due 2026-12-08).
- **PHP:** **8.2+**. wp.org stats (Nov 2026): 8.2+ ≈ 67% of sites, 8.3+ ≈ 44%. Re-check once a year.
- **Object cache:** optional. Works with or without Redis/Memcached.
- **Single site and multisite** (activated per site; network activation supported).

## 4. MVP feature spec

### 4.1 Data model
- CPT `tinta_doc`, called "pages" in the UI. Hierarchical via `post_parent`, max depth **5** (enforced in the UI and server-side), sibling order via `menu_order`.
- Not public: no permalinks, archives, feeds or search results. `show_ui` on (the editor needs it), `show_in_menu` off, `show_in_rest` on (`rest_base: tinta-docs`).
- Supports: title, editor (with Notes), revisions, author, custom-fields, page-attributes.
- Own capability type (`tinta_doc` / `tinta_docs`) with `map_meta_cap`, so only Tinta roles reach the content (§4.10).
- **Pages are always private.** "New page" creates the post straight away with WordPress's `private` status; no drafts, no Publish button. (Creating it first also avoids the auto-drafts an empty editor makes.)
- Because pages are private, WordPress itself hides them from anyone without workspace access — REST, queries, feeds and search — even with workspace mode off. Tinta only covers the edges (ARCHITECTURE §3).
- In v1.1, Share turns a page and everything under it public (`publish`) — §4.15.
- Meta: `_tinta_icon` (one emoji). Everything else is core: author, modified date, `_edit_lock`, revisions.

### 4.2 Workspace mode (opt-in)
- **Off** (default after activation): Tinta adds a "Workspace" menu item. The workspace works; the rest of WordPress is untouched.
- **On** (from the wizard or settings; reversible):
  - Everyone lands in the workspace after logging in.
  - The WordPress admin menu and toolbar are hidden on workspace screens.
  - Members and Viewers can't open other wp-admin screens (enforced server-side), except their profile.
  - Admins reach the rest of wp-admin through "Admin tools" in the user menu.
  - The site is private: logged-out visitors are sent to the login screen (from v1.1, shared pages are the exception); the REST API requires login; feeds, sitemaps, oEmbed and author archives are off.
- Comments are **not** disabled — Notes are built on them.

### 4.3 Sidebar & page tree
Sections, top to bottom:
1. Workspace header: core Site Icon + Site Title; menu with Settings and Admin tools.
2. Search — opens the command palette (⌘K / Ctrl+K).
3. New page.
4. Pinned — per user, drag to reorder.
5. Recent — per user, last 5 opened.
6. Pages — the full tree.
7. Trash.
8. Settings (admins only).
9. User menu: profile & color scheme, Admin tools (admins), log out.

Tree behaviour:
- The whole tree skeleton (id, parent, order, title, icon) arrives in one cached request — no lazy loading.
- Expand/collapse state remembered per user.
- Drag to reorder; drag onto a page to move it under that page (depth 5 enforced; invalid drops refused).
- Hovering a page shows "+" (add a child) and "⋯" (pin, rename, move to…, move to trash). A right click on any page in the sidebar opens the same menu at the pointer.
- The sidebar can be hidden (button in its header, or ⌘K → Toggle sidebar); a button in the page header brings it back.
- Other people's changes show up within one Heartbeat tick (~15–60 s). No real-time.
- Each page has a bookmarkable URL; back/forward works.

### 4.4 Editor
- The block editor on Tinta's own screen (ARCHITECTURE §2). Opening another page swaps it in place, with no reload — the workspace should feel like an app.
- **Allowed blocks:** Paragraph, Heading (H1–H3), List, Quote, Code, Preformatted, Image, Gallery, File, Video, Embed (YouTube, Vimeo, X; Loom and Figma need oEmbed providers core doesn't ship, so they come later), Separator, Table, Details, Columns (for layouts like text with a sidebar). Plus Tinta's two blocks:
  - **Page link** — links to another page, showing its current icon and title.
  - **Callout** — tinted box with an emoji and rich text. Enter on an empty last line leaves it, like core's Quote.
- Page header: emoji icon (click to change) above a large bold title (`post_title`), then the last editor's avatar and "Edited by Maria · 2 h ago".
- `/` opens the core inserter, filtered to allowed blocks. Empty pages show "Type / for commands".
- "Browse all" in the quick inserter opens the Blocks panel beside the page: every allowed block by category, with search (Enter adds the first match).
- Clicking below the last block starts a new paragraph, as in core's editor — how you keep writing after a page link or a callout.
- Hovering a block shows a drag handle at its left, like Notion's: drag it to move the block (core's drop indicator and move), click it to select the block. Hidden while typing; inside a callout it moves the whole callout.
- Header: breadcrumbs on the left (the page's parents as links, then the page; only the page on small screens); on the right, save status ("Saving…" / "Saved"), undo/redo, Notes, block settings, "⋯" page actions (the same menu as in the tree). No Publish or Save button: pages save as you type (a moment after the last edit, and when you leave the page), like Notion. ⌘S saves at once.
- **Notes:** Tinta's UI on core's note data. Notes on blocks, threads, replies, @mentions, resolve. Notes on selected text come in v1.1. Anyone who can edit can add notes; Viewers don't see them (core requires edit rights). A marker beside each block with open notes shows how many it has; clicking it opens them, and the panel highlights the selected block's threads.
- **Locking (core post locks):** one editor at a time. Others get core's dialog, "Maria is editing this page", with "Take over". Tinta only feeds it the lock of each page it opens; nothing saves while someone else holds it. A read-only view instead of the dialog comes in v1.1.
- **Viewers** get a read-only page (the server's rendered HTML) instead of the editor, and no New page button.
- **History:** postponed to v1.1. Core keeps saving revisions as snapshots: at most one per author every 10 minutes, the last 10 kept (configurable).
- **Images:** core uploads and media library. WP 7.1 processes images in the browser (HEIC included); Tinta's screen turns this on the same way core's editor does.

### 4.5 Command palette (⌘K)
Core's command palette, extended with Tinta commands: search pages by title (with breadcrumb), New page, New subpage here, Pin/Unpin, Open trash, Workspace settings, Toggle sidebar.

### 4.6 Page icons
- Emoji only, rendered by the OS. No emoji library.
- Small custom picker: curated grid by category, filter box, recently used, and a "Use system picker" hint (⌃⌘Space / Win+.). Target: under 5 KB gzipped.

### 4.7 Trash
- Moving a page to trash moves its whole subtree; the confirmation says how many pages.
- Trash lists the pages people trashed (their subpages come along). Restore puts the page back where it was, as private, with the subpages trashed along with it; a page whose parent is gone goes to the top level. A subpage trashed on its own earlier stays in the trash.
- Trash empties itself after 30 days (core `EMPTY_TRASH_DAYS`, same as Notion). Admins can empty it sooner.

### 4.8 Pinned & recent
Per user and per site (multisite-safe): pinned (ordered), recent (last 5), tree expand state and recently used emojis — stored together in one user option.

### 4.9 Workspace settings (admins)
- Workspace mode on/off.
- Name and icon — core Site Title and Site Icon, edited in place.
- Revisions to keep (default 10).
- Default role for new users (Member or Viewer), plus a link to core Users → Add New for invites.
- No accent-color setting: colors come from each user's admin color scheme (§4.11).

### 4.10 Roles & permissions

| Role | Read | Create / edit any page | Trash / restore | Notes | Empty trash | Settings |
|---|---|---|---|---|---|---|
| Administrator | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Member (`tinta_member`) | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Viewer (`tinta_viewer`) | ✓ | ✗ | ✗ | ✗ (core rule) | ✗ | ✗ |
| Any other role | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

- Custom capabilities on the CPT, plus `tinta_access` (enter the workspace) and `tinta_manage` (settings). Added to Administrator on activation; removed on uninstall.
- Viewers read pages through core's `read_private_tinta_docs`. Members also get `publish_tinta_docs` (WordPress requires it to set any status, even `private`) and core's `upload_files` (images in pages).
- Members edit every page (small-team wiki; no per-page permissions in the MVP).
- Existing Editors/Authors get nothing automatically; an admin switches them to Member.
- Guests (who see only shared pages) come later (ROADMAP v1.3).

### 4.11 Themes (admin color schemes)
- Tinta's colors come from the user's own admin color scheme (Users → Profile). Pick "Ocean" in your profile and your workspace turns Ocean: the sidebar wears the scheme (the shade core gives an open menu's items, so it reads apart from the admin menu beside it, and the menu's current-item colors), and the accent comes from `--wp-admin-theme-color`.
- Tinta adds one scheme with `wp_admin_css_color()`: **Tinta Light** — a light menu with dark text, WordPress blue for actions, and a blue tint on the current item (the prototype's palette). It styles the rest of wp-admin too. People who join while workspace mode is on get it; anyone can pick another in their profile.
- Under Tinta Light and schemes added by plugins, the sidebar stays light, with the scheme's accent tinting the open page.
- **Tinta Dark** is postponed: core's editor UI (block toolbar, inspector, inserter) doesn't follow a dark scheme.

### 4.12 Setup wizard
Opens on an administrator's first visit; "Skip for now" (or closing it) marks setup as done. Workspace settings → "Run setup again" reopens it. Choices save at the end through core's settings, and the screen reloads.
1. Welcome — what Tinta does.
2. Name & icon (core Site Title / Site Icon, picked from the media library). The sidebar header shows the icon, or the name's first letter.
3. Plugin check (only when one is active) — active plugins known to conflict, with why, and a link to the Plugins screen. The list lives in `Workspace\Conflicts` (translatable reasons), updated each release. Tinta never deactivates plugins (wp.org rule).
4. People — the role new people get (suggests Member); link to invite people.
5. Sample content — a "Welcome" page with a "Getting started" page inside it (on by default when the workspace has no pages).
6. Workspace mode on or off → Finish opens the Welcome page.

### 4.13 Internationalization
- English source strings, text domain `tinta`. Translations come only from translate.wordpress.org (GlotPress); pt_BR from day one (we request PTE rights). No bundled `.mo` files, no `load_plugin_textdomain()`.
- JS strings via `wp_set_script_translations()`.

### 4.14 Mobile
- At wp-admin's mobile breakpoint (782 px and below) the sidebar becomes a slide-out drawer, opened from a menu button in the page header. It closes on Escape, a tap outside, or when a page opens.
- Notes and block settings cover the page instead of sitting beside it; the header buttons close them.

### 4.15 Sharing — ships in v1.1, designed now
- **Share to web** (page menu → Share) makes the page **and every page under it** public (`publish`). Turning it off makes them all private again.
- New subpages of a shared page are public too. Moving a page into a shared section makes it public; moving it out makes it private. Tinta warns before either.
- Public pages show a globe in the tree and a "Public" chip in the page header.
- Each public page has a read-only URL that works for logged-out visitors, rendered by Tinta's own minimal template (not the theme). Workspace mode lets these URLs through; the REST API still requires login.
- Search engines: `noindex` by default. "Let search engines find this page" on the shared page turns indexing on for it and its subpages.
- A page link on a public page that points to a private page shows "Private page", with no title and no link. Notes are never shown publicly.
- Members and Admins can share. Admins can turn sharing off for the whole workspace ("Allow public pages"; off until an admin turns it on).
- To decide in v1.1: URL shape — `/p/{id}-{slug}` or the page path (which would expose private parents' slugs).

## 5. Out of scope for MVP

Push back if these creep in:
- Databases, boards, calendars, custom properties, tags.
- Real-time co-editing (core's isn't expected before 2027).
- Per-page permissions, guests. Public sharing ships in v1.1 (§4.15).
- Cover images, page templates, duplication, bulk actions, workspace-wide pins.
- Import/export beyond WordPress's exporter (v1.1).
- History, notes on selected text, and a read-only view for locked pages (v1.1). Tinta Dark (later).
- AI features (Abilities/MCP in v1.1).
- Security hardening, 2FA, login branding (other plugins).
- Browser extension, native apps, webhooks, Zapier.
- More than one workspace per site.

## 6. Open questions

- **GitHub repo.** Local git for now; a GitHub repo is needed before the first public release (PRs, CI, and the source link wp.org asks for).

## 7. Decision log

### 2026-11-02 — review against WordPress 7.1

| Topic | May 2026 | Now | Why |
|---|---|---|---|
| Minimum versions | WP 6.7, PHP 8.1 | WP 7.1 (latest), PHP 8.2 | 7.x brings Notes, inline notes, visual revisions; PHP 8.2+ is 67% of sites |
| Principle | — | Core first | 7.x ships much of what we planned to build |
| Comments & mentions | v1.2 | MVP, via core Notes | Shipped in 6.9 / 7.1 |
| Locking | Own transient lock | Core post locks | Core already has it, including take-over |
| History | Custom diff viewer in v1.1 | Core visual revisions | Shipped in 7.0 |
| Quick switcher | Out of scope | MVP, via core command palette | Core palette is on every admin screen |
| Front-end libraries | Zustand, TanStack Query, lucide | `@wordpress/data`, `core-data`, `@wordpress/icons` | Same tools as the editor; less to ship |
| Theming | Accent-color setting | Admin color schemes + Tinta Light/Dark | Core first; per user |
| Setup wizard | Deactivated plugins, disabled comments, hardening | Warns only; nothing on activation | wp.org forbids changing other plugins; Notes need comments; hardening is out of scope |
| Security hardening, login restyle | MVP | Removed | Focus on the workspace |
| Logged-out visitors | "Private workspace" page | Redirect to login | Less code, same result |
| Roles | Default WP roles | Administrator / Member / Viewer | Clear wiki permissions |
| Tree loading | Lazy past depth 2 | One cached skeleton | Small payload; instant expand |
| Caching | Object cache everywhere, ETags | Shared expensive reads only; transient fallback; Heartbeat freshness | Signed-in users get fresh data |
| REST | 17 custom endpoints | Core endpoints + ~2 custom | Core first |
| Trash | Never auto-empties | 30 days (core) | Core default; same as Notion |
| Page status | Published | Always `private` | WordPress then enforces privacy everywhere; sharing becomes a status change |
| Public sharing | Out of scope | v1.1: page + subpages, `noindex` by default | Requested; MVP data already fits |
| Coding standards | WPCS security rules only | Full WPCS + VIP | Must pass every WordPress standard |

### 2026-11-03 — editor spike

| Topic | Before | Now | Why |
|---|---|---|---|
| Editor host | B or C, by spike | B: Tinta's own screen | Page switch 16–46 ms vs 650–850 ms in C; the app must feel instant |
| Notes | Core Notes UI | Tinta's UI on core's data: block notes in the MVP, selected text in v1.1 | Core's Notes UI is private outside its post editor |
| History | Core visual revisions | v1.1 (revisions still saved) | Private outside core's post editor; keeps the MVP small |
| Locking | Core locks with a read-only view | Core lock dialog in the MVP; read-only view in v1.1 | The dialog is public; the read-only view needs Tinta UI |
| Tinta Dark | MVP | Postponed | Core's editor UI doesn't follow a dark scheme |
| Saving | Autosave + ⌘S | Continuous, like Notion; revisions throttled to one per author per 10 min | Feels like an app; saving every second would flush history |
| PHP tests | PHPUnit 11 with WordPress stubs + PHPUnit 9.6 on core's suite | One suite: PHPUnit 9.6 on core's suite (wp-env); e2e on Playground | Standard tools contributors know (principle 8) |
