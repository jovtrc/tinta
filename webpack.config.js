/**
 * The @wordpress/scripts webpack config, with the workspace app as its entry.
 */
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

module.exports = {
	...defaultConfig,
	entry: {
		workspace: './src/app/index.tsx',
	},
};
