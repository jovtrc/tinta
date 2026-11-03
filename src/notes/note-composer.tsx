/**
 * Writes a note: a text box where @ suggests people to mention, ⌘/Ctrl+Enter sends.
 */
import { Button } from '@wordpress/components';
import { useFocusOnMount, useMergeRefs } from '@wordpress/compose';
import { useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type { KeyboardEvent } from 'react';

import { toNoteHtml, type Person } from './data';
import { usePeople } from './use-people';

const MAX_SUGGESTIONS = 5;

interface NoteComposerProps {
	label: string;
	submitLabel: string;
	onSubmit: ( html: string ) => Promise< unknown >;
	onCancel?: () => void;
}

/**
 * Renders the composer.
 *
 * @param props             Props.
 * @param props.label       Text box label (also its placeholder).
 * @param props.submitLabel Send button text.
 * @param props.onSubmit    Saves the note's HTML.
 * @param props.onCancel    Closes the composer.
 */
export function NoteComposer( {
	label,
	submitLabel,
	onSubmit,
	onCancel,
}: NoteComposerProps ) {
	const people = usePeople();
	const textarea = useRef< HTMLTextAreaElement >( null );
	const ref = useMergeRefs( [ textarea, useFocusOnMount( true ) ] );
	const [ text, setText ] = useState( '' );
	const [ caret, setCaret ] = useState( 0 );
	const [ mentions, setMentions ] = useState< Person[] >( [] );
	const [ isBusy, setBusy ] = useState( false );

	const typed = /(^|\s)@([^\s@]*)$/.exec( text.slice( 0, caret ) );
	const suggestions = typed
		? people
				.filter( ( person ) =>
					person.name
						.toLowerCase()
						.includes( typed[ 2 ].toLowerCase() )
				)
				.slice( 0, MAX_SUGGESTIONS )
		: [];

	const mention = ( person: Person ) => {
		const start = caret - ( typed?.[ 2 ].length ?? 0 ) - 1;
		const next = `${ text.slice( 0, start ) }@${ person.name } ${ text.slice(
			caret
		) }`;
		setText( next );
		setCaret( start + person.name.length + 2 );
		setMentions( [ ...mentions, person ] );
		textarea.current?.focus();
	};

	const submit = async () => {
		if ( ! text.trim() || isBusy ) {
			return;
		}
		setBusy( true );
		try {
			await onSubmit(
				toNoteHtml(
					text,
					mentions.filter( ( person ) =>
						text.includes( `@${ person.name }` )
					)
				)
			);
			setText( '' );
			setMentions( [] );
		} catch {
			// The notice is shown by the action; keep what was typed.
		}
		setBusy( false );
	};

	const onKeyDown = ( event: KeyboardEvent ) => {
		if ( event.key === 'Enter' && ( event.metaKey || event.ctrlKey ) ) {
			event.preventDefault();
			submit();
		} else if (
			( event.key === 'Enter' || event.key === 'Tab' ) &&
			suggestions.length
		) {
			event.preventDefault();
			mention( suggestions[ 0 ] );
		} else if ( event.key === 'Escape' && onCancel ) {
			onCancel();
		}
	};

	return (
		<div className="liber-note-composer">
			<textarea
				ref={ ref }
				className="liber-note-composer__text"
				aria-label={ label }
				placeholder={ label }
				value={ text }
				rows={ 3 }
				onChange={ ( event ) => {
					setText( event.target.value );
					setCaret( event.target.selectionStart );
				} }
				onSelect={ ( event ) =>
					setCaret( event.currentTarget.selectionStart )
				}
				onKeyDown={ onKeyDown }
			/>
			{ !! suggestions.length && (
				<ul
					className="liber-note-composer__mentions"
					aria-label={ __( 'People to mention', 'liber' ) }
				>
					{ suggestions.map( ( person ) => (
						<li key={ person.id }>
							<button
								type="button"
								onMouseDown={ ( event ) => {
									event.preventDefault();
									mention( person );
								} }
							>
								<img
									src={ person.avatar }
									alt=""
									width={ 20 }
									height={ 20 }
								/>
								{ person.name }
							</button>
						</li>
					) ) }
				</ul>
			) }
			<div className="liber-note-composer__actions">
				{ onCancel && (
					<Button
						variant="tertiary"
						size="compact"
						onClick={ onCancel }
					>
						{ __( 'Cancel', 'liber' ) }
					</Button>
				) }
				<Button
					variant="primary"
					size="compact"
					isBusy={ isBusy }
					disabled={ ! text.trim() || isBusy }
					onClick={ submit }
				>
					{ submitLabel }
				</Button>
			</div>
		</div>
	);
}
