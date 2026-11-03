/**
 * Callout block: registration.
 */
import { registerBlockType } from '@wordpress/blocks';

import metadata from './block.json';
import { Edit } from './edit';
import { save } from './save';
import './style.scss';

registerBlockType( metadata.name, {
	...( metadata as object ),
	icon: 'info-outline',
	edit: Edit,
	save,
} as never );
