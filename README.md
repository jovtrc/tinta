<picture>
	<source media="(prefers-color-scheme: dark)" srcset=".github/tinta-logo-dark.svg">
	<img src=".github/tinta-logo.svg" alt="Tinta" width="180">
</picture>

# Tinta – Team Wiki

A private team wiki inside WordPress: pages inside pages, written in the block editor.

**[Try it in WordPress Playground](https://playground.wordpress.net/?blueprint-url=https://raw.githubusercontent.com/jovtrc/tinta/trunk/blueprint.json)**: a temporary site in your browser with the latest release installed. Nothing you do there is kept.

## Features

- Pages inside pages, up to five levels deep, in a sidebar tree you can drag to reorganize.
- The block editor, with a focused set of blocks plus two of Tinta's own: Callout and Page link.
- Saves as you type. One person edits a page at a time; others see who is editing.
- Notes on blocks, with replies, @mentions and resolve.
- Pinned and recent pages, emoji page icons, and ⌘K to find any page. Pages and pins move up and down from their menu too, without dragging.
- Two roles: Members read and write every page, Viewers only read.
- Workspace mode (on by default): everyone lands in the workspace after logging in, and the site becomes private.
- Follows each person's admin color scheme. Works on mobile, in right-to-left languages, and on multisite (each site has its own workspace).

## Requirements

WordPress 7.1 or later and PHP 8.2 or later.

## Install

1. Download `tinta.zip` from the [latest release](https://github.com/jovtrc/tinta/releases/latest).
2. In WordPress, go to **Plugins → Add New Plugin → Upload Plugin** and install it.
3. Activate it. The setup wizard opens right away and walks you through naming the workspace, choosing who new people are, adding sample pages, and workspace mode.

## Privacy

Every page is private: only people with a Tinta role (and administrators) can read them. Tinta stores everything in your own WordPress database and sends no data anywhere. Files added to pages go to the media library like any upload: Tinta hides them from other roles, but anyone with a file's link can open it.

## Development

You need Node 24 with pnpm, PHP 8.2 with Composer, and Docker for [wp-env](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-env/).

```sh
composer install
pnpm install
pnpm build              # or `pnpm start` to rebuild as you edit
pnpm wp-env start       # a dev site at http://localhost:8888 with Tinta active
```

Checks (CI runs all of them):

```sh
composer run phpcs && composer run phpstan
pnpm typecheck && pnpm lint:js && pnpm lint:css
pnpm wp-env:test start && pnpm test:php && pnpm test:php:multisite
pnpm test:e2e           # Playwright on WordPress Playground; --project=firefox or webkit for one browser
```

`pnpm screenshots` fills a sample workspace on Playground and retakes the wordpress.org screenshots in `.wordpress-org/`, which also holds the icon, banners and the Live Preview blueprint.

[PLAN.md](PLAN.md) describes what Tinta does and why, [ARCHITECTURE.md](ARCHITECTURE.md) how it's built (including how releases are made), and [ROADMAP.md](ROADMAP.md) what comes next.

## Contributing

Bug reports and pull requests are welcome in [issues](https://github.com/jovtrc/tinta/issues). Please run the checks above before opening a pull request.

## License

[GPL-2.0-or-later](LICENSE).
