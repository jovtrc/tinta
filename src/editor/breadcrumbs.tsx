/**
 * Where the open page sits: its parents, each one a link, then the page.
 * Small screens show only the page.
 */
import { useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { Icon, page as pageIcon } from '@wordpress/icons';
import type { MouseEvent } from 'react';

import { pageUrl } from '../app/config';
import { store as workspaceStore, type TreePage } from '../app/store';
import { ancestorsOf } from '../app/tree-utils';
import { navigateTo } from '../app/use-page-route';

/**
 * Renders the trail.
 *
 * @param props        Props.
 * @param props.pageId Open page.
 */
export function Breadcrumbs( { pageId }: { pageId: number } ) {
	const pages = useSelect(
		( select ) => select( workspaceStore ).getPages() ?? [],
		[]
	);
	const trail = [ ...ancestorsOf( pageId, pages ).reverse(), pageId ]
		.map( ( id ) => pages.find( ( page ) => page.id === id ) )
		.filter( ( page ): page is TreePage => !! page );

	if ( ! trail.length ) {
		return null;
	}

	const open = ( event: MouseEvent, id: number ) => {
		if ( event.button === 0 && ! event.metaKey && ! event.ctrlKey ) {
			event.preventDefault();
			navigateTo( id );
		}
	};

	return (
		<nav
			className="liber-breadcrumbs"
			aria-label={ __( 'Breadcrumbs', 'liber' ) }
		>
			<ol>
				{ trail.map( ( page ) =>
					page.id === pageId ? (
						<li key={ page.id }>
							<span aria-current="page">
								<Crumb page={ page } />
							</span>
						</li>
					) : (
						<li key={ page.id }>
							<a
								href={ pageUrl( page.id ) }
								onClick={ ( event ) => open( event, page.id ) }
							>
								<Crumb page={ page } />
							</a>
						</li>
					)
				) }
			</ol>
		</nav>
	);
}

/**
 * A page's icon and title.
 *
 * @param props      Props.
 * @param props.page Page.
 */
function Crumb( { page }: { page: TreePage } ) {
	return (
		<>
			<span className="liber-breadcrumbs__icon" aria-hidden="true">
				{ page.icon || <Icon icon={ pageIcon } size={ 16 } /> }
			</span>
			<span className="liber-breadcrumbs__title">
				{ decodeEntities( page.title ) || __( 'Untitled', 'liber' ) }
			</span>
		</>
	);
}
