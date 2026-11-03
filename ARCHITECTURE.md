# Liber — Technical Architecture

> Working name. Last reviewed 2026-11-03.

## 1. Topology

- One site = one workspace. No multi-workspace logic inside a site.

**Multisite rules:**
- Per-user data is per site: `get_user_option()` / `update_user_option()` (blog-prefixed keys). Never plain user meta for workspace state — user meta is network-wide.
- Roles and capabilities are per site.
- No network-wide options. Network activation sets up every site, including sites created later (`wp_initialize_site`).
- Site admins don't have `unfiltered_html` on multisite. Everything Liber's blocks save must survive kses, and block comments must stay small (kses strips block comments over ~1 MB for these users).
- Object-cache groups are per site (core prefixes non-global groups with the blog ID).

## 2. Editor host — Liber's own screen (decided 2026-11-03)

The workspace is one admin screen, `admin.php?page=liber&doc=ID`. Liber's React shell mounts the block editor with public `@wordpress/editor` and `@wordpress/block-editor` components and swaps pages in place. The target look is [`prototype/workspace.html`](prototype/workspace.html).

**Why.** The editor spike (branch `spike/editor-host`, `spike/SPIKE.md`) compared this with core's post editor reshaped. Switching pages took 16–46 ms here and 650–850 ms there (a full reload of ~12.5 MB of JS), which slow servers or computers would push to 2–3 s. The workspace has to feel like an app, so speed wins. The price: core's Notes and visual-revisions UI live only inside core's private `Editor` component, so Liber builds those UIs itself on core's data.

