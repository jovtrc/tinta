/**
 * The setup wizard (administrators): welcome, name and icon, plugins known to
 * conflict, who new people are, sample pages, workspace mode. It opens on an
 * administrator's first visit; closing or skipping it marks setup as done, and
 * Workspace settings can run it again. Choices save at the end, through core's
 * `wp/v2/settings`, and the screen reloads to apply them.
 */
import apiFetch from '@wordpress/api-fetch';
import { MediaUpload } from '@wordpress/block-editor';
import {
	Button,
	ExternalLink,
	Modal,
	SelectControl,
	Spinner,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

import { config, pageUrl } from '../config';
import { Logo } from '../logo';
import { RegistrationNotice } from '../registration-notice';
import { TINTA_ROLES, roleOptions } from '../roles';
import { store as workspaceStore } from '../store';
import { createSamplePages } from './sample-pages';

type Step = 'welcome' | 'name' | 'plugins' | 'people' | 'sample' | 'mode';

interface Choices {
	title: string;
	siteIcon: number;
	iconUrl: string;
	defaultRole?: string;
	workspaceMode: boolean;
	sample: boolean;
}

interface StoredSettings {
	title: string;
	site_icon: number;
	default_role?: string;
	tinta_settings: { workspace_mode: boolean };
}

/**
 * Marks setup as done, so the wizard doesn't open again by itself.
 */
function markDone() {
	return apiFetch( {
		path: '/wp/v2/settings',
		method: 'POST',
		data: { tinta_settings: { setup_done: true } },
	} );
}

/**
 * Renders the wizard.
 *
 * @param props         Props.
 * @param props.onClose Closes the wizard.
 */
export function SetupWizard( { onClose }: { onClose: () => void } ) {
	const conflicts = config.setup?.conflicts ?? [];
	const steps: Step[] = [
		'welcome',
		'name',
		...( conflicts.length ? [ 'plugins' as const ] : [] ),
		'people',
		'sample',
		'mode',
	];
	const hasPages = useSelect(
		( select ) => !! select( workspaceStore ).getPages()?.length,
		[]
	);
	const [ index, setIndex ] = useState( 0 );
	const [ choices, setChoices ] = useState< Choices | null >( null );
	const [ isSaving, setSaving ] = useState( false );
	const [ error, setError ] = useState( '' );
	const step = steps[ index ];

	useEffect( () => {
		apiFetch< StoredSettings >( {
			path: '/wp/v2/settings?_fields=title,site_icon,default_role,tinta_settings',
		} ).then( ( stored ) =>
			setChoices( {
				title: stored.title,
				siteIcon: stored.site_icon,
				iconUrl: config.siteIcon,
				defaultRole: suggestedRole( stored.default_role ),
				workspaceMode: stored.tinta_settings.workspace_mode,
				sample: ! hasPages,
			} )
		);
	}, [ hasPages ] );

	const change = ( changes: Partial< Choices > ) =>
		setChoices( ( current ) => current && { ...current, ...changes } );

	const close = () => {
		markDone();
		onClose();
	};

	const finish = async () => {
		if ( ! choices ) {
			return;
		}

		setSaving( true );
		try {
			await apiFetch( {
				path: '/wp/v2/settings',
				method: 'POST',
				data: {
					title: choices.title,
					site_icon: choices.siteIcon,
					default_role: choices.defaultRole,
					tinta_settings: {
						workspace_mode: choices.workspaceMode,
						setup_done: true,
					},
				},
			} );
			const welcome = choices.sample ? await createSamplePages() : 0;
			window.location.assign( pageUrl( welcome || config.pageId ) );
		} catch {
			setError( __( 'Setup could not be saved.', 'tinta' ) );
			setSaving( false );
		}
	};

	return (
		<Modal
			title={ __( 'Set up your workspace', 'tinta' ) }
			onRequestClose={ close }
			size="medium"
		>
			{ ! choices ? (
				<Spinner />
			) : (
				<div className="tinta-settings">
					{ step === 'welcome' && <Welcome /> }
					{ step === 'name' && (
						<NameStep choices={ choices } onChange={ change } />
					) }
					{ step === 'plugins' && (
						<PluginsStep conflicts={ conflicts } />
					) }
					{ step === 'people' && (
						<PeopleStep choices={ choices } onChange={ change } />
					) }
					{ step === 'sample' && (
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Add sample pages', 'tinta' ) }
							help={ __(
								'A Welcome page with tips, and a Getting started page inside it. Delete them whenever you like.',
								'tinta'
							) }
							checked={ choices.sample }
							onChange={ ( sample ) => change( { sample } ) }
						/>
					) }
					{ step === 'mode' && (
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Workspace mode', 'tinta' ) }
							help={ __(
								'Everyone lands in the workspace after logging in, the site is private, and Members and Viewers only see the workspace and their profile. You can turn it off later in Workspace settings.',
								'tinta'
							) }
							checked={ choices.workspaceMode }
							onChange={ ( workspaceMode ) =>
								change( { workspaceMode } )
							}
						/>
					) }
					{ error && (
						<p className="tinta-settings__error">{ error }</p>
					) }
					<div className="tinta-dialog__actions tinta-setup__actions">
						<span className="tinta-setup__progress">
							{ sprintf(
								/* translators: 1: current step, 2: number of steps. */
								__( 'Step %1$d of %2$d', 'tinta' ),
								index + 1,
								steps.length
							) }
						</span>
						{ index === 0 ? (
							<Button variant="tertiary" onClick={ close }>
								{ __( 'Skip for now', 'tinta' ) }
							</Button>
						) : (
							<Button
								variant="tertiary"
								onClick={ () => setIndex( index - 1 ) }
							>
								{ __( 'Back', 'tinta' ) }
							</Button>
						) }
						{ index < steps.length - 1 ? (
							<Button
								variant="primary"
								onClick={ () => setIndex( index + 1 ) }
							>
								{ index === 0
									? __( 'Get started', 'tinta' )
									: __( 'Continue', 'tinta' ) }
							</Button>
						) : (
							<Button
								variant="primary"
								isBusy={ isSaving }
								disabled={ isSaving }
								onClick={ finish }
							>
								{ __( 'Finish', 'tinta' ) }
							</Button>
						) }
					</div>
				</div>
			) }
		</Modal>
	);
}

interface StepProps {
	choices: Choices;
	onChange: ( changes: Partial< Choices > ) => void;
}

/**
 * What Tinta is, and what setup covers.
 */
function Welcome() {
	return (
		<>
			<Logo className="tinta-setup__logo" />
			<p className="tinta-setup__lead">
				{ __(
					'Tinta turns this site into a private wiki for your team: pages inside pages, written in the block editor.',
					'tinta'
				) }
			</p>
			<p>
				{ __(
					'Setup takes a minute: name the workspace, choose who new people are, and add sample pages if you like. Everything can be changed later in Workspace settings.',
					'tinta'
				) }
			</p>
		</>
	);
}

/**
 * The workspace's name and icon (core's Site Title and Site Icon).
 *
 * @param props          Props.
 * @param props.choices  Choices so far.
 * @param props.onChange Updates choices.
 */
function NameStep( { choices, onChange }: StepProps ) {
	return (
		<>
			<TextControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Workspace name', 'tinta' ) }
				value={ choices.title }
				onChange={ ( title ) => onChange( { title } ) }
			/>
			<div className="tinta-setup__icon">
				{ choices.iconUrl ? (
					<img
						src={ choices.iconUrl }
						alt=""
						width={ 48 }
						height={ 48 }
					/>
				) : (
					<span
						className="tinta-setup__icon-empty"
						aria-hidden="true"
					>
						{ choices.title.trim().charAt( 0 ).toUpperCase() }
					</span>
				) }
				<MediaUpload
					allowedTypes={ [ 'image' ] }
					value={ choices.siteIcon }
					onSelect={ ( media: { id: number; url: string } ) =>
						onChange( { siteIcon: media.id, iconUrl: media.url } )
					}
					render={ ( { open }: { open: () => void } ) => (
						<Button variant="secondary" onClick={ open }>
							{ choices.siteIcon
								? __( 'Change icon', 'tinta' )
								: __( 'Choose an icon', 'tinta' ) }
						</Button>
					) }
				/>
				{ !! choices.siteIcon && (
					<Button
						variant="tertiary"
						onClick={ () =>
							onChange( { siteIcon: 0, iconUrl: '' } )
						}
					>
						{ __( 'Remove', 'tinta' ) }
					</Button>
				) }
			</div>
			<p className="tinta-dialog__note">
				{ __(
					'The icon shows in the sidebar and the browser tab. A square image works best.',
					'tinta'
				) }
			</p>
		</>
	);
}

/**
 * Active plugins known to get in the workspace's way.
 *
 * @param props           Props.
 * @param props.conflicts The plugins, with why each matters.
 */
function PluginsStep( {
	conflicts,
}: {
	conflicts: Array< { name: string; reason: string } >;
} ) {
	return (
		<>
			<p>
				{ __(
					'These active plugins can get in the workspace’s way. Tinta won’t change them; you decide.',
					'tinta'
				) }
			</p>
			<ul className="tinta-setup__conflicts">
				{ conflicts.map( ( plugin ) => (
					<li key={ plugin.name }>
						<strong>{ plugin.name }</strong> { plugin.reason }
					</li>
				) ) }
			</ul>
			<ExternalLink href={ config.links.plugins }>
				{ __( 'Open Plugins', 'tinta' ) }
			</ExternalLink>
		</>
	);
}

/**
 * The role new people get (core's default role), and where to invite them.
 *
 * @param props          Props.
 * @param props.choices  Choices so far.
 * @param props.onChange Updates choices.
 */
function PeopleStep( { choices, onChange }: StepProps ) {
	const { defaultRole } = choices;

	return (
		<>
			{ defaultRole !== undefined && (
				<>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'New people join as', 'tinta' ) }
						value={ defaultRole }
						options={ roleOptions( defaultRole ) }
						onChange={ ( role ) =>
							onChange( { defaultRole: role } )
						}
						help={ __(
							'Members read and write every page. Viewers only read.',
							'tinta'
						) }
					/>
					<RegistrationNotice role={ defaultRole } />
				</>
			) }
			<ExternalLink href={ config.links.invite }>
				{ __( 'Invite people', 'tinta' ) }
			</ExternalLink>
		</>
	);
}

/**
 * The role the wizard suggests: Member, unless anyone can sign up (then the
 * current role stays) or a Tinta role is already chosen. Undefined where the
 * site can't change it (multisite).
 *
 * @param current The current default role.
 */
function suggestedRole( current?: string ): string | undefined {
	if (
		current === undefined ||
		TINTA_ROLES.includes( current ) ||
		config.setup?.openRegistration
	) {
		return current;
	}

	return 'tinta_member';
}
