/**
 * E2E tests on WordPress Playground: the @wordpress/scripts Playwright config,
 * with Playground (`pnpm playground`) as the web server instead of wp-env.
 */
process.env.WP_BASE_URL ??= 'http://127.0.0.1:9400';

const { defineConfig } = require( '@playwright/test' );
const baseConfig = require( '@wordpress/scripts/config/playwright.config.js' );

module.exports = defineConfig( {
	...baseConfig,
	testDir: './tests/e2e',
	webServer: {
		...baseConfig.webServer,
		command: 'pnpm playground',
		port: 9400,
		reuseExistingServer: ! process.env.CI,
	},
} );
