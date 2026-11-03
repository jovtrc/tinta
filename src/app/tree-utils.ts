/**
 * Helpers for the flat page list the tree route returns.
 */
import type { TreePage } from './store';

/**
 * Pages grouped by parent ID, each group in tree order.
 *
 * @param pages Flat page list, already in tree order.
 */
export function groupByParent( pages: TreePage[] ): Map< number, TreePage[] > {
	const groups = new Map< number, TreePage[] >();

	for ( const page of pages ) {
		groups.set( page.parent, [
			...( groups.get( page.parent ) ?? [] ),
			page,
		] );
	}

	return groups;
}

/**
 * IDs of a page's ancestors, nearest first.
 *
 * @param pageId Page ID.
 * @param pages  Flat page list.
 */
export function ancestorsOf( pageId: number, pages: TreePage[] ): number[] {
	const parentOf = new Map(
		pages.map( ( page ) => [ page.id, page.parent ] )
	);
	const ancestors: number[] = [];

	for (
		let id = parentOf.get( pageId ) ?? 0;
		id;
		id = parentOf.get( id ) ?? 0
	) {
		ancestors.push( id );
	}

	return ancestors;
}

/**
 * A page and all its descendants.
 *
 * @param pageId Page ID.
 * @param pages  Flat page list.
 */
export function subtreeOf( pageId: number, pages: TreePage[] ): number[] {
	const childrenOf = groupByParent( pages );
	const ids = [ pageId ];

	for ( let i = 0; i < ids.length; i++ ) {
		ids.push(
			...( childrenOf.get( ids[ i ] ) ?? [] ).map( ( { id } ) => id )
		);
	}

	return ids;
}
