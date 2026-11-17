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

1. In WordPress, go to **Plugins → Add New Plugin**, search for "Tinta" and install it ([Tinta on wordpress.org](https://wordpress.org/plugins/tinta/)). Or download `tinta.zip` from the [latest release](https://github.com/jovtrc/tinta/releases/latest) and add it with **Upload Plugin**.
2. Activate it. The setup wizard opens right away and walks you through naming the workspace, choosing who new people are, adding sample pages, and workspace mode.

## Privacy

Every page is private: only people with a Tinta role (and administrators) can read them. Tinta stores everything in your own WordPress database and sends no data anywhere. Files added to pages go to the media library like any upload: Tinta hides them from other roles, but anyone with a file's link can open it.

## Development

You need Node 24 with pnpm, PHP 8.2 with Composer, and Docker for the PHP tests. [CONTRIBUTING.md](docs/CONTRIBUTING.md) covers setup, checks and pull requests; AI coding agents read [AGENTS.md](AGENTS.md).

[PLAN.md](docs/PLAN.md) describes what Tinta does and why, [ARCHITECTURE.md](docs/ARCHITECTURE.md) how it's built (including how releases are made), and the [milestones](https://github.com/jovtrc/tinta/milestones) what comes next.

## Contributing

Bug reports, fixes and translations are welcome: see [CONTRIBUTING.md](docs/CONTRIBUTING.md). Report security problems privately, as [SECURITY.md](docs/SECURITY.md) explains.

## License

[GPL-2.0-or-later](LICENSE).
