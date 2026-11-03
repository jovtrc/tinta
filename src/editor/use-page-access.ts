/**
 * Whether the user edits a page (holding its lock) or only reads it.
 * The lock request doubles as the permission check: users who can't edit get a 403.
 */
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';

export interface PageLock {
	isLocked: boolean;
	user?: { name: string; avatar: string } | null;
	activePostLock?: string | null;
	postLockUtils?: { nonce: string; unlockNonce: string; ajaxUrl: string };
}

export type PageAccess =
	| { mode: 'loading' }
	| { mode: 'read-only' }
	| { mode: 'edit'; lock: PageLock };

/**
 * Takes the page's lock while the page is open and releases it on leaving.
 *
 * @param pageId Page ID.
 */
export function usePageAccess( pageId: number ): PageAccess {
	const [ access, setAccess ] = useState< PageAccess >( { mode: 'loading' } );

	useEffect( () => {
		const path = `/tinta/v1/docs/${ pageId }/lock`;
		let isOpen = true;

		apiFetch< PageLock >( { path, method: 'POST' } )
			.then( ( lock ) => isOpen && setAccess( { mode: 'edit', lock } ) )
			.catch( ( error ) => {
				if ( isOpen ) {
					setAccess(
						error?.data?.status === 403
							? { mode: 'read-only' }
							: { mode: 'edit', lock: { isLocked: false } }
					);
				}
			} );

		return () => {
			isOpen = false;
			apiFetch( { path, method: 'DELETE' } ).catch( () => undefined );
		};
	}, [ pageId ] );

	return access;
}
