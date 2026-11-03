/**
 * The open page, kept in the URL (`?doc=ID`): pages are bookmarkable and back/forward work.
 */
import { useCallback, useEffect, useState } from '@wordpress/element';

import { config, pageUrl } from './config';

/**
 * Page ID in the current URL (0: none), or the page the screen opened with.
 */
function pageFromUrl(): number {
	const doc = new URL( window.location.href ).searchParams.get( 'doc' );

	return doc === null ? config.pageId : Number( doc );
}

/**
 * The open page and a function that opens another one in place.
 */
export function usePageRoute(): [ number, ( pageId: number ) => void ] {
	const [ pageId, setPageId ] = useState( pageFromUrl );

	useEffect( () => {
		const onPopState = () => setPageId( pageFromUrl() );

		window.addEventListener( 'popstate', onPopState );

		return () => window.removeEventListener( 'popstate', onPopState );
	}, [] );

	const openPage = useCallback(
		( id: number ) => {
			if ( id !== pageId ) {
				window.history.pushState( {}, '', pageUrl( id ) );
				setPageId( id );
			}
		},
		[ pageId ]
	);

	return [ pageId, openPage ];
}

/**
 * Opens a page from outside the workspace's React tree (like core's command
 * palette): pushes its URL and lets the route follow, as for back/forward.
 *
 * @param pageId Page ID.
 */
export function navigateTo( pageId: number ) {
	window.history.pushState( {}, '', pageUrl( pageId ) );
	window.dispatchEvent( new PopStateEvent( 'popstate' ) );
}
