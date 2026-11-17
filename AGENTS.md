# AGENTS.md

Instructions for AI coding agents working on Tinta. People contributing by hand: see [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).

## The project

Tinta – Team Wiki is a WordPress plugin (WordPress 7.1+, PHP 8.2+): a private team wiki where pages (`tinta_doc` posts) nest inside pages, written in the block editor on Tinta's own admin screen.

- PHP in `includes/` (namespace `Tinta\`, `class-*.php`, Composer classmap). TypeScript in `src/` (React through `@wordpress/element`). Blocks in `src/blocks/`.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) has the modules, data layout, REST routes, caching, CI and release. Read it before changing any of them.
- [docs/PLAN.md](docs/PLAN.md) has the product scope and what's deliberately left out.
- Work is tracked in [GitHub issues](https://github.com/jovtrc/tinta/issues), one [milestone](https://github.com/jovtrc/tinta/milestones) per version.

## Commands

```sh
composer install && pnpm install
pnpm build                                   # pnpm start to watch
composer run phpcs && composer run phpstan   # composer run phpcbf fixes formatting
pnpm typecheck && pnpm lint:js && pnpm lint:css
pnpm wp-env:test start && pnpm test:php && pnpm test:php:multisite && pnpm wp-env:test stop
pnpm test:e2e                                # Playwright on Playground (port 9400); --project=chromium for one browser
pnpm screenshots                             # retakes .wordpress-org/screenshot-*.png
```

## Rules

- **Scope.** Do what the issue asks. Features follow the milestones; don't add others.
- **WordPress APIs.** Public APIs only: no private or `__experimental` ones. Prefer core's data and UI over custom code.
- **Standards.** WordPress coding standards with WordPress VIP's (`phpcs.xml.dist`) and PHPStan level 6; errors and warnings both fail. An exception is a `phpcs:ignore` on that line with the reason. The pre-commit hook runs PHPCS on staged files.
- **Style.** Small functions and classes with clear names, simple over clever. A short header docblock on each class and method; no comments inside methods unless the logic needs one.
- **Privacy.** Every page is `private`, and reading one takes a Tinta role. Per-user data is a user option (per site), never plain user meta. [ARCHITECTURE.md](docs/ARCHITECTURE.md) §1 and §3 list the rules.
- **Strings.** English, sentence case, `tinta` text domain, translator comments where placeholders need them.
- **Tests.** Add or update PHP tests for PHP behaviour and e2e tests for workspace flows. Run the checks for what you changed before you finish.
- **Docker.** The wp-env sites are off by default. Start only the one you need (`pnpm wp-env:test start` for PHP tests, `pnpm wp-env start` for the dev site) and stop it when you're done. Check `docker ps` before finishing.
- **Docs.** A change to modules, data, REST routes, CI or the release updates [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) in the same commit.
- **Public repo.** Code and its docs only: no private notes, plans or strategy.
- **Free plugin.** No plans, upsells, billing screens or tracking; Tinta sends no data anywhere.
- **Commits.** Conventional Commits, small and focused; `Fixes #N` closes an issue. No AI co-author trailers or AI attribution in commits or pull requests.
- **Releases.** Don't change versions, push tags or deploy unless asked: a `v*` tag publishes the release on GitHub and wordpress.org. Versions stay at 0.x until 1.0.0.
- **Never commit** `build/`, `vendor/`, `dist/`, `node_modules/` or secrets.
