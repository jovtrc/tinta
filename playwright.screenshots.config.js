/**
 * The wordpress.org screenshots (`.wordpress-org/screenshot-N.png`, and
 * `screenshot-N-pt_BR.png` for Brazilian Portuguese), taken in Chrome on a
 * Playground site like the e2e tests' one (`pnpm playground`, with its own
 * blueprint that also installs WordPress's pt_BR language pack):
 * `pnpm screenshots` (`--project=pt_BR` for one locale).
 *
 * TINTA_L10N_DIR mounts a folder of Tinta translation files (tinta-pt_BR.mo and
 * its .json files) as the site's plugin translations, to take the pt_BR
 * screenshots before wordpress.org has a language pack for Tinta.
 */
const { devices } = require( '@playwright/test' );
const config = require( './playwright.config.js' );

const l10n = process.env.TINTA_L10N_DIR;
const use = {
	...devices[ 'Desktop Chrome' ],
	viewport: { width: 1440, height: 900 },
	deviceScaleFactor: 2,
};

module.exports = {
	...config,
	testDir: './tests/screenshots',
	webServer: {
		...config.webServer,
		command: [
			'pnpm exec wp-playground-cli server --port=9400 --wp=7.1 --php=8.2',
			'--mount=.:/wordpress/wp-content/plugins/tinta',
			'--blueprint=tests/screenshots/blueprint.json',
			l10n && `--mount=${ l10n }:/wordpress/wp-content/languages/plugins`,
		]
			.filter( Boolean )
			.join( ' ' ),
	},
	projects: [
		{ name: 'en', use, metadata: { locale: 'en' } },
		{ name: 'pt_BR', use, metadata: { locale: 'pt_BR' } },
	],
};
