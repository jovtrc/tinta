/**
 * A warning under "New people join as" when anyone can sign up: everyone who
 * does gets the chosen role, so with Member or Viewer they can read the pages.
 */
import { ExternalLink, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { config } from './config';
import { TINTA_ROLES } from './roles';

/**
 * Renders the warning, or nothing.
 *
 * @param props      Props.
 * @param props.role The chosen default role.
 */
export function RegistrationNotice( { role }: { role: string } ) {
	if ( ! config.setup?.openRegistration || ! TINTA_ROLES.includes( role ) ) {
		return null;
	}

	return (
		<Notice status="warning" isDismissible={ false }>
			{ __(
				'Anyone can sign up on this site, and everyone who does gets this role, so they can read your pages. Turn off open registration to keep the workspace to the people you invite.',
				'tinta'
			) }{ ' ' }
			<ExternalLink href={ config.setup.registrationUrl }>
				{ __( 'Registration settings', 'tinta' ) }
			</ExternalLink>
		</Notice>
	);
}
