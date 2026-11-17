# Contributing to Tinta

Thanks for helping. Tinta is a private team wiki inside WordPress, free software under GPL-2.0-or-later. [PLAN.md](PLAN.md) explains what it does and why, and [ARCHITECTURE.md](ARCHITECTURE.md) how it's built.

## Ways to help

- **Report a bug** with the [bug report form](https://github.com/jovtrc/tinta/issues/new/choose). Include your WordPress, PHP and browser versions and the steps that show the problem.
- **Fix an issue.** Issues labelled [good first issue](https://github.com/jovtrc/tinta/labels/good%20first%20issue) are a good start. Comment on the issue before starting something bigger, so we can agree on the approach.
- **Translate Tinta** on [translate.wordpress.org](https://translate.wordpress.org/projects/wp-plugins/tinta/). Translations don't go through pull requests.
- **Report a security problem privately**, as [SECURITY.md](SECURITY.md) explains. Never in a public issue.

New features follow the [milestones](https://github.com/jovtrc/tinta/milestones). To suggest one, open an issue first. Tinta stays free: no plans, upsells, billing screens or tracking, and it sends no data anywhere.

## Set up

You need Node 24 with pnpm, PHP 8.2 with Composer, and Docker for [wp-env](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-env/).

```sh
composer install        # dev tools and the pre-commit hook
pnpm install
pnpm build              # or `pnpm start` to rebuild as you edit
pnpm wp-env start       # a dev site at http://localhost:8888 with Tinta active (wp-env's default admin login)
pnpm wp-env stop        # when you're done
```

`pnpm env` is a built-in pnpm command, hence the `wp-env` script names.

## Checks

Run these before opening a pull request:

```sh
composer run phpcs && composer run phpstan     # composer run phpcbf fixes formatting
pnpm typecheck && pnpm lint:js && pnpm lint:css
pnpm wp-env:test start && pnpm test:php && pnpm test:php:multisite && pnpm wp-env:test stop
pnpm test:e2e                                  # Playwright on WordPress Playground; --project=firefox or webkit for one browser
```

The PHP tests run on their own wp-env site (port 8889), because WordPress's test suite wipes the database it runs on. The e2e tests start Playground themselves, with no Docker. CI runs everything except the e2e tests on each pull request; the e2e tests run on releases and every week.

`pnpm screenshots` retakes the wordpress.org screenshots in `.wordpress-org/`.

## Code

- **PHP** follows the WordPress coding standards, including WordPress VIP's (`phpcs.xml.dist`), and PHPStan level 6. Errors and warnings both fail. An exception is a `phpcs:ignore` on that line, with the reason.
- **Front end** is TypeScript, built with `@wordpress/scripts`, on public WordPress APIs only: no private or `__experimental` APIs.
- **Style:** small functions and classes with clear names, simple over clever. Each class and method gets a short header docblock; no comments inside methods unless the logic needs one.
- **Strings** are in English, sentence case, with the `tinta` text domain.
- **Every page is private**, and multisite keeps per-user data per site. [ARCHITECTURE.md](ARCHITECTURE.md) §1 and §3 list the rules.
- **Accessibility:** everything works with a keyboard and has a name screen readers can read.
- **Tests:** PHP tests for PHP behaviour, e2e tests for flows in the workspace.
- **Docs:** a change to modules, data or REST routes updates [ARCHITECTURE.md](ARCHITECTURE.md) in the same pull request.

## Commits and pull requests

- Branch from `trunk` and open the pull request against `trunk`. Keep it small and about one thing.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) (`fix: keep the tree open after a move`), and `Fixes #123` closes the issue.
- For changes people can see, add a screenshot to the pull request.

By contributing, you agree that your work is released under [GPL-2.0-or-later](../LICENSE).
