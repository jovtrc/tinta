/**
 * Settings → Profile (everyone): your name, email, password and admin color
 * scheme, through core's `wp/v2/users/me`. A new email waits for core's
 * confirmation email (`tinta_email_change`); saving the rest reloads the
 * screen, since a new password and color scheme apply on the next load.
 */
import apiFetch from '@wordpress/api-fetch';
import {
	BaseControl,
	Button,
	CheckboxControl,
	Spinner,
	TextControl,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

import { config } from '../config';
import { passwordStrength } from './password-strength';

interface Profile {
	name: string;
	email: string;
	meta: { admin_color?: string };
	tinta_email_change: string | null;
}

const PATH = '/wp/v2/users/me';
const FIELDS = 'name,email,meta,tinta_email_change';

/**
 * Error message from a failed REST request.
 *
 * @param error Thrown error.
 */
function errorMessage( error: unknown ): string {
	return (
		( error as { message?: string } )?.message ||
		__( 'Your profile could not be saved.', 'tinta' )
	);
}

/**
 * Renders the tab.
 *
 * @param props         Props.
 * @param props.onClose Closes the settings.
 */
export function ProfileTab( { onClose }: { onClose: () => void } ) {
	const [ profile, setProfile ] = useState< Profile | null >( null );
	const [ name, setName ] = useState( '' );
	const [ email, setEmail ] = useState( '' );
	const [ password, setPassword ] = useState( '' );
	const [ weakConfirmed, setWeakConfirmed ] = useState( false );
	const [ scheme, setScheme ] = useState( '' );
	const [ isSaving, setSaving ] = useState( false );
	const [ error, setError ] = useState( '' );
	const schemeId = useInstanceId( ProfileTab, 'tinta-color-scheme' );

	const load = ( record: Profile ) => {
		setProfile( record );
		setName( record.name );
		setEmail( record.email );
		setScheme( record.meta.admin_color || 'fresh' );
	};

	useEffect( () => {
		apiFetch< Profile >( {
			path: `${ PATH }?context=edit&_fields=${ FIELDS }`,
		} ).then( load );
	}, [] );

	if ( ! profile ) {
		return <Spinner />;
	}

	const strength = passwordStrength( password );
	const needsWeakConfirm = !! strength?.isWeak && ! weakConfirmed;

	const changeEmail = async ( value: string ) => {
		setError( '' );
		try {
			load(
				await apiFetch< Profile >( {
					path: `${ PATH }?context=edit&_fields=${ FIELDS }`,
					method: 'POST',
					data: { tinta_email_change: value },
				} )
			);
		} catch ( requestError ) {
			setError( errorMessage( requestError ) );
		}
	};

	const save = async () => {
		setSaving( true );
		setError( '' );
		try {
			await apiFetch( {
				path: PATH,
				method: 'POST',
				data: {
					name,
					meta: { admin_color: scheme },
					...( password ? { password } : {} ),
				},
			} );
			window.location.reload();
		} catch ( requestError ) {
			setError( errorMessage( requestError ) );
			setSaving( false );
		}
	};

	return (
		<div className="tinta-settings">
			<TextControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Name', 'tinta' ) }
				value={ name }
				autoComplete="name"
				onChange={ setName }
			/>
			<div className="tinta-settings__row">
				<TextControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					type="email"
					label={ __( 'Email', 'tinta' ) }
					value={ email }
					autoComplete="email"
					onChange={ setEmail }
					help={
						profile.tinta_email_change &&
						sprintf(
							/* translators: %s: new email address. */
							__(
								'Waiting for you to confirm %s: open the link sent there to make the change.',
								'tinta'
							),
							profile.tinta_email_change
						)
					}
				/>
				{ email !== profile.email ? (
					<Button
						__next40pxDefaultSize
						variant="secondary"
						onClick={ () => changeEmail( email ) }
					>
						{ __( 'Change email', 'tinta' ) }
					</Button>
				) : (
					profile.tinta_email_change && (
						<Button
							__next40pxDefaultSize
							variant="tertiary"
							onClick={ () => changeEmail( '' ) }
						>
							{ __( 'Cancel change', 'tinta' ) }
						</Button>
					)
				) }
			</div>
			<TextControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				type="password"
				label={ __( 'New password', 'tinta' ) }
				value={ password }
				autoComplete="new-password"
				onChange={ ( value ) => {
					setPassword( value );
					setWeakConfirmed( false );
				} }
				help={
					strength?.label ??
					__( 'Leave it empty to keep your password.', 'tinta' )
				}
			/>
			{ strength?.isWeak && (
				<CheckboxControl
					__nextHasNoMarginBottom
					label={ __( 'Confirm use of weak password', 'tinta' ) }
					checked={ weakConfirmed }
					onChange={ setWeakConfirmed }
				/>
			) }
			<fieldset className="tinta-color-schemes">
				<legend>
					<BaseControl.VisualLabel>
						{ __( 'Admin color scheme', 'tinta' ) }
					</BaseControl.VisualLabel>
				</legend>
				{ config.colorSchemes.map( ( option ) => (
					<label
						key={ option.id }
						htmlFor={ `${ schemeId }-${ option.id }` }
						className={
							option.id === scheme
								? 'tinta-color-scheme is-selected'
								: 'tinta-color-scheme'
						}
					>
						<span className="tinta-color-scheme__name">
							<input
								id={ `${ schemeId }-${ option.id }` }
								type="radio"
								name={ schemeId }
								value={ option.id }
								checked={ option.id === scheme }
								onChange={ () => setScheme( option.id ) }
							/>
							{ option.name }
						</span>
						<span
							className="tinta-color-scheme__colors"
							aria-hidden="true"
						>
							{ option.colors.map( ( color, index ) => (
								<span
									key={ index }
									style={ { backgroundColor: color } }
								/>
							) ) }
						</span>
					</label>
				) ) }
			</fieldset>
			{ error && <p className="tinta-settings__error">{ error }</p> }
			<div className="tinta-dialog__actions">
				<Button variant="tertiary" onClick={ onClose }>
					{ __( 'Cancel', 'tinta' ) }
				</Button>
				<Button
					variant="primary"
					isBusy={ isSaving }
					disabled={ isSaving || needsWeakConfirm }
					onClick={ save }
				>
					{ __( 'Save', 'tinta' ) }
				</Button>
			</div>
		</div>
	);
}
