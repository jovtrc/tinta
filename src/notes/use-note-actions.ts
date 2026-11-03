/**
 * Writing notes the way core's Notes UI does, so either UI reads the other's notes.
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

import { withNoteId, withoutNoteId, type Note } from './data';

/**
 * Creates, replies to, resolves, reopens and deletes notes on a page. Failures
 * show a notice and are rethrown, so callers keep what was typed.
 *
 * @param postId Page ID.
 */
export function useNoteActions( postId: number ) {
	const { saveEntityRecord, deleteEntityRecord } = useDispatch( coreStore );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const { getBlockAttributes } = useSelect( blockEditorStore );
	const { createErrorNotice } = useDispatch( noticesStore );

	const save = ( record: object ) =>
		saveEntityRecord( 'root', 'comment', record, {
			throwOnError: true,
		} ) as Promise< Note >;

	const guard =
		< Args extends unknown[] >(
			action: ( ...args: Args ) => Promise< unknown >
		) =>
		async ( ...args: Args ) => {
			try {
				await action( ...args );
			} catch ( error ) {
				createErrorNotice(
					__( 'The note could not be saved.', 'liber' ),
					{ type: 'snackbar' }
				);
				throw error;
			}
		};

	return {
		startThread: guard( async ( clientId: string, content: string ) => {
			const note = await save( {
				post: postId,
				content,
				status: 'hold',
				type: 'note',
				parent: 0,
			} );
			updateBlockAttributes( clientId, {
				metadata: withNoteId(
					getBlockAttributes( clientId )?.metadata,
					note.id
				),
			} );
		} ),

		reply: guard( ( threadId: number, content: string ) =>
			save( {
				post: postId,
				content,
				status: 'hold',
				type: 'note',
				parent: threadId,
			} )
		),

		setResolved: guard( async ( thread: Note, resolved: boolean ) => {
			const status = resolved ? 'approved' : 'hold';
			await save( { id: thread.id, status } );
			await save( {
				post: postId,
				content: '',
				type: 'note',
				status,
				parent: thread.id,
				meta: { _wp_note_status: resolved ? 'resolved' : 'reopen' },
			} );
		} ),

		remove: guard( async ( note: Note, clientId: string | null ) => {
			await deleteEntityRecord( 'root', 'comment', note.id, undefined, {
				throwOnError: true,
			} );
			if ( clientId && ! note.parent ) {
				updateBlockAttributes( clientId, {
					metadata: withoutNoteId(
						getBlockAttributes( clientId )?.metadata,
						note.id
					),
				} );
			}
		} ),
	};
}

export type NoteActions = ReturnType< typeof useNoteActions >;
