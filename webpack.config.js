/**
 * The @wordpress/scripts webpack config: blocks found through their block.json,
 * plus the workspace app and the Tinta Light admin color scheme. Every built
 * JS and CSS file starts with a comment linking its sources.
 */
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

const SOURCE_BANNER =
	'/*! Tinta – Team Wiki. Built from the sources at https://github.com/jovtrc/tinta/tree/trunk/src (see the readme to build them). */';

/**
 * Adds the source banner after minification, so the minifier keeps it.
 */
class SourceBannerPlugin {
	apply( compiler ) {
		const { BannerPlugin, Compilation } = compiler.webpack;

		new BannerPlugin( {
			banner: SOURCE_BANNER,
			raw: true,
			test: /\.(js|css)$/,
			stage: Compilation.PROCESS_ASSETS_STAGE_DEV_TOOLING,
		} ).apply( compiler );
	}
}

module.exports = {
	...defaultConfig,
	entry: () => ( {
		...defaultConfig.entry(),
		workspace: './src/app/index.tsx',
		'admin-colors/tinta-light': './src/admin-colors/tinta-light.scss',
	} ),
	plugins: [ ...defaultConfig.plugins, new SourceBannerPlugin() ],
};
