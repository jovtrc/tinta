/**
 * The @wordpress/scripts webpack config: blocks found through their block.json,
 * plus the workspace app and the Liber Light admin color scheme.
 */
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

module.exports = {
	...defaultConfig,
	entry: () => ( {
		...defaultConfig.entry(),
		workspace: './src/app/index.tsx',
		'admin-colors/liber-light': './src/admin-colors/liber-light.scss',
	} ),
};
