/**
 * Page link block: registration.
 */
import { registerBlockType } from '@wordpress/blocks';

import metadata from './block.json';
import { Edit } from './edit';
import './style.scss';

registerBlockType( metadata.name, {
	...( metadata as object ),
	icon: 'media-document',
	edit: Edit,
	save: () => null,
} as never );
