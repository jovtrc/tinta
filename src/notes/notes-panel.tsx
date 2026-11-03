/**
 * The Notes panel beside the canvas: open or resolved threads, and a new note
 * for the block it was started from.
 */
import { Button, Spinner } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { closeSmall, comment } from '@wordpress/icons';

import { NoteComposer } from './note-composer';
import { store as notesStore } from './store';
import { ThreadCard } from './thread-card';
import { useNoteActions } from './use-note-actions';
import { useThreads } from './use-threads';

/**
 * Renders the panel.
 */
export function NotesPanel() {
	const postId = useSelect(
		( select ) => select( editorStore ).getCurrentPostId() as number,
		[]
	);
	const composingFor = useSelect(
		( select ) => select( notesStore ).getComposingFor(),
		[]
	);
	const { setOpen, startNote } = useDispatch( notesStore );
	const { threads, isLoading } = useThreads( postId );
	const actions = useNoteActions( postId );
	const [ showResolved, setShowResolved ] = useState( false );
	const shown = threads.filter(
		( thread ) => thread.isResolved === showResolved
	);

	return (
		<aside className="tinta-notes" aria-label={ __( 'Notes', 'tinta' ) }>
			<div className="tinta-notes__header">
				<Button
					size="compact"
					isPressed={ ! showResolved }
					onClick={ () => setShowResolved( false ) }
				>
					{ __( 'Open', 'tinta' ) }
				</Button>
				<Button
					size="compact"
					isPressed={ showResolved }
					onClick={ () => setShowResolved( true ) }
				>
					{ __( 'Resolved', 'tinta' ) }
				</Button>
				<div className="tinta-editor__spacer" />
				<Button
					size="compact"
					icon={ closeSmall }
					label={ __( 'Close notes', 'tinta' ) }
					onClick={ () => setOpen( false ) }
				/>
			</div>
			{ composingFor && (
				<div className="tinta-thread is-new">
					<NoteComposer
						label={ __(
							'Add a note. Type @ to mention someone.',
							'tinta'
						) }
						submitLabel={ __( 'Add note', 'tinta' ) }
						onCancel={ () => startNote( null ) }
						onSubmit={ async ( html ) => {
							await actions.startThread( composingFor, html );
							startNote( null );
						} }
					/>
				</div>
			) }
			{ isLoading && <Spinner /> }
			{ ! isLoading &&
				shown.map( ( thread ) => (
					<ThreadCard
						key={ thread.root.id }
						thread={ thread }
						actions={ actions }
					/>
				) ) }
			{ ! isLoading && ! shown.length && ! composingFor && (
				<p className="tinta-notes__empty">
					{ showResolved
						? __( 'No resolved notes.', 'tinta' )
						: __(
								'No open notes. Select a block and choose Add note.',
								'tinta'
							) }
				</p>
			) }
		</aside>
	);
}

/**
 * Header button: the notes icon, with the number of open threads beside it.
 */
export function NotesToggle() {
	const postId = useSelect(
		( select ) => select( editorStore ).getCurrentPostId() as number,
		[]
	);
	const isOpen = useSelect( ( select ) => select( notesStore ).isOpen(), [] );
	const { setOpen } = useDispatch( notesStore );
	const { threads } = useThreads( postId );
	const open = threads.filter( ( thread ) => ! thread.isResolved ).length;

	return (
		<Button
			className="tinta-notes-toggle"
			icon={ comment }
			label={
				open
					? sprintf(
							/* translators: %d: number of open notes. */
							_n(
								'Notes, %d open',
								'Notes, %d open',
								open,
								'tinta'
							),
							open
						)
					: __( 'Notes', 'tinta' )
			}
			size="compact"
			isPressed={ isOpen }
			onClick={ () => setOpen( ! isOpen ) }
		>
			{ open > 0 && (
				<span className="tinta-notes-toggle__count" aria-hidden="true">
					{ open }
				</span>
			) }
		</Button>
	);
}
