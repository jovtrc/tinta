/**
 * One thread: the note, its replies, and Reply, Resolve or Reopen, Delete.
 * After a reply is posted or cancelled, focus goes back to Reply; after a
 * reply is deleted, to the thread.
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
	isPosted: boolean;
	onFocused: () => void;
	onLeave: ( message: string ) => void;
}

/**
 * Renders the thread.
 *
 * @param props           Props.
 * @param props.thread    Thread.
 * @param props.actions   Note actions.
 * @param props.isPosted  Whether it was just posted, to take focus.
 * @param props.onFocused Called once it has taken focus.
 * @param props.onLeave   Called with a message when it leaves the list.
 */
export function ThreadCard( {
	thread,
	actions,
	isPosted,
	onFocused,
	onLeave,
}: ThreadCardProps ) {
	const { selectBlock } = useDispatch( blockEditorStore );
	const [ reply, setReply ] = useState< 'none' | 'writing' | 'closed' >(
		'none'
	);
	const replyButton = useRef< HTMLButtonElement >( null );
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

	useEffect( () => {
		if ( reply === 'closed' ) {
			replyButton.current?.focus();
		}
	}, [ reply ] );

	useEffect( () => {
		if ( isPosted ) {
			ref.current?.focus();
			onFocused();
		}
	}, [ isPosted, onFocused ] );

	const setResolved = async () => {
		await actions.setResolved( thread.root, ! thread.isResolved );
		onLeave(
			thread.isResolved
				? __( 'Note reopened.', 'tinta' )
				: __( 'Note resolved.', 'tinta' )
		);
	};

	return (
		<article
			ref={ ref }
			tabIndex={ -1 }
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
				onDelete={ async () => {
					await actions.remove( thread.root, thread.clientId );
					onLeave( __( 'Note deleted.', 'tinta' ) );
				} }
			/>
			{ thread.replies.map( ( note ) => (
				<NoteItem
					key={ note.id }
					note={ note }
					onDelete={ async () => {
						await actions.remove( note, null );
						ref.current?.focus();
					} }
				/>
			) ) }
			{ reply === 'writing' ? (
				<NoteComposer
					label={ __( 'Reply', 'tinta' ) }
					submitLabel={ __( 'Reply', 'tinta' ) }
					onCancel={ () => setReply( 'closed' ) }
					onSubmit={ async ( html ) => {
						await actions.reply( thread.root.id, html );
						setReply( 'closed' );
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
							ref={ replyButton }
							variant="tertiary"
							size="compact"
							onClick={ () => setReply( 'writing' ) }
						>
							{ __( 'Reply', 'tinta' ) }
						</Button>
					) }
					<Button
						variant="secondary"
						size="compact"
						onClick={ setResolved }
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
function NoteItem( {
	note,
	onDelete,
}: {
	note: Note;
	onDelete: () => Promise< void >;
} ) {
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
