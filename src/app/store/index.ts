/**
 * `liber/workspace` store: the page tree (from `liber/v1/tree`, with its
 * generation) and page creation.
 */
import apiFetch from '@wordpress/api-fetch';
import { store as coreStore } from '@wordpress/core-data';
import { createReduxStore, register } from '@wordpress/data';
import type { DataRegistry } from '@wordpress/data';

import { POST_TYPE } from '../config';
import { movePageIn, subtreeOf } from '../tree-utils';

export interface TreePage {
	id: number;
	parent: number;
	order: number;
	title: string;
	icon: string;
}

interface State {
	pages: TreePage[] | null;
	generation: number | null;
}

type Action =
	| { type: 'RECEIVE_PAGES'; pages: TreePage[]; generation: number }
	| { type: 'ADD_PAGE'; page: TreePage }
	| { type: 'REMOVE_PAGES'; ids: number[] }
	| { type: 'MOVE_PAGE'; id: number; parent: number; position: number }
	| { type: 'RENAME_PAGE'; id: number; title: string };

interface ThunkArgs {
	dispatch: ( ( action: Action ) => void ) & {
		invalidateResolution: ( selector: string, args: unknown[] ) => void;
	};
	select: { getPages: () => TreePage[] | null };
	registry: DataRegistry;
}

const actions = {
	receivePages: ( pages: TreePage[], generation: number ): Action => ( {
		type: 'RECEIVE_PAGES',
		pages,
		generation,
	} ),

	renamePage: ( id: number, title: string ): Action => ( {
		type: 'RENAME_PAGE',
		id,
		title,
	} ),

	/**
	 * Creates a private page at the end of its parent's children.
	 *
	 * @param parent Parent page ID, or 0 for the top level.
	 * @return The new page's ID.
	 */
	createPage:
		( parent = 0 ) =>
		async ( {
			dispatch,
			select,
			registry,
		}: ThunkArgs ): Promise< number > => {
			const siblings = ( select.getPages() ?? [] ).filter(
				( page ) => page.parent === parent
			);
			const order =
				Math.max( -1, ...siblings.map( ( page ) => page.order ) ) + 1;
			const record = await registry
				.dispatch( coreStore )
				.saveEntityRecord(
					'postType',
					POST_TYPE,
					{ title: '', status: 'private', parent, menu_order: order },
					{ throwOnError: true }
				);

			dispatch( {
				type: 'ADD_PAGE',
				page: { id: record.id, parent, order, title: '', icon: '' },
			} );

			return record.id;
		},

	/**
	 * Moves a page and its subpages to the trash.
	 *
	 * @param id Page ID.
	 */
	trashPage:
		( id: number ) =>
		async ( { dispatch, select, registry }: ThunkArgs ) => {
			await registry
				.dispatch( coreStore )
				.deleteEntityRecord(
					'postType',
					POST_TYPE,
					id,
					{},
					{ throwOnError: true }
				);

			dispatch( {
				type: 'REMOVE_PAGES',
				ids: subtreeOf( id, select.getPages() ?? [] ),
			} );
			dispatch.invalidateResolution( 'getPages', [] );
		},

	/**
	 * Moves a page in the tree at once, then on the server; refetches either way.
	 *
	 * @param id       Page ID.
	 * @param parent   New parent, or 0 for the top level.
	 * @param position Position among the new siblings.
	 */
	movePage:
		( id: number, parent: number, position: number ) =>
		async ( { dispatch }: ThunkArgs ) => {
			dispatch( { type: 'MOVE_PAGE', id, parent, position } );
			try {
				await apiFetch( {
					path: `/liber/v1/docs/${ id }/move`,
					method: 'POST',
					data: { parent, position },
				} );
			} finally {
				dispatch.invalidateResolution( 'getPages', [] );
			}
		},

	/**
	 * Refetches the tree, after restoring or deleting from the trash.
	 */
	refreshPages:
		() =>
		( { dispatch }: ThunkArgs ) =>
			dispatch.invalidateResolution( 'getPages', [] ),
};

/**
 * Applies an action to the tree.
 *
 * @param state  Current state.
 * @param action Action.
 */
function reducer(
	state: State = { pages: null, generation: null },
	action: Action
): State {
	switch ( action.type ) {
		case 'RECEIVE_PAGES':
			return { pages: action.pages, generation: action.generation };
		case 'ADD_PAGE':
			return {
				...state,
				pages: [ ...( state.pages ?? [] ), action.page ],
			};
		case 'REMOVE_PAGES':
			return {
				...state,
				pages:
					state.pages?.filter(
						( page ) => ! action.ids.includes( page.id )
					) ?? null,
			};
		case 'MOVE_PAGE':
			return {
				...state,
				pages: state.pages
					? movePageIn(
							state.pages,
							action.id,
							action.parent,
							action.position
						)
					: null,
			};
		case 'RENAME_PAGE':
			return {
				...state,
				pages:
					state.pages?.map( ( page ) =>
						page.id === action.id
							? { ...page, title: action.title }
							: page
					) ?? null,
			};
	}

	return state;
}

const selectors = {
	getPages: ( state: State ): TreePage[] | null => state.pages,
	getGeneration: ( state: State ): number | null => state.generation,
};

const resolvers = {
	getPages:
		() =>
		async ( { dispatch }: ThunkArgs ) => {
			const tree = await apiFetch< {
				pages: TreePage[];
				generation: number;
			} >( { path: '/liber/v1/tree' } );

			dispatch( actions.receivePages( tree.pages, tree.generation ) );
		},
};

export const store = createReduxStore( 'liber/workspace', {
	reducer,
	actions,
	selectors,
	resolvers,
} );

register( store );
