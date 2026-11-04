/**
 * "Move up" and "Move down" for a page's menu: among its sibling pages in the
 * tree (editors), or within Pinned. The way to reorder without dragging, for
 * keyboards and single clicks.
 */
import { arrayMove } from '@dnd-kit/sortable';
import { speak } from '@wordpress/a11y';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { arrowDown, arrowUp } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';

import { config } from '../config';
import { store as workspaceStore } from '../store';
import { store as prefsStore } from '../store/prefs';

export type PageList = 'tree' | 'pinned' | 'recent';

export interface OrderMove {
	label: string;
	icon: typeof arrowUp;
	move: () => void;
}

/**
 * The moves a page can make in a list, if any.
 *
 * @param pageId Page ID.
 * @param list   Where the menu opened.
 */
export function useOrderMoves( pageId: number, list: PageList ): OrderMove[] {
	const pages = useSelect(
		( select ) => select( workspaceStore ).getPages(),
		[]
	);
	const pinned = useSelect(
		( select ) => select( prefsStore ).getPrefs().pinned,
		[]
	);
	const { movePage } = useDispatch( workspaceStore );
	const { updatePrefs } = useDispatch( prefsStore );
	const { createErrorNotice } = useDispatch( noticesStore );
	const page = pages?.find( ( item ) => item.id === pageId );

	if ( ! pages || ! page ) {
		return [];
	}

	if ( list === 'pinned' ) {
		const ids = pinned.filter( ( id ) =>
			pages.some( ( item ) => item.id === id )
		);

		return movesWithin(
			ids,
			pageId,
			[
				__( 'Move up in Pinned', 'tinta' ),
				__( 'Move down in Pinned', 'tinta' ),
			],
			( to ) =>
				updatePrefs( {
					pinned: arrayMove( ids, ids.indexOf( pageId ), to ),
				} )
		);
	}

	if ( list !== 'tree' || ! config.canCreate ) {
		return [];
	}

	const siblings = pages
		.filter( ( item ) => item.parent === page.parent )
		.map( ( item ) => item.id );

	return movesWithin(
		siblings,
		pageId,
		[ __( 'Move up', 'tinta' ), __( 'Move down', 'tinta' ) ],
		( to ) =>
			movePage( pageId, page.parent, to ).catch( () =>
				createErrorNotice(
					__( 'The page could not be moved.', 'tinta' ),
					{ type: 'snackbar' }
				)
			)
	);
}

/**
 * Up and down moves for an item in an ordered list, skipping the ends.
 *
 * @param ids         The list, in order.
 * @param pageId      The item.
 * @param labels      Labels for up and down.
 * @param moveToIndex Moves the item to an index.
 */
function movesWithin(
	ids: number[],
	pageId: number,
	labels: [ string, string ],
	moveToIndex: ( to: number ) => unknown
): OrderMove[] {
	const index = ids.indexOf( pageId );
	const moveTo = ( to: number ) => () => {
		moveToIndex( to );
		speak(
			sprintf(
				/* translators: 1: new position, 2: number of pages in the list. */
				__( 'Moved to position %1$d of %2$d.', 'tinta' ),
				to + 1,
				ids.length
			)
		);
	};

	return [
		index > 0 && {
			label: labels[ 0 ],
			icon: arrowUp,
			move: moveTo( index - 1 ),
		},
		index < ids.length - 1 && {
			label: labels[ 1 ],
			icon: arrowDown,
			move: moveTo( index + 1 ),
		},
	].filter( ( item ): item is OrderMove => !! item );
}
