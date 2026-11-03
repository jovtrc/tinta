/**
 * Choices for "New people join as": Member and Viewer, plus the site's current
 * default role when it's another one, under its own name.
 */
import { __ } from '@wordpress/i18n';

import { config } from './config';

export const TINTA_ROLES = [ 'tinta_member', 'tinta_viewer' ];

/**
 * The options, for a SelectControl.
 *
 * @param current The current default role.
 */
export function roleOptions( current: string ) {
	return [
		{ value: 'tinta_member', label: __( 'Member', 'tinta' ) },
		{ value: 'tinta_viewer', label: __( 'Viewer', 'tinta' ) },
		...( TINTA_ROLES.includes( current )
			? []
			: [
					{
						value: current,
						label: config.roles[ current ] ?? current,
					},
				] ),
	];
}
