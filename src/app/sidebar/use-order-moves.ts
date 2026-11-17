/**
 * "Move up" and "Move down" for a page's menu: among its sibling pages in the
 * tree (editors), within your Pinned, or within Pinned for everyone
 * (administrators). The way to reorder without dragging, for keyboards and
 * single clicks.
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

export type PageList = 'tree' | 'everyone' | 'pinned' | 'recent';

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
	const pinnedForEveryone = useSelect(
		( select ) => select( workspaceStore ).getPinnedForEveryone(),
		[]
	);
	const { movePage, setPinnedForEveryone } = useDispatch( workspaceStore );
	const { updatePrefs } = useDispatch( prefsStore );
	const { createErrorNotice } = useDispatch( noticesStore );
	const page = pages?.find( ( item ) => item.id === pageId );

	if ( ! pages || ! page ) {
		return [];
	}

	const exists = ( id: number ) => pages.some( ( item ) => item.id === id );

	if ( list === 'everyone' && config.canManage ) {
		const ids = pinnedForEveryone.filter( exists );

		return movesWithin(
			ids,
			pageId,
			[
				__( 'Move up in Pinned for everyone', 'tinta' ),
				__( 'Move down in Pinned for everyone', 'tinta' ),
			],
			( to ) =>
				setPinnedForEveryone(
					arrayMove( ids, ids.indexOf( pageId ), to )
				)
		);
	}

	if ( list === 'pinned' ) {
		const isShared = ( id: number ) => pinnedForEveryone.includes( id );
		const ids = pinned.filter( ( id ) => exists( id ) && ! isShared( id ) );

		return movesWithin(
			ids,
			pageId,
			[
				__( 'Move up in Pinned', 'tinta' ),
				__( 'Move down in Pinned', 'tinta' ),
			],
			( to ) =>
				updatePrefs( {
					pinned: [
						...arrayMove( ids, ids.indexOf( pageId ), to ),
						...pinned.filter( isShared ),
					],
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
