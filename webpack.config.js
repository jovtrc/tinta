/**
 * The @wordpress/scripts webpack config: blocks found through their block.json,
 * plus the workspace app.
 */
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

module.exports = {
	...defaultConfig,
	entry: () => ( {
		...defaultConfig.entry(),
		workspace: './src/app/index.tsx',
	} ),
};
