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
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { cog, external } from '@wordpress/icons';

import { config } from '../config';
import { store as uiStore } from '../store/ui';

/**
 * Renders the footer.
 */
export function UserMenu() {
	const { openDialog } = useDispatch( uiStore );

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
				toggleProps={ {
					children: (
						<span className="liber-user-menu__text">
							<span className="liber-user-menu__name">
								{ config.user.name }
							</span>
							{ config.user.role && (
								<span className="liber-user-menu__role">
									{ config.user.role }
								</span>
							) }
						</span>
					),
				} }
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
					onClick={ () => openDialog( 'settings' ) }
				/>
			) }
		</div>
	);
}
