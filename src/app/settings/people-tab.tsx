/**
 * Settings → People (administrators): who's in the workspace, from core's
 * `wp/v2/users`, and an invite form (`tinta/v1/people`), which sends core's
 * new-user email, or core's activation email on multisite.
 */
import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	SelectControl,
	Spinner,
	TextControl,
} from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import type { FormEvent } from 'react';

import { config } from '../config';
import { roleOptions } from '../roles';
import { SettingsCard } from './settings-card';

interface Person {
	id: number;
	name: string;
	email: string;
	roles: string[];
	avatar_urls: Record< string, string >;
}

/**
 * Loads the people in the workspace, by name.
 */
function fetchPeople() {
	return apiFetch< Person[] >( {
		path: addQueryArgs( '/wp/v2/users', {
			roles: config.workspaceRoles.join( ',' ),
			context: 'edit',
			orderby: 'name',
			per_page: 100,
			_fields: 'id,name,email,roles,avatar_urls',
		} ),
	} );
}

/**
 * Renders the tab.
 */
export function PeopleTab() {
	const [ people, setPeople ] = useState< Person[] | null >( null );
	const [ name, setName ] = useState( '' );
	const [ email, setEmail ] = useState( '' );
	const [ role, setRole ] = useState( 'tinta_member' );
	const [ isSending, setSending ] = useState( false );
	const [ message, setMessage ] = useState( '' );
	const [ error, setError ] = useState( '' );

	useEffect( () => {
		fetchPeople().then( setPeople );
	}, [] );

	const invite = async ( event: FormEvent ) => {
		event.preventDefault();
		setSending( true );
		setMessage( '' );
		setError( '' );
		try {
			await apiFetch( {
				path: '/tinta/v1/people',
				method: 'POST',
				data: { name, email, role },
			} );
			setMessage(
				config.multisite
					? sprintf(
							/* translators: %s: name of the person invited. */
							__(
								'Invite sent. %s gets an email with a link to activate their account and join.',
								'tinta'
							),
							name
						)
					: sprintf(
							/* translators: %s: name of the person invited. */
							__(
								'Invite sent. %s gets an email with a link to set a password.',
								'tinta'
							),
							name
						)
			);
			setName( '' );
			setEmail( '' );
			setPeople( await fetchPeople() );
		} catch ( requestError ) {
			setError(
				( requestError as { message?: string } )?.message ||
					__( 'The invite could not be sent.', 'tinta' )
			);
		}
		setSending( false );
	};

	const inviteHelp = config.multisite
		? __(
				'They get an email with a link to activate their account and join the workspace.',
				'tinta'
			)
		: __(
				'They get WordPress’s new-user email, with a link to set a password.',
				'tinta'
			);

	return (
		<div className="tinta-settings">
			{ config.canInvite ? (
				<form onSubmit={ invite }>
					<SettingsCard
						title={ __( 'Invite someone', 'tinta' ) }
						description={ inviteHelp }
						footer={
							<Button
								__next40pxDefaultSize
								variant="primary"
								type="submit"
								isBusy={ isSending }
								disabled={ isSending }
							>
								{ __( 'Send invite', 'tinta' ) }
							</Button>
						}
					>
						<div className="tinta-invite">
							<TextControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Name', 'tinta' ) }
								value={ name }
								required
								onChange={ setName }
							/>
							<TextControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								type="email"
								label={ __( 'Email', 'tinta' ) }
								value={ email }
								required
								onChange={ setEmail }
							/>
							<SelectControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Role', 'tinta' ) }
								value={ role }
								options={ roleOptions( 'tinta_member' ) }
								onChange={ setRole }
							/>
						</div>
						{ message && <p role="status">{ message }</p> }
						{ error && (
							<p className="tinta-settings__error" role="alert">
								{ error }
							</p>
						) }
					</SettingsCard>
				</form>
			) : (
				<p className="tinta-dialog__note">
					{ __(
						'This network doesn’t let site administrators add people. A network administrator can invite them.',
						'tinta'
					) }
				</p>
			) }
			<SettingsCard
				title={ __( 'In this workspace', 'tinta' ) }
				description={ __(
					'Everyone who can read the workspace’s pages.',
					'tinta'
				) }
				footer={
					<a href={ config.links.users }>
						{ __(
							'Change roles or remove people in WP Admin',
							'tinta'
						) }
					</a>
				}
			>
				{ ! people ? (
					<Spinner />
				) : (
					<ul className="tinta-people">
						{ people.map( ( person ) => (
							<li key={ person.id } className="tinta-person">
								<img
									src={ person.avatar_urls[ 48 ] }
									alt=""
									width={ 32 }
									height={ 32 }
								/>
								<span className="tinta-person__name">
									{ person.name }
									<span className="tinta-person__email">
										{ person.email }
									</span>
								</span>
								<span className="tinta-person__role">
									{ config.roles[ person.roles[ 0 ] ] ??
										person.roles[ 0 ] }
								</span>
							</li>
						) ) }
					</ul>
				) }
			</SettingsCard>
		</div>
	);
}
