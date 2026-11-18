/**
 * The page header in the canvas: the icon (click to change) above the title,
 * then who edited the page last, and when. A page just created opens with
 * focus in its title.
 */
import { Dropdown } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { humanTimeDiff } from '@wordpress/date';
import { PostTitle, store as editorStore } from '@wordpress/editor';
import { useEffect, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

import { store as prefsStore } from '../app/store/prefs';
import { store as uiStore } from '../app/store/ui';
import { EmojiPicker } from './emoji-picker';

export const ICON_META = '_tinta_icon';

/**
 * Renders the icon, the title and the "Edited by" line. The canvas is an
 * iframe without wp-components styles, so the toggles are plain buttons.
 */
export function PageHeader() {
	const icon = useSelect(
		( select ) =>
			(
				select( editorStore ).getEditedPostAttribute( 'meta' ) as
					Record< string, string > | undefined
			 )?.[ ICON_META ] ?? '',
		[]
	);
	const recent = useSelect(
		( select ) => select( prefsStore ).getPrefs().emojis,
		[]
	);
	const { editPost } = useDispatch( editorStore );
	const { rememberEmoji } = useDispatch( prefsStore );
	const focusRefs = useNewPageFocus();
	const setIcon = ( value: string ) =>
		editPost( { meta: { [ ICON_META ]: value } } );

	return (
		<div ref={ focusRefs.header } className="tinta-page-header">
			<Dropdown
				popoverProps={ { placement: 'bottom-start' } }
				renderToggle={ ( { isOpen, onToggle } ) => (
					<button
						type="button"
						className={
							icon ? 'tinta-page-icon' : 'tinta-page-icon__add'
						}
						aria-expanded={ isOpen }
						aria-label={
							icon ? __( 'Change icon', 'tinta' ) : undefined
						}
						onClick={ onToggle }
					>
						{ icon || __( 'Add icon', 'tinta' ) }
					</button>
				) }
				renderContent={ ( { onClose } ) => (
					<EmojiPicker
						recent={ recent }
						selected={ icon }
						hasIcon={ !! icon }
						onSelect={ ( emoji ) => {
							setIcon( emoji );
							rememberEmoji( emoji );
							onClose();
						} }
						onRemove={ () => {
							setIcon( '' );
							onClose();
						} }
					/>
				) }
			/>
			<PostTitle ref={ focusRefs.title } />
			<EditedBy />
		</div>
	);
}

/**
 * Refs for the header and the title that focus the title on the page just
 * created. The canvas window takes focus first: Firefox otherwise focuses
 * only the canvas's body.
 */
function useNewPageFocus() {
	const header = useRef< HTMLDivElement >( null );
	const title = useRef< { focus: () => void } >( null );
	const isNew = useSelect(
		( select ) =>
			select( uiStore ).getNewPageId() ===
			select( editorStore ).getCurrentPostId(),
		[]
	);
	const { setNewPage } = useDispatch( uiStore );

	useEffect( () => {
		if ( isNew ) {
			header.current?.ownerDocument.defaultView?.focus();
			title.current?.focus();
			setNewPage( 0 );
		}
	}, [ isNew, setNewPage ] );

	return { header, title };
}

/**
 * "Edited by Maria · 2 hours ago" ("Edited 2 hours ago" when nobody is known).
 */
function EditedBy() {
	const { editor, modified } = useSelect( ( select ) => {
		const { getEditedPostAttribute } = select( editorStore );

		return {
			editor: getEditedPostAttribute( 'last_editor' ) as {
				name: string;
				avatar: string;
			} | null,
			modified: getEditedPostAttribute( 'modified_gmt' ) as string,
		};
	}, [] );

	return (
		<EditedByLine
			name={ editor?.name }
			avatar={ editor?.avatar }
			modifiedGmt={ modified }
		/>
	);
}

/**
 * The line itself, shared with the read-only view.
 *
 * @param props             Props.
 * @param props.name        Last editor's name.
 * @param props.avatar      Last editor's avatar URL.
 * @param props.modifiedGmt Last change, in GMT.
 */
export function EditedByLine( {
	name,
	avatar,
	modifiedGmt,
}: {
	name?: string;
	avatar?: string;
	modifiedGmt?: string;
} ) {
	if ( ! modifiedGmt ) {
		return null;
	}

	const since = humanTimeDiff( `${ modifiedGmt }Z` );

	return (
		<p className="tinta-page-meta">
			{ name && avatar && (
				<img
					className="tinta-page-meta__avatar"
					src={ avatar }
					alt=""
					width={ 20 }
					height={ 20 }
				/>
			) }
			{ name
				? sprintf(
						/* translators: 1: user's name, 2: time since the edit, like "2 hours ago". */
						__( 'Edited by %1$s · %2$s', 'tinta' ),
						name,
						since
					)
				: sprintf(
						/* translators: %s: time since the edit, like "2 hours ago". */
						__( 'Edited %s', 'tinta' ),
						since
					) }
		</p>
	);
}
