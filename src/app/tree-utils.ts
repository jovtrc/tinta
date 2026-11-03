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

/**
 * Level of a page, 1 at the top; 0 for the top level itself.
 *
 * @param pageId Page ID, or 0.
 * @param pages  Flat page list.
 */
export function levelOf( pageId: number, pages: TreePage[] ): number {
	return pageId ? ancestorsOf( pageId, pages ).length + 1 : 0;
}

/**
 * Number of levels a page's subtree spans, 1 for a page without subpages.
 *
 * @param pageId Page ID.
 * @param pages  Flat page list.
 */
export function heightOf( pageId: number, pages: TreePage[] ): number {
	const children = pages.filter( ( page ) => page.parent === pageId );

	return (
		1 +
		Math.max( 0, ...children.map( ( { id } ) => heightOf( id, pages ) ) )
	);
}

/**
 * The page list after moving a page, in the server's order (menu order, then title).
 *
 * @param pages    Flat page list.
 * @param pageId   Moved page.
 * @param parent   New parent.
 * @param position Position among the new siblings.
 */
export function movePageIn(
	pages: TreePage[],
	pageId: number,
	parent: number,
	position: number
): TreePage[] {
	const moved = pages.find( ( page ) => page.id === pageId );
	if ( ! moved ) {
		return pages;
	}

	const siblings = pages.filter(
		( page ) => page.parent === parent && page.id !== pageId
	);
	siblings.splice( position, 0, { ...moved, parent } );
	const orders = new Map(
		siblings.map( ( { id }, order ) => [ id, order ] )
	);

	return pages
		.map( ( page ) =>
			orders.has( page.id )
				? {
						...page,
						parent: page.id === pageId ? parent : page.parent,
						order: orders.get( page.id )!,
					}
				: page
		)
		.sort(
			( a, b ) =>
				a.order - b.order ||
				a.title.localeCompare( b.title ) ||
				a.id - b.id
		);
}
