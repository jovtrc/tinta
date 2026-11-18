/**
 * Settings → General (administrators): the workspace's name (core's Site
 * Title), workspace mode, the role new people get (core's default role) and
 * revisions kept. Saved through core's `wp/v2/settings`; the screen reloads
 * to apply them.
 */
import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	FormToggle,
	SelectControl,
	Spinner,
	TextControl,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { RegistrationNotice } from '../registration-notice';
import { roleOptions } from '../roles';
import { store as uiStore } from '../store/ui';
import { SettingsCard } from './settings-card';

interface WorkspaceSettings {
	title: string;
	default_role?: string;
	tinta_settings: { workspace_mode: boolean; revisions: number };
}

const FIELDS = 'title,default_role,tinta_settings';

/**
 * Renders the tab.
 *
 * @param props         Props.
 * @param props.onClose Closes the settings.
 */
export function GeneralTab( { onClose }: { onClose: () => void } ) {
	const [ settings, setSettings ] = useState< WorkspaceSettings | null >(
		null
	);
	const [ isSaving, setSaving ] = useState( false );
	const [ error, setError ] = useState( '' );
	const { openDialog } = useDispatch( uiStore );
	const modeId = useInstanceId( GeneralTab, 'tinta-workspace-mode' );

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

	if ( ! settings ) {
		return <Spinner />;
	}

	return (
		<>
			<div className="tinta-settings">
				<SettingsCard
					title={ __( 'Workspace name', 'tinta' ) }
					description={ __(
						'Shown at the top of the sidebar and in the browser tab. It’s also your site’s title.',
						'tinta'
					) }
				>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						hideLabelFromVision
						label={ __( 'Workspace name', 'tinta' ) }
						value={ settings.title }
						onChange={ ( title ) => change( { title } ) }
					/>
				</SettingsCard>
				<SettingsCard
					title={ __( 'Workspace mode', 'tinta' ) }
					titleId={ `${ modeId }-title` }
					description={ __(
						'Everyone lands in the workspace after logging in, the site is private, and Members and Viewers only see the workspace and their profile. Turn it off to get the usual WordPress back.',
						'tinta'
					) }
					descriptionId={ `${ modeId }-description` }
					aside={
						<FormToggle
							checked={ settings.tinta_settings.workspace_mode }
							aria-labelledby={ `${ modeId }-title` }
							aria-describedby={ `${ modeId }-description` }
							onChange={ () =>
								change( {
									tinta_settings: {
										...settings.tinta_settings,
										workspace_mode:
											! settings.tinta_settings
												.workspace_mode,
									},
								} )
							}
						/>
					}
				/>
				{ settings.default_role !== undefined && (
					<SettingsCard
						title={ __( 'New people join as', 'tinta' ) }
						description={ __(
							'The role people get when they sign up or are added without one. Members read and write every page; Viewers only read.',
							'tinta'
						) }
					>
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							hideLabelFromVision
							label={ __( 'New people join as', 'tinta' ) }
							value={ settings.default_role }
							options={ roleOptions( settings.default_role ) }
							onChange={ ( defaultRole ) =>
								change( { default_role: defaultRole } )
							}
						/>
						<RegistrationNotice role={ settings.default_role } />
					</SettingsCard>
				) }
				<SettingsCard
					title={ __( 'Versions kept per page', 'tinta' ) }
					description={ __(
						'How many saved versions each page keeps, from 0 to 100.',
						'tinta'
					) }
				>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						hideLabelFromVision
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
				</SettingsCard>
				{ error && <p className="tinta-settings__error">{ error }</p> }
			</div>
			<div className="tinta-settings__footer">
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
		</>
	);
}
