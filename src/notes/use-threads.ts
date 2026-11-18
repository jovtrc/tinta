/**
 * The page's note threads, in block order, with their replies. While core-data
 * reloads them after a note is added, the last ones loaded stay, so the list
 * keeps its place and focus.
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useEntityRecords } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useEffect, useMemo, useState } from '@wordpress/element';

import { noteIdsOf, notesQuery, type Note, type NoteMetadata } from './data';

/**
 * The block-editor selectors used here; the package ships no types.
 */
interface BlockSelectors {
	getClientIdsWithDescendants: () => string[];
	getBlockAttributes: (
		clientId: string
	) => { metadata?: NoteMetadata } | null;
}

export interface Thread {
	root: Note;
	replies: Note[];
	clientId: string | null;
	isResolved: boolean;
}

/**
 * Loads the notes and groups them into threads.
 *
 * @param postId Page ID.
 */
export function useThreads( postId: number ) {
	const { records } = useEntityRecords< Note >(
		'root',
		'comment',
		notesQuery( postId )
	);
	const [ loaded, setLoaded ] = useState< {
		postId: number;
		notes: Note[];
	} | null >( null );
	const notes = loaded?.postId === postId ? loaded.notes : null;

	useEffect( () => {
		if ( records ) {
			setLoaded( { postId, notes: records } );
		}
	}, [ postId, records ] );
	const blockOfNote = useSelect( ( select ) => {
		const { getClientIdsWithDescendants, getBlockAttributes } = select(
			blockEditorStore
		) as unknown as BlockSelectors;
		const map = new Map< number, string >();

		for ( const clientId of getClientIdsWithDescendants() ) {
			for ( const id of noteIdsOf(
				getBlockAttributes( clientId )?.metadata
			) ) {
				map.set( id, clientId );
			}
		}

		return map;
	}, [] );

	const threads = useMemo( () => {
		const order = [ ...blockOfNote.values() ];

		return ( notes ?? [] )
			.filter( ( note ) => ! note.parent )
			.map( ( root ): Thread => ( {
				root,
				replies: ( notes ?? [] )
					.filter(
						( note ) =>
							note.parent === root.id &&
							! note.meta?._wp_note_status
					)
					.sort( ( a, b ) => a.date_gmt.localeCompare( b.date_gmt ) ),
				clientId: blockOfNote.get( root.id ) ?? null,
				isResolved: root.status === 'approved',
			} ) )
			.sort(
				( a, b ) =>
					rank( order, a.clientId ) - rank( order, b.clientId ) ||
					a.root.date_gmt.localeCompare( b.root.date_gmt )
			);
	}, [ notes, blockOfNote ] );

	return { threads, isLoading: ! notes };
}

/**
 * Position of a block in the page; notes whose block is gone go last.
 *
 * @param order    Block client IDs in page order.
 * @param clientId Block client ID.
 */
function rank( order: string[], clientId: string | null ): number {
	const index = clientId ? order.indexOf( clientId ) : -1;

	return index === -1 ? Infinity : index;
}
