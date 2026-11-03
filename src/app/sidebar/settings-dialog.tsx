/**
 * Workspace settings (administrators): name (core's Site Title), workspace
 * mode, the role new people get (core's default role) and revisions kept.
 * Saved through core's `wp/v2/settings`; the screen reloads to apply them.
 */
import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	Modal,
	SelectControl,
	Spinner,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { config } from '../config';

interface WorkspaceSettings {
	title: string;
	default_role: string;
	liber_settings: { workspace_mode: boolean; revisions: number };
}

const FIELDS = 'title,default_role,liber_settings';

/**
 * Renders the dialog.
 *
 * @param props         Props.
 * @param props.onClose Closes the dialog.
 */
export function SettingsDialog( { onClose }: { onClose: () => void } ) {
	const [ settings, setSettings ] = useState< WorkspaceSettings | null >(
		null
	);
	const [ isSaving, setSaving ] = useState( false );
	const [ error, setError ] = useState( '' );

	useEffect( () => {
		apiFetch< WorkspaceSettings >( {
			path: `/wp/v2/settings?_fields=${ FIELDS }`,
		} ).then( setSettings );
	}, [] );

	const change = ( changes: Partial< WorkspaceSettings > ) =>
		setSettings( ( current ) => current && { ...current, ...changes } );

	const save = async () => {
		setSaving( true );
		try {
			await apiFetch( {
				path: '/wp/v2/settings',
				method: 'POST',
				data: settings,
			} );
			window.location.reload();
		} catch {
			setError( __( 'The settings could not be saved.', 'liber' ) );
			setSaving( false );
		}
	};

	return (
		<Modal
			title={ __( 'Workspace settings', 'liber' ) }
			onRequestClose={ onClose }
			size="medium"
		>
			{ ! settings ? (
				<Spinner />
			) : (
				<div className="liber-settings">
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Workspace name', 'liber' ) }
						value={ settings.title }
						onChange={ ( title ) => change( { title } ) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Workspace mode', 'liber' ) }
						help={ __(
							'Everyone lands in the workspace after logging in, the site is private, and Members and Viewers only see the workspace and their profile. Turn it off to get the usual WordPress back.',
							'liber'
						) }
						checked={ settings.liber_settings.workspace_mode }
						onChange={ ( workspaceMode ) =>
							change( {
								liber_settings: {
									...settings.liber_settings,
									workspace_mode: workspaceMode,
								},
							} )
						}
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'New people join as', 'liber' ) }
						value={ settings.default_role }
						options={ [
							{
								value: 'liber_member',
								label: __( 'Member', 'liber' ),
							},
							{
								value: 'liber_viewer',
								label: __( 'Viewer', 'liber' ),
							},
							...( [ 'liber_member', 'liber_viewer' ].includes(
								settings.default_role
							)
								? []
								: [
										{
											value: settings.default_role,
											label: settings.default_role,
										},
									] ),
						] }
						onChange={ ( defaultRole ) =>
							change( { default_role: defaultRole } )
						}
						help={
							<a href={ config.links.invite }>
								{ __( 'Invite people', 'liber' ) }
							</a>
						}
					/>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						type="number"
						min={ 0 }
						max={ 100 }
						label={ __( 'Versions kept per page', 'liber' ) }
						value={ String( settings.liber_settings.revisions ) }
						onChange={ ( revisions ) =>
							change( {
								liber_settings: {
									...settings.liber_settings,
									revisions: Number( revisions ),
								},
							} )
						}
					/>
					{ error && (
						<p className="liber-settings__error">{ error }</p>
					) }
					<div className="liber-dialog__actions">
						<Button variant="tertiary" onClick={ onClose }>
							{ __( 'Cancel', 'liber' ) }
						</Button>
						<Button
							variant="primary"
							isBusy={ isSaving }
							disabled={ isSaving }
							onClick={ save }
						>
							{ __( 'Save', 'liber' ) }
						</Button>
					</div>
				</div>
			) }
		</Modal>
	);
}
