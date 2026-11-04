/**
 * The wordpress.org screenshots (`.wordpress-org/screenshot-N.png`), taken in
 * Chrome on the same Playground site as the e2e tests: `pnpm screenshots`.
 */
const { devices } = require( '@playwright/test' );
const config = require( './playwright.config.js' );

module.exports = {
	...config,
	testDir: './tests/screenshots',
	projects: [
		{
			name: 'chromium',
			use: {
				...devices[ 'Desktop Chrome' ],
				viewport: { width: 1440, height: 900 },
				deviceScaleFactor: 2,
			},
		},
	],
};
