/**
 * The open page, kept in the URL (`?doc=ID`): pages are bookmarkable and back/forward work.
 */
import { useCallback, useEffect, useState } from '@wordpress/element';

import { config, pageUrl } from './config';

/**
 * Page ID in the current URL, or the page the screen opened with.
 */
function pageFromUrl(): number {
	const doc = new URL( window.location.href ).searchParams.get( 'doc' );

	return Number( doc ) || config.pageId;
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
