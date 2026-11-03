/**
 * E2E tests on WordPress Playground: the @wordpress/scripts Playwright config,
 * with Playground (`pnpm playground`) as the web server instead of wp-env.
 *
 * The URL is set, not defaulted: `wp-scripts test-playwright` sets WP_BASE_URL
 * from .wp-env.json, which would run the tests (and their cleanup) on the dev site.
 */
process.env.WP_BASE_URL = 'http://127.0.0.1:9400';

const { defineConfig } = require( '@playwright/test' );
const baseConfig = require( '@wordpress/scripts/config/playwright.config.js' );

module.exports = defineConfig( {
	...baseConfig,
	testDir: './tests/e2e',
	// Playground runs about 2.5 times slower on CI runners than on a laptop.
	expect: { timeout: process.env.CI ? 30_000 : 5_000 },
	use: {
		...baseConfig.use,
		actionTimeout: process.env.CI ? 20_000 : 10_000,
	},
	webServer: {
		...baseConfig.webServer,
		command: 'pnpm playground',
		port: 9400,
		reuseExistingServer: ! process.env.CI,
	},
} );
