/**
 * One thread: the note, its replies, and Reply, Resolve or Reopen, Delete.
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { humanTimeDiff } from '@wordpress/date';
import { RawHTML, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { trash } from '@wordpress/icons';

import { config } from '../app/config';
import type { Note } from './data';
import { NoteComposer } from './note-composer';
import type { NoteActions } from './use-note-actions';
import type { Thread } from './use-threads';

interface ThreadCardProps {
	thread: Thread;
	actions: NoteActions;
}

/**
 * Renders the thread.
 *
 * @param props         Props.
 * @param props.thread  Thread.
 * @param props.actions Note actions.
 */
export function ThreadCard( { thread, actions }: ThreadCardProps ) {
	const { selectBlock } = useDispatch( blockEditorStore );
	const [ isReplying, setReplying ] = useState( false );
	const ref = useRef< HTMLElement >( null );
	const isActive = useSelect(
		( select ) =>
			!! thread.clientId &&
			(
				select( blockEditorStore ) as unknown as {
					getSelectedBlockClientId: () => string | null;
				}
			 ).getSelectedBlockClientId() === thread.clientId,
		[ thread.clientId ]
	);

	useEffect( () => {
		if ( isActive ) {
			ref.current?.scrollIntoView( { block: 'nearest' } );
		}
	}, [ isActive ] );

	return (
		<article
			ref={ ref }
			className={ [
				'tinta-thread',
				thread.isResolved && 'is-resolved',
				isActive && 'is-active',
			]
				.filter( Boolean )
				.join( ' ' ) }
		>
			<NoteItem
				note={ thread.root }
				onDelete={ () =>
					actions.remove( thread.root, thread.clientId )
				}
			/>
			{ thread.replies.map( ( reply ) => (
				<NoteItem
					key={ reply.id }
					note={ reply }
					onDelete={ () => actions.remove( reply, null ) }
				/>
			) ) }
			{ isReplying ? (
				<NoteComposer
					label={ __( 'Reply', 'tinta' ) }
					submitLabel={ __( 'Reply', 'tinta' ) }
					onCancel={ () => setReplying( false ) }
					onSubmit={ async ( html ) => {
						await actions.reply( thread.root.id, html );
						setReplying( false );
					} }
				/>
			) : (
				<div className="tinta-thread__actions">
					{ thread.clientId && (
						<Button
							variant="tertiary"
							size="compact"
							onClick={ () => selectBlock( thread.clientId! ) }
						>
							{ __( 'Show block', 'tinta' ) }
						</Button>
					) }
					{ ! thread.isResolved && (
						<Button
							variant="tertiary"
							size="compact"
							onClick={ () => setReplying( true ) }
						>
							{ __( 'Reply', 'tinta' ) }
						</Button>
					) }
					<Button
						variant="secondary"
						size="compact"
						onClick={ () =>
							actions.setResolved(
								thread.root,
								! thread.isResolved
							)
						}
					>
						{ thread.isResolved
							? __( 'Reopen', 'tinta' )
							: __( 'Resolve', 'tinta' ) }
					</Button>
				</div>
			) }
		</article>
	);
}

/**
 * One note: author, time, content; Delete for its author and administrators.
 *
 * @param props          Props.
 * @param props.note     Note.
 * @param props.onDelete Deletes the note.
 */
function NoteItem( { note, onDelete }: { note: Note; onDelete: () => void } ) {
	const canDelete = note.author === config.userId || config.canManage;

	return (
		<div className="tinta-note">
			<div className="tinta-note__meta">
				{ note.author_avatar_urls?.[ '48' ] && (
					<img
						className="tinta-note__avatar"
						src={ note.author_avatar_urls[ '48' ] }
						alt=""
						width={ 24 }
						height={ 24 }
					/>
				) }
				<strong>{ note.author_name }</strong>
				<span className="tinta-note__time">
					{ humanTimeDiff( `${ note.date_gmt }Z` ) }
				</span>
				{ canDelete && (
					<Button
						size="small"
						icon={ trash }
						label={ __( 'Delete note', 'tinta' ) }
						onClick={ onDelete }
					/>
				) }
			</div>
			<RawHTML className="tinta-note__content">
				{ note.content.rendered }
			</RawHTML>
		</div>
	);
}
