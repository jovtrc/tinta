/**
 * `liber/prefs` store: the user's workspace preferences (the `liber_prefs`
 * field on `wp/v2/users/me`). Changes wait for the stored preferences, apply
 * at once, and save in the background.
 */
import apiFetch from '@wordpress/api-fetch';
import { createReduxStore, register } from '@wordpress/data';
import type { DataRegistry } from '@wordpress/data';

import { store as workspaceStore } from './index';

export interface Prefs {
	pinned: number[];
	recent: number[];
	expanded: number[];
	emojis: string[];
}

const EMPTY: Prefs = { pinned: [], recent: [], expanded: [], emojis: [] };

const LIMITS = { recent: 5, expanded: 500, emojis: 16 };

const RECENT_DELAY = 2000;

/**
 * The same path the workspace screen preloads.
 */
const PREFS_PATH = '/wp/v2/users/me?_fields=liber_prefs&context=edit';

interface Action {
	type: 'RECEIVE_PREFS';
	prefs: Partial< Prefs >;
}

interface ThunkArgs {
	dispatch: ( ( action: Action ) => void ) & typeof actions;
	select: { getPrefs: () => Prefs };
	resolveSelect: { getPrefs: () => Promise< Prefs > };
	registry: DataRegistry;
}

/**
 * One save at a time, always with the latest preferences: changes made while
 * a save runs go out in one follow-up save. Small changes (like Recent) wait a
 * moment, so quick page switches send one request. A save still waiting when
 * the page closes is sent right away.
 */
const saver = {
	latest: EMPTY,
	isSaving: false,
	isPending: false,
	timer: 0,
};

/**
 * Sends preferences; `keepalive` lets the request finish if the page closes.
 *
 * @param prefs Preferences to save.
 */
function send( prefs: Prefs ) {
	return apiFetch( {
		path: '/wp/v2/users/me',
		method: 'POST',
		data: { liber_prefs: prefs },
		keepalive: true,
	} ).catch( () => undefined );
}

/**
 * Sends the latest preferences, or marks them pending while a save runs.
 */
function flush() {
	window.clearTimeout( saver.timer );
	saver.timer = 0;

	if ( saver.isSaving ) {
		saver.isPending = true;
		return;
	}

	saver.isSaving = true;
	send( saver.latest ).finally( () => {
		saver.isSaving = false;
		if ( saver.isPending ) {
			saver.isPending = false;
			flush();
		}
	} );
}

/**
 * Saves the latest preferences now, or after a delay.
 *
 * @param prefs Latest preferences.
 * @param delay Milliseconds to wait for more changes.
 */
function save( prefs: Prefs, delay: number ) {
	saver.latest = prefs;
	window.clearTimeout( saver.timer );

	if ( delay ) {
		saver.timer = window.setTimeout( flush, delay );
	} else {
		flush();
	}
}

window.addEventListener( 'pagehide', () => {
	if ( saver.timer || saver.isPending ) {
		saver.isPending = false;
		send( saver.latest );
	}
} );

const actions = {
	receivePrefs: ( prefs: Partial< Prefs > ): Action => ( {
		type: 'RECEIVE_PREFS',
		prefs,
	} ),

	/**
	 * Applies changes at once and saves them.
	 *
	 * @param changes Lists to replace.
	 * @param delay   Milliseconds to wait for more changes before saving.
	 */
	updatePrefs:
		( changes: Partial< Prefs >, delay = 0 ) =>
		( { dispatch, select, registry }: ThunkArgs ) => {
			const pages = registry.select( workspaceStore ).getPages();
			dispatch(
				actions.receivePrefs(
					pages ? withoutGonePages( changes, pages ) : changes
				)
			);
			save( select.getPrefs(), delay );
		},

	/**
	 * Puts a page first in Recent.
	 *
	 * @param pageId Opened page.
	 */
	visitPage:
		( pageId: number ) =>
		async ( { dispatch, resolveSelect }: ThunkArgs ) => {
			const { recent } = await resolveSelect.getPrefs();
			if ( recent[ 0 ] !== pageId ) {
				dispatch.updatePrefs(
					{
						recent: [
							pageId,
							...recent.filter( ( id ) => id !== pageId ),
						].slice( 0, LIMITS.recent ),
					},
					RECENT_DELAY
				);
			}
		},

	/**
	 * Pins a page, or unpins it.
	 *
	 * @param pageId Page ID.
	 */
	togglePin:
		( pageId: number ) =>
		async ( { dispatch, resolveSelect }: ThunkArgs ) => {
			const { pinned } = await resolveSelect.getPrefs();
			dispatch.updatePrefs( {
				pinned: pinned.includes( pageId )
					? pinned.filter( ( id ) => id !== pageId )
					: [ ...pinned, pageId ],
			} );
		},

	/**
	 * Expands or collapses pages in the tree.
	 *
	 * @param pageIds  Pages to change.
	 * @param expanded Whether they end up expanded.
	 */
	setExpanded:
		( pageIds: number[], expanded: boolean ) =>
		async ( { dispatch, resolveSelect }: ThunkArgs ) => {
			const current = ( await resolveSelect.getPrefs() ).expanded;
			const next = expanded
				? [ ...new Set( [ ...current, ...pageIds ] ) ]
				: current.filter( ( id ) => ! pageIds.includes( id ) );

			if ( next.length !== current.length ) {
				dispatch.updatePrefs( {
					expanded: next.slice( -LIMITS.expanded ),
				} );
			}
		},

	/**
	 * Puts an emoji first in "Recently used".
	 *
	 * @param emoji Chosen emoji.
	 */
	rememberEmoji:
		( emoji: string ) =>
		async ( { dispatch, resolveSelect }: ThunkArgs ) => {
			const { emojis } = await resolveSelect.getPrefs();
			dispatch.updatePrefs( {
				emojis: [
					emoji,
					...emojis.filter( ( item ) => item !== emoji ),
				].slice( 0, LIMITS.emojis ),
			} );
		},
};

/**
 * Drops pages that no longer exist from page lists.
 *
 * @param prefs Lists to clean.
 * @param pages Pages in the tree.
 */
function withoutGonePages(
	prefs: Partial< Prefs >,
	pages: { id: number }[]
): Partial< Prefs > {
	const ids = new Set( pages.map( ( { id } ) => id ) );
	const clean = { ...prefs };

	for ( const list of [ 'pinned', 'recent', 'expanded' ] as const ) {
		clean[ list ] = prefs[ list ]?.filter( ( id ) => ids.has( id ) );
	}

	return Object.fromEntries(
		Object.entries( clean ).filter( ( [ , value ] ) => value )
	);
}

/**
 * Merges received lists into the state.
 *
 * @param state  Current preferences.
 * @param action Action.
 */
function reducer( state: Prefs = EMPTY, action: Action ): Prefs {
	return action.type === 'RECEIVE_PREFS'
		? { ...state, ...action.prefs }
		: state;
}

const selectors = {
	getPrefs: ( state: Prefs ): Prefs => state,
};

const resolvers = {
	getPrefs:
		() =>
		async ( { dispatch }: ThunkArgs ) => {
			const user = await apiFetch< { liber_prefs?: Prefs } >( {
				path: PREFS_PATH,
			} );
			dispatch( actions.receivePrefs( user.liber_prefs ?? EMPTY ) );
		},
};

export const store = createReduxStore( 'liber/prefs', {
	reducer,
	actions,
	selectors,
	resolvers,
} );

register( store );
