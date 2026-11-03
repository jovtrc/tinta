/**
 * A flat sidebar section of pages, like Pinned or Recent. Hidden when empty.
 */
import { useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { Icon, page as pageIcon } from '@wordpress/icons';
import type { MouseEvent } from 'react';

import { pageUrl } from '../config';
import { store as workspaceStore, type TreePage } from '../store';

interface PageSectionProps {
	title: string;
	pageIds: number[];
	currentId: number;
	onOpen: ( pageId: number ) => void;
}

/**
 * Renders the section, skipping pages that no longer exist.
 *
 * @param props           Props.
 * @param props.title     Section heading.
 * @param props.pageIds   Pages, in order.
 * @param props.currentId Open page.
 * @param props.onOpen    Opens a page.
 */
export function PageSection( {
	title,
	pageIds,
	currentId,
	onOpen,
}: PageSectionProps ) {
	const pages = useSelect(
		( select ) => select( workspaceStore ).getPages() ?? [],
		[]
	);
	const listed = pageIds
		.map( ( id ) => pages.find( ( page ) => page.id === id ) )
		.filter( ( page ): page is TreePage => !! page );

	if ( ! listed.length ) {
		return null;
	}

	const open = ( event: MouseEvent, pageId: number ) => {
		if ( event.button === 0 && ! event.metaKey && ! event.ctrlKey ) {
			event.preventDefault();
			onOpen( pageId );
		}
	};

	return (
		<>
			<h2 className="liber-sidebar__heading">{ title }</h2>
			<ul className="liber-tree" aria-label={ title }>
				{ listed.map( ( page ) => (
					<li key={ page.id }>
						<div className="liber-tree__row">
							<span className="liber-tree__toggle" />
							<a
								className="liber-tree__link"
								href={ pageUrl( page.id ) }
								aria-current={
									page.id === currentId ? 'page' : undefined
								}
								onClick={ ( event ) => open( event, page.id ) }
							>
								<span
									className="liber-tree__icon"
									aria-hidden="true"
								>
									{ page.icon || (
										<Icon icon={ pageIcon } size={ 18 } />
									) }
								</span>
								<span className="liber-tree__title">
									{ decodeEntities( page.title ) ||
										__( 'Untitled', 'liber' ) }
								</span>
							</a>
						</div>
					</li>
				) ) }
			</ul>
		</>
	);
}
