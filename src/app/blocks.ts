/**
 * Core blocks as pages use them: headings H1–H3, and embeds from a few providers.
 * PHP limits which blocks the editor offers (`Tinta\Blocks\Allowlist`).
 */
import { registerCoreBlocks } from '@wordpress/block-library';
import {
	getBlockVariations,
	unregisterBlockVariation,
} from '@wordpress/blocks';
import { addFilter } from '@wordpress/hooks';

const HEADING_LEVELS = [ 1, 2, 3 ];

const EMBED_PROVIDERS = [ 'youtube', 'vimeo', 'twitter' ];

/**
 * Registers core blocks with Tinta's heading levels and embed providers.
 */
export function registerBlocks() {
	addFilter(
		'blocks.registerBlockType',
		'tinta/heading-levels',
		(
			settings: { attributes?: Record< string, object > },
			name: string
		) =>
			name === 'core/heading'
				? {
						...settings,
						attributes: {
							...settings.attributes,
							levelOptions: {
								...settings.attributes?.levelOptions,
								default: HEADING_LEVELS,
							},
						},
					}
				: settings
	);

	registerCoreBlocks();

	for ( const variation of getBlockVariations( 'core/embed' ) ?? [] ) {
		if ( ! EMBED_PROVIDERS.includes( variation.name ) ) {
			unregisterBlockVariation( 'core/embed', variation.name );
		}
	}
}