**Screen setup (PHP).** On `load-{$hook}`: `get_current_screen()->is_block_editor( true )`, `wp_set_up_cross_origin_isolation()` (turns on 7.1's in-browser image processing). On enqueue: `block_editor_rest_api_preload()`, `get_block_editor_settings()`, `do_action( 'enqueue_block_editor_assets' )`, Heartbeat and media. The root element needs the `block-editor` class: core CSS hides other divs on block-editor screens.

**Editor (JS).** One `EditorProvider` per page, remounted on switch (`key` = page ID), with `BlockCanvas` + `PostTitle` + `BlockList`, `BlockInspector`, the public `Inserter`, undo/redo, `PostSavedState`, `AutosaveMonitor`, `UnsavedChangesWarning`, editor keyboard shortcuts, notices and snackbars. `EditorProvider` uses its own data registry, so editor state isn't in the global `wp.data` stores. No private or `__experimental*` APIs.

**What Liber builds because core's UI is private:**
- **Notes.** Liber's panel on core's data, written exactly as core's own Notes UI writes it: comments with `type: note` (status `hold`; replies via `parent`), threads linked to blocks through `metadata.noteId` (an array), resolve/reopen as core does (thread `approved`/`hold` plus a child note with `_wp_note_status`), mentions as `<span class="wp-note-mention user-N">` chips (core emails mentioned people). Core's UI and Liber's read each other's notes. "Add note" sits in every block's toolbar (`editor.BlockEdit` filter); the panel shares the right side with block settings. People to mention come from `liber/v1/people` (core's user list shows non-admins only authors of published posts). Core's comments route also wants `edit_posts` to list notes by type and status; `Liber\Docs\Notes_Access` grants it for that one request, on pages the user can edit. Notes on selected text come after the MVP.
- **Locks per page.** Core's `PostLockedModal` reads the lock from editor settings, which PHP computes for the first page only. A small route takes and reports the lock for each page Liber opens (in parallel with loading the page), and Liber releases the lock of the page it leaves. The dialog mounts after the editor stored the lock, since it reads it once. A 403 from the route means the user can't edit: they get a reader (`content.rendered`, view context) instead of the editor. A read-only view for the second editor comes after the MVP.
- **Page layout in the canvas.** Content width and spacing through editor styles (core's layout wrappers are private).

**Postponed:** History (core still saves revisions), Liber Dark (core's editor UI doesn't follow a dark scheme), List View (only `__experimentalListView`).

## 3. Backend (PHP)

### Stack
- PHP 8.2+, WordPress 7.1+.
- Composer with **`classmap`** autoload (WPCS file names, `class-*.php`, don't fit PSR-4). No runtime dependencies yet; the zip ships the `vendor/` autoloader from `composer install --no-dev --optimize-autoloader`. `config.platform.php` pinned to 8.2.
- Modern PHP where WPCS allows it: typed properties, enums, readonly, `match`, first-class callables. Braces always; no alternative syntax.
- Naming per the WordPress handbook: namespace `Liber\…` (parts in Capitalized_Words), classes like `Tree_Controller`, files like `class-tree-controller.php`, functions/methods/variables in `snake_case`, hooks `liber_*`.

### Modules

| Class | File | Job |
|---|---|---|
| `Liber\Plugin` | `includes/class-plugin.php` | Bootstrap; wires hooks on `plugins_loaded` |
| `Liber\Setup\Installer`, `Uninstaller` | `includes/setup/` | Roles and caps per site (on activation, new network sites and upgrades); on delete, removes roles, caps, settings, the cached tree and people's preferences on every site — pages stay |
| `Liber\Setup\Wizard` | `includes/setup/class-wizard.php` | Wizard state, sample content |
| `Liber\Docs\Post_Type` | `includes/docs/class-post-type.php` | CPT, `_liber_icon` meta, depth check, revisions cap |
| `Liber\Docs\Private_Status` | `includes/docs/class-private-status.php` | Every page `private`; no "Private:" title prefix; trash restores to `private` |
| `Liber\Docs\Subtree_Trash` | `includes/docs/class-subtree-trash.php` | Cascade trash (`_liber_trashed_with`), restore and delete; only admins delete for good |
| `Liber\Rest\Restore_Controller` | `includes/rest/class-restore-controller.php` | `POST liber/v1/docs/{id}/restore` |
| `Liber\Docs\Last_Editor` | `includes/docs/class-last-editor.php` | Records `_edit_last` on title, content or icon changes (core sets it only on classic screens); `last_editor` REST field |
| `Liber\Docs\Revisions` | `includes/docs/class-revisions.php` | Revision snapshots (one per author per 10 min), 10 kept |
| `Liber\Docs\Tree` | `includes/docs/class-tree.php` | Tree skeleton query, cache and invalidation |
| `Liber\Roles\Roles` | `includes/roles/class-roles.php` | Member and Viewer roles, caps |
| `Liber\Workspace\Screen` | `includes/workspace/class-screen.php` | Workspace screen: block-editor setup, preloads, assets (§2); page edit/preview links and core's page screens lead to it |
| `Liber\Workspace\Settings` | `includes/workspace/class-settings.php` | `liber_settings` and core's `default_role` in `wp/v2/settings` |
| `Liber\Workspace\Mode` | `includes/workspace/class-mode.php` | Workspace mode: login landing, `liber-workspace-mode` body class (the screen hides admin menu and toolbar), keeps Members and Viewers in the workspace |
| `Liber\Workspace\Private_Site` | `includes/workspace/class-private-site.php` | Workspace mode: logged-out visitors to the login screen (feeds and archives included), REST asks for a login, sitemaps off |
| `Liber\Workspace\Color_Schemes` | `includes/workspace/class-color-schemes.php` | Liber Light (Liber Dark postponed) |
| `Liber\Rest\Tree_Controller` | `includes/rest/class-tree-controller.php` | `GET liber/v1/tree` |
| `Liber\Rest\People_Controller` | `includes/rest/class-people-controller.php` | `GET liber/v1/people` (who can be mentioned) |
| `Liber\Docs\Notes_Access` | `includes/docs/class-notes-access.php` | Grants `edit_posts` while listing notes of pages the user can edit |
| `Liber\Rest\Move_Controller` | `includes/rest/class-move-controller.php` | `POST liber/v1/docs/{id}/move` |
| `Liber\Docs\Mover` | `includes/docs/class-mover.php` | Move checks (cycles, depth) and sibling renumbering; only `post_parent`/`menu_order` change |
| `Liber\Rest\Lock_Controller` | `includes/rest/class-lock-controller.php` | `POST`/`DELETE liber/v1/docs/{id}/lock` |
| `Liber\Rest\User_Prefs_Field` | `includes/rest/class-user-prefs-field.php` | `liber_prefs` field on `wp/v2/users/me` |
| `Liber\Blocks\Allowlist` | `includes/blocks/class-allowlist.php` | `allowed_block_types_all` for `liber_doc` |
| `Liber\Blocks\Registry` | `includes/blocks/class-registry.php` | Registers blocks from the build manifest |
| `Liber\Cache\Cache` | `includes/cache/class-cache.php` | Object cache, or transients as fallback |
| `Liber\Cache\Tree_Pulse` | `includes/cache/class-tree-pulse.php` | Tree generation over Heartbeat |
| `Liber\Sharing\Share` (v1.1) | `includes/sharing/class-share.php` | Share/unshare a subtree; inherit on create and move |
| `Liber\Sharing\Public_View` (v1.1) | `includes/sharing/class-public-view.php` | Public URL, minimal template, `noindex` |

No custom tables.

### Data layout

| Storage | Key | Purpose |
|---|---|---|
| `posts` | `post_type = liber_doc` | Pages: `private` (always), `publish` (shared, v1.1), `trash` |
| `posts` | `post_parent`, `menu_order` | Tree and sibling order |
| `postmeta` | `_liber_icon` | Page emoji |
| `postmeta` | `_liber_share_root`, `_liber_indexable` (v1.1) | The page sharing was turned on from; search-engine opt-in |
| `postmeta` | `_edit_lock`, `_edit_last`, `_wp_trash_meta_*` | Core: locks, last editor (Liber records it on REST saves), trash |
| `postmeta` | `_liber_trashed_with` | Set on subpages trashed along with a page, so they come back with it |
| `comments` | `comment_type = note` | Notes (core's data, Liber's UI) |
| block attributes | `metadata.noteId` | Links a note thread to a block (core's format) |
| user option | `liber_prefs` | `pinned[]`, `recent[5]`, `expanded[]`, `emojis[]` — per user, per site |
| option | `liber_settings` (autoload) | Workspace mode, revisions kept (setup state later); new users' role is core's `default_role` |
| option | `liber_tree_generation` (autoload) | Bumped on every tree change |
| option | `liber_version` | Upgrade routines |
| core options | `blogname`, `site_icon` | Workspace name and icon |
| cache / transient | `liber_tree` | Tree skeleton |

### Privacy: every page is `private` (decided 2026-11-02)
Core only lets users with `read_private_liber_docs` read a private post — in REST, queries, the front end, feeds and search — so WordPress does the gatekeeping. Liber handles the edges:
1. Create every page as `private`, never `draft` or `publish` (only Share sets `publish`, v1.1).
2. Drop the "Private:" title prefix for `liber_doc` (`private_title_format`).
3. Restore from trash as `private` (core restores to `draft` since 5.6; filter `wp_untrash_post_status`).
4. Setting any status needs `publish_liber_docs`, so Members get it.
5. The core REST collection refuses `status=private` to users without `edit_liber_docs` (Viewers). The tree endpoint serves everyone, and ⌘K title search runs on the tree. Full-text search for Viewers needs a small route or waits — decide during the build.
6. Tests: logged-out, Viewer, Member, Administrator and other roles, on single site and multisite.

## 4. Caching

### Rules
1. Signed-in users get current data. We cache only expensive reads that every user shares; every write clears them at once; expiry is a safety net.
2. Correctness never depends on the cache being there.

### What's cached
- **Tree skeleton** (`liber_tree`): one entry for the whole tree. That's all for the MVP.
- Not cached by Liber: single pages (core REST + editor), user prefs (one user option, already in WP's meta cache), Notes, search.

### Where
- `wp_using_ext_object_cache()` → `wp_cache_get()` / `wp_cache_set()`, group `liber`.
- Otherwise → transients. Core deletes expired transients daily (`delete_expired_transients` cron, scheduled from wp-admin), so Liber needs no cron.
- Telling a miss from a cached empty value: `wp_cache_get( $key, $group, false, $found )`; transients store `array( 'value' => … )`.

### Invalidation
- On any tree change: delete `liber_tree` and bump `liber_tree_generation`.
- Tree changes = create, trash, restore, delete, move, and updates that change title, parent, order, status or icon (compared through `post_updated`'s before/after). Content-only saves and autosaves don't touch the tree.

### Freshness across users
- Heartbeat (`heartbeat_received`) returns `liber_tree_generation` when the workspace sends `liber_tree`; the client listens through `wp.hooks` (`heartbeat.send` / `heartbeat.tick`) and refetches the tree only when the number changed. The workspace screen ticks every 15 s (WordPress slows background tabs down). Cost per tick: reading one autoloaded option.
- No ETags. Core already sends no-cache headers on REST responses for signed-in users (`rest_send_nocache_headers`).

### Storage conventions
- JSON strings saved to meta or options go through `wp_slash( wp_json_encode( … ) )` — WordPress unslashes on save.
- Options only admins read are created with autoload off. The first save of a new option fires `add_option_{$name}`, not `update_option_{$name}` — hook both.
- No `posts_per_page => -1`, no `post__not_in`. Internal queries set `no_found_rows` and skip cache priming they don't need.
- Read site-level switches late (`init` or later), never at file load.
- Mark rewrite rules for regeneration instead of flushing mid-request.
- Keep block attributes small (the kses limit in §1).
- Never call our own REST API server-side; controllers and hooks share service classes.

## 5. REST API

### Core endpoints (most of the app)

| Endpoint | Used for |
|---|---|
| `wp/v2/liber-docs` (+ `/autosaves`, `/revisions`) | Page CRUD, autosave, revisions, full-text search (`?search=&status=private`, Members and Admins) |
| `wp/v2/comments?type=note` | Notes and replies |
| `wp/v2/users` | People list, @mentions |
| `wp/v2/users/me` + field `liber_prefs` | Pinned, recent, expanded, emojis |
| `wp/v2/settings` | `liber_settings`, Site Title, Site Icon |
| `wp/v2/media` | Uploads |

### Liber endpoints (`liber/v1`)

| Method | Route | Purpose | Permission |
|---|---|---|---|
| GET | `/tree` | Whole skeleton + generation; cached | `liber_access` |
| GET | `/people` | People who can edit pages: id, name, avatar (for @mentions) | `edit_liber_docs` |
| POST | `/docs/(?P<id>\d+)/move` | New parent + position; depth ≤ 5, no cycles; renumbers siblings in one go | `edit_post` on the page and the new parent |
| POST, DELETE | `/docs/(?P<id>\d+)/lock` | Take the page's lock (or report who holds it) with the nonces `PostLockedModal` needs; release it on leaving | `edit_post` on the page |
| POST | `/docs/(?P<id>\d+)/share` (v1.1) | Share or unshare a page and its subtree | `publish_post` on the page, "Allow public pages" on |
| POST | `/docs/(?P<id>\d+)/restore` | `wp_untrash_post()`, which a `wp/v2` status update skips, so subpages come back too | `delete_post` on the page |

Nesting: `rest_pre_insert_liber_doc` refuses a parent that isn't a page or sits at level 5.

- Plain `WP_REST_Controller` subclasses with full schemas, `args` validation and a `permission_callback`. No route-builder framework — three or four routes don't need one.
- Subtree trash is a hook (`trashed_post`), so core's DELETE does it.

## 6. Frontend (TypeScript)

### Stack
- TypeScript everywhere. `@wordpress/scripts` 37 builds it (Babel strips types), so `tsc` runs as its own step (`pnpm typecheck`). `@wordpress/*` dev dependencies are for types and bundling; at runtime the app uses WordPress's own scripts. `@wordpress/block-editor` and `block-library` declare no types → shims in `src/types/`.
- React 18 via `@wordpress/element` (React 19 isn't in core yet).
- Saving: continuous. `ContinuousSave` calls core-data's `saveEditedEntityRecord` a second after the last edit and when a page closes (no editor "Page updated" notice each time); failures retry with backoff. `Liber\Docs\Revisions` skips a revision when the same author saved one in the last 10 minutes (`wp_save_post_revision_post_has_changed`).
- Data: `@wordpress/data` + `@wordpress/core-data` (entities, undo, saving), plus two small stores: `liber/workspace` (the tree) and `liber/prefs` (pinned, recent, expanded, recently used emoji). Preference changes wait for the stored copy, apply at once and save in the background: one request at a time, always with the latest state; Recent waits 2 s so quick page switches send one request; a waiting save is sent right away (`keepalive`) when the page closes; pages that no longer exist are dropped on save. `EditorProvider` runs on its own registry; stores it doesn't register (the workspace store, notices) fall through to the global one.
- Notices: `InlineNotices` / `SnackbarNotices` from `@wordpress/notices` (core deprecated `EditorNotices` / `EditorSnackbars` in 7.0; they go in 7.2).
- UI: `@wordpress/components`, `@wordpress/icons` (not a script handle in 7.1; wp-scripts bundles it). `@wordpress/ui` isn't registered in 7.1 either; use it only if wp-scripts bundles it cleanly. DataViews (bundled) only if the Trash list needs it.
- Theme: `ThemeProvider` (`wp.theme`, public) seeded from the user's admin color scheme, read in PHP from the registered schemes (`@wordpress/admin-ui` isn't registered in 7.1). Fallback: the `--wp-admin-theme-color` CSS variable. One root provider per document.
- Commands: `@wordpress/commands` (`useCommand`, `useCommandLoader`) in core's palette. The palette renders in its own React root, so page commands open pages by URL (`navigateTo()` pushes `?doc=ID` and fires `popstate`, which the workspace follows like back/forward).
- Drag and drop: `@dnd-kit/core` (pointer sensor, 6 px to start, so clicks still open pages). Like Notion, the top or bottom quarter of a row drops above or below it, the middle drops inside; targets inside the page's own subtree or past level 5 aren't offered. The tree updates at once, then syncs with `liber/v1/docs/{id}/move`. No keyboard dragging yet: a "Move to…" menu item is the planned keyboard path.
- Blocks: `apiVersion: 3`; canvas styles through block.json `style` (the canvas is an iframe; admin body classes don't reach it), also enqueued on the workspace screen for the read-only view. Page link is dynamic (`render.php`), so titles and icons never go stale. Elements inside the canvas use plain buttons and our own CSS: wp-components styles don't reach the iframe, but popovers render in the main document.
- Allowlist: PHP `allowed_block_types_all` for pages; JS keeps headings at H1–H3 (`levelOptions`) and unregisters embed variations other than YouTube, Vimeo and X.
- Routing: `?page=liber&doc=ID` with `history.pushState`; `popstate` reopens the page for back/forward.

### Modules
- `src/app/` — workspace shell: layout, sidebar and page tree, URL routing, page creation.
- `src/app/store/` — `liber/workspace` (the tree and the actions that change it), `liber/prefs` (per-user lists) and `liber/ui` (open dialog, right-click menu, sidebar shown or hidden) stores.
- `src/app/commands.tsx` — ⌘K commands.
- `src/app/dialogs.tsx` — renders the open dialog (rename, move, move to trash, trash, settings), whichever menu or command opened it.
- `src/app/sidebar/page-menu.tsx` — the page menu, shared by the tree's "⋯", the page header's "⋯" and right click.
- `src/app/sidebar/use-sidebar.ts`, `sidebar-toggle.tsx`, `drawer.tsx` — the sidebar shown or hidden on wide screens, a drawer on small ones (`useViewportMatch( 'medium', '<' )`), and the button pages put in their header to bring it back.
- `src/app/theme/` — color scheme → `ThemeProvider`.
- `src/editor/` — page header (icon picker with a curated emoji list, title, "Edited by"), and the open page: `OpenPage` picks `PageEditor` (`EditorProvider` per page, header, canvas, one side panel at a time — Blocks, Notes or block settings —, lock dialog, continuous save) or `PageView` (read-only). `EditorProvider` gives each page its own `core/editor` and `core/block-editor` stores, so anything that reads them (like which panel is open) renders inside it. The Blocks panel is Liber's own, built on the public `getInserterItems` selector: core's block library component is `__experimental` and its lint rule forbids it. Callout's `__experimentalOnEnter` support flag is the one experimental key Liber uses; without it, Enter would simply stay inside the callout.
- `src/notes/` — Notes: panel, thread cards, composer with @mentions, block toolbar button, markers beside blocks (a layer inside the canvas, placed from the blocks' positions), `liber/notes` UI store.
- `src/types/` — type shims.
- `src/blocks/page-link/`, `src/blocks/callout/`.

## 7. Build & tooling

### Coding standards
- **PHP:** PHPCS with the stock `WordPress` standard (Core + Docs + Extra), `WordPress-VIP-Go` and `PHPCompatibilityWP` (`testVersion 8.2-`, `minimum_wp_version 7.1`). Severity 1; errors **and** warnings fail. `phpcbf` formats with the same ruleset (tabs, Yoda conditions, WordPress spacing).
  - An exception is a `phpcs:ignore` on that line, with the reason. No blanket exclusions.
  - When a VIP sniff points to a VIP-only helper (`wpcom_vip_*`), use the core function with caching and say why inline.
- **PHP static analysis:** PHPStan level 6 with `szepeviktor/phpstan-wordpress`.
- **JS/TS:** `@wordpress/eslint-plugin` (recommended + TypeScript), `@wordpress/stylelint-config`, Prettier with `@wordpress/prettier-config`. (camelCase is the WordPress *JavaScript* standard.)
- **Pre-commit:** `brainmaestro/composer-git-hooks` runs `composer run phpcs:staged` on staged PHP files. The script reads the ruleset's exclude patterns and passes them as `--ignore`, because PHPCS skips them for explicit file lists. Plus lint-staged for TS.

### Code style
- Clean Code: small functions and classes with clear names; simple and concise over clever.
- Each class and method gets a short header docblock: a one-line summary plus the tags WPCS requires.
- No comments inside methods unless the logic is complex enough to need one.

### Tests
- **PHP:** WordPress's own test suite (`WP_UnitTestCase`) with PHPUnit 9.6 + `yoast/phpunit-polyfills` — the setup core and most plugins use (core's suite doesn't run on newer PHPUnit). Runs in a separate wp-env (`.wp-env.test.json`, port 8889), because the suite wipes its database; single site and multisite (`WP_MULTISITE=1`). Strict config: fail on warnings, risky tests and deprecations.
- **JS unit:** Vitest (wp-scripts default since v36).
- **E2E:** Playwright via `wp-scripts test-playwright` against WordPress Playground (`@wp-playground/cli`), started from a blueprint: no Docker, a fresh site per run.

### Build
- pnpm (one package, no turbo). `pnpm-workspace.yaml` holds pnpm 11's build-script approvals.
- `wp-scripts build` with `webpack.config.js` adding the workspace entry → `build/workspace.{js,css,asset.php}`; asset versions and script dependencies come from the `.asset.php` file. Blocks (`src/blocks/*/block.json`) build to `build/blocks/` with `--blocks-manifest`; PHP registers them all with `wp_register_block_types_from_metadata_collection()`. PHP tests need a build first (block registration reads it).
- `prettier` is aliased to `wp-prettier` (WordPress formatting); plain Prettier would undo it.

### CI (GitHub Actions)
- PHP 8.2 and 8.5 × WP 7.1, latest and trunk (trunk may fail) × single site and multisite.
- Jobs: phpcs, phpstan, PHP unit + integration, tsc, eslint, vitest, e2e (latest WP only), build, Plugin Check (`wordpress/plugin-check-action`), `.pot` generation.

### Release
- Tag → `composer install --no-dev --optimize-autoloader` → `pnpm build` → zip using `.distignore` (drops `bin/`, `CLAUDE.md`, `.claude/`, `.github/`, `tests/`, `node_modules/`, `prototype/`, planning docs, configs) → Plugin Check → SVN deploy with `10up/action-wordpress-plugin-deploy`.
- `readme.txt` links the public repo for the TypeScript sources (guideline 4).
- wp.org holds each release ~6 h for an automated security review.

### Local development
```sh
composer install                  # dev tools + pre-commit hook
pnpm install
pnpm build                        # or: pnpm start (watch)
pnpm wp-env start                 # dev site, http://localhost:8888
pnpm wp-env:test start            # PHPUnit site, http://localhost:8889
composer run phpcs                # also: phpcbf, phpstan
pnpm typecheck && pnpm lint:js && pnpm lint:css
pnpm test:php                     # and test:php:multisite
pnpm test:e2e                     # starts Playground on :9400 (pnpm playground)
```
`pnpm env` is a built-in pnpm command, hence the `wp-env` script names.

### Git
- Default branch: `trunk`.
- Conventional Commits; small commits; small PRs (stack bigger changes).
- No AI co-author trailers or AI attribution in commits or PRs.

## 8. Repo layout

```
liber/
├── .github/workflows/
├── liber.php                    Plugin header, Composer autoload, bootstrap
├── uninstall.php
├── bin/                         Dev scripts (pre-commit PHPCS)
├── readme.txt
├── composer.json                classmap autoload, dev tools, platform php 8.2
├── package.json, pnpm-lock.yaml, pnpm-workspace.yaml
├── tsconfig.json, webpack.config.js, playwright.config.js
├── phpcs.xml.dist, phpstan.neon.dist, phpunit.xml.dist
├── vitest.config.ts
├── .wp-env.json, .wp-env.test.json
├── .distignore
├── includes/                    PHP, class-*.php
│   ├── class-plugin.php
│   └── blocks/ cache/ docs/ rest/ roles/ setup/ sharing/ workspace/
├── src/                         TypeScript
│   └── app/ editor/ notes/ blocks/ types/
├── data/conflicting-plugins.json
├── tests/
│   ├── php/                     WP test suite, PHPUnit 9.6
│   ├── e2e/                     Playwright on Playground
│   └── js/                      Vitest
├── prototype/workspace.html     Static layout prototype
├── build/                       Generated, gitignored
└── PLAN.md, ARCHITECTURE.md, ROADMAP.md
```

## 9. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Pages leak to logged-out users or non-members | Low | High | Every page `private` (§3) + REST login requirement; tests for every role and logged-out |
| Sharing exposes a page someone meant to keep private (v1.1) | Med | High | Warn before moving a page into a shared section; globe markers; admin switch; private page links render without titles |
| Uploaded files have public URLs | High | Med | Said plainly in the readme |
| Editor host breaks on a WP update | Med | High | Public editor components only; CI against WP trunk |
| Core keeps editor features private (Notes UI, visual revisions, List View) | High | Med | Liber's UI on core's data; switch to core's UI if `Editor` becomes public (`@wordpress/lazy-editor` hints at it) |
| Notes stop working (another plugin disables comments or removes the route) | Med | Med | Never disable comments; such plugins go on the conflict list |
| Liber's notes drift from core's note format | Low | Med | Same storage as core (`note` comments, `metadata.noteId`, status and `_wp_note_status`); PHP and e2e tests on the data |
| Core changes who may list notes | Med | Med | The `edit_posts` grant is scoped to one request; a PHP test fails if Members can't list notes |
| Core real-time collaboration arrives with different assumptions | Low | Med | Stay on core locks and Notes so it can be switched on later (`wp_is_post_type_collaboration_disabled`) |
| Design System packages (`@wordpress/theme`, `ui`, `admin-ui`) change | Med | Low | Fallback to `--wp-admin-theme-color` |
| Multisite admins lack `unfiltered_html` | High | Med | kses-safe blocks; tests as a non-super-admin |
| Plugin conflicts | High | Med | Wizard warns; docs |
| wp.org review rejects a behaviour | Low | High | Opt-in and reversible; Plugin Check in CI |
| No persistent object cache | High | Low | Transient fallback; correctness doesn't depend on it |
| Tree too big for one request (5k+ pages) | Low | Med | ~100 bytes per page; add lazy children or virtualization if needed |
