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
import { useDispatch } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { config } from '../config';
import { RegistrationNotice } from '../registration-notice';
import { roleOptions } from '../roles';
import { store as uiStore } from '../store/ui';

interface WorkspaceSettings {
	title: string;
	default_role?: string;
	tinta_settings: { workspace_mode: boolean; revisions: number };
}

const FIELDS = 'title,default_role,tinta_settings';

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
	const { openDialog } = useDispatch( uiStore );

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
			setError( __( 'The settings could not be saved.', 'tinta' ) );
			setSaving( false );
		}
	};

	return (
		<Modal
			title={ __( 'Workspace settings', 'tinta' ) }
			onRequestClose={ onClose }
			size="medium"
		>
			{ ! settings ? (
				<Spinner />
			) : (
				<div className="tinta-settings">
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Workspace name', 'tinta' ) }
						value={ settings.title }
						onChange={ ( title ) => change( { title } ) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Workspace mode', 'tinta' ) }
						help={ __(
							'Everyone lands in the workspace after logging in, the site is private, and Members and Viewers only see the workspace and their profile. Turn it off to get the usual WordPress back.',
							'tinta'
						) }
						checked={ settings.tinta_settings.workspace_mode }
						onChange={ ( workspaceMode ) =>
							change( {
								tinta_settings: {
									...settings.tinta_settings,
									workspace_mode: workspaceMode,
								},
							} )
						}
					/>
					{ settings.default_role !== undefined && (
						<>
							<SelectControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'New people join as', 'tinta' ) }
								value={ settings.default_role }
								options={ roleOptions( settings.default_role ) }
								onChange={ ( defaultRole ) =>
									change( { default_role: defaultRole } )
								}
								help={
									<a href={ config.links.invite }>
										{ __( 'Invite people', 'tinta' ) }
									</a>
								}
							/>
							<RegistrationNotice
								role={ settings.default_role }
							/>
						</>
					) }
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						type="number"
						min={ 0 }
						max={ 100 }
						label={ __( 'Versions kept per page', 'tinta' ) }
						value={ String( settings.tinta_settings.revisions ) }
						onChange={ ( revisions ) =>
							change( {
								tinta_settings: {
									...settings.tinta_settings,
									revisions: Number( revisions ),
								},
							} )
						}
					/>
					{ error && (
						<p className="tinta-settings__error">{ error }</p>
					) }
					<div className="tinta-dialog__actions">
						<Button
							variant="link"
							className="tinta-settings__setup"
							onClick={ () => openDialog( 'setup' ) }
						>
							{ __( 'Run setup again', 'tinta' ) }
						</Button>
						<Button variant="tertiary" onClick={ onClose }>
							{ __( 'Cancel', 'tinta' ) }
						</Button>
						<Button
							variant="primary"
							isBusy={ isSaving }
							disabled={ isSaving }
							onClick={ save }
						>
							{ __( 'Save', 'tinta' ) }
						</Button>
					</div>
				</div>
			) }
		</Modal>
	);
}
