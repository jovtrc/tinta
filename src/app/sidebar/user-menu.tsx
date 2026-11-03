/**
 * The sidebar's footer: the signed-in person's menu (profile, admin tools for
 * administrators, log out) and, for administrators, workspace settings.
 */
import {
	Button,
	DropdownMenu,
	MenuGroup,
	MenuItem,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { cog, external } from '@wordpress/icons';

import { config } from '../config';
import { SettingsDialog } from './settings-dialog';

/**
 * Renders the footer.
 */
export function UserMenu() {
	const [ isSettingsOpen, setSettingsOpen ] = useState( false );

	return (
		<div className="liber-sidebar__footer">
			<DropdownMenu
				className="liber-user-menu"
				label={ __( 'Your account', 'liber' ) }
				icon={
					<img
						className="liber-user-menu__avatar"
						src={ config.user.avatar }
						alt=""
						width={ 24 }
						height={ 24 }
					/>
				}
				toggleProps={ { children: config.user.name } }
				popoverProps={ { placement: 'top-start' } }
			>
				{ () => (
					<MenuGroup>
						<MenuItem
							onClick={ () =>
								window.location.assign( config.links.profile )
							}
						>
							{ __( 'Your profile', 'liber' ) }
						</MenuItem>
						{ config.canManage && (
							<MenuItem
								onClick={ () =>
									window.location.assign( config.links.admin )
								}
								icon={ external }
							>
								{ __( 'Admin tools', 'liber' ) }
							</MenuItem>
						) }
						<MenuItem
							onClick={ () =>
								window.location.assign( config.links.logout )
							}
						>
							{ __( 'Log out', 'liber' ) }
						</MenuItem>
					</MenuGroup>
				) }
			</DropdownMenu>
			{ config.canManage && (
				<Button
					icon={ cog }
					label={ __( 'Workspace settings', 'liber' ) }
					onClick={ () => setSettingsOpen( true ) }
				/>
			) }
			{ isSettingsOpen && (
				<SettingsDialog onClose={ () => setSettingsOpen( false ) } />
			) }
		</div>
	);
}
