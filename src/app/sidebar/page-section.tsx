/**
 * A flat sidebar section of pages, like Pinned or Recent, with the page menu
 * on each row's "⋯" button and on right click. Hidden when empty. The open
 * page is marked in the tree only, so it isn't highlighted twice. With
 * `onReorder`, pages can be dragged into a new order (Pinned), or moved up and
 * down from the menu. As in the tree, a preview follows the pointer: dropping
 * on the row itself would let the browser follow its link.
 */
import {
	closestCenter,
	DndContext,
	DragOverlay,
	PointerSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
} from '@dnd-kit/core';
import {
	arrayMove,
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDispatch, useSelect } from '@wordpress/data';
import { useRef, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, page as pageIcon } from '@wordpress/icons';
import type { MouseEvent } from 'react';

import { pageUrl } from '../config';
import { store as workspaceStore, type TreePage } from '../store';
import { store as uiStore } from '../store/ui';
import { menuPosition, PageMenu } from './page-menu';
import type { PageList } from './use-order-moves';

interface PageSectionProps {
	title: string;
	list: PageList;
	pageIds: number[];
	onOpen: ( pageId: number ) => void;
	onReorder?: ( pageIds: number[] ) => void;
}

interface RowProps {
	page: TreePage;
	list: PageList;
	section: string;
	onOpen: ( event: MouseEvent, pageId: number ) => void;
}

/**
 * Renders the section, skipping pages that no longer exist.
 *
 * @param props           Props.
 * @param props.title     Section heading.
 * @param props.list      Which list this is.
 * @param props.pageIds   Pages, in order.
 * @param props.onOpen    Opens a page.
 * @param props.onReorder Saves a new order; makes the pages draggable.
 */
export function PageSection( {
	title,
	list: listName,
	pageIds,
	onOpen,
	onReorder,
}: PageSectionProps ) {
	const pages = useSelect(
		( select ) => select( workspaceStore ).getPages() ?? [],
		[]
	);
	const justDropped = useRef( false );
	const [ draggedId, setDraggedId ] = useState( 0 );
	const sensors = useSensors(
		useSensor( PointerSensor, { activationConstraint: { distance: 6 } } )
	);
	const listed = pageIds
		.map( ( id ) => pages.find( ( page ) => page.id === id ) )
		.filter( ( page ): page is TreePage => !! page );
	if ( ! listed.length ) {
		return null;
	}

	const ids = listed.map( ( page ) => page.id );

	const open = ( event: MouseEvent, pageId: number ) => {
		if ( justDropped.current ) {
			event.preventDefault();
		} else if ( event.button === 0 && ! event.metaKey && ! event.ctrlKey ) {
			event.preventDefault();
			onOpen( pageId );
		}
	};

	const drop = ( { active, over }: DragEndEvent ) => {
		setDraggedId( 0 );
		justDropped.current = true;
		setTimeout( () => ( justDropped.current = false ) );

		if ( onReorder && over && active.id !== over.id ) {
			onReorder(
				arrayMove(
					ids,
					ids.indexOf( Number( active.id ) ),
					ids.indexOf( Number( over.id ) )
				)
			);
		}
	};

	const dragged = listed.find( ( page ) => page.id === draggedId );
	const Row = onReorder ? SortableRow : StaticRow;
	const list = (
		<ul className="tinta-tree" aria-label={ title }>
			{ listed.map( ( page ) => (
				<Row
					key={ page.id }
					page={ page }
					list={ listName }
					section={ title }
					onOpen={ open }
				/>
			) ) }
		</ul>
	);

	return (
		<>
			<h2 className="tinta-sidebar__heading">{ title }</h2>
			{ onReorder ? (
				<DndContext
					sensors={ sensors }
					collisionDetection={ closestCenter }
					onDragStart={ ( { active } ) =>
						setDraggedId( Number( active.id ) )
					}
					onDragCancel={ () => setDraggedId( 0 ) }
					onDragEnd={ drop }
				>
					<SortableContext
						items={ ids }
						strategy={ verticalListSortingStrategy }
					>
						{ list }
					</SortableContext>
					<DragOverlay dropAnimation={ null }>
						{ dragged && (
							<div className="tinta-tree__drag-preview">
								{ titleOf( dragged ) }
							</div>
						) }
					</DragOverlay>
				</DndContext>
			) : (
				list
			) }
		</>
	);
}

/**
 * A row that stays where it is.
 *
 * @param props Row props.
 */
function StaticRow( props: RowProps ) {
	return (
		<li>
			<RowContent { ...props } />
		</li>
	);
}

/**
 * A row that can be dragged up or down, on the vertical axis only.
 *
 * @param props Row props.
 */
function SortableRow( props: RowProps ) {
	const { setNodeRef, listeners, transform, transition, isDragging } =
		useSortable( { id: props.page.id } );

	return (
		<li
			ref={ setNodeRef }
			className={ isDragging ? 'is-dragging' : undefined }
			style={ {
				transform: transform
					? `translate3d(0, ${ transform.y }px, 0)`
					: undefined,
				transition,
			} }
			{ ...listeners }
		>
			<RowContent { ...props } />
		</li>
	);
}

/**
 * The page's icon and title, linking to it, with its menu on the "⋯" button
 * and on right click.
 *
 * @param props         Props.
 * @param props.page    Page.
 * @param props.list    Which list the row is in.
 * @param props.section The section's heading, for the button's label.
 * @param props.onOpen  Handles a click on the link.
 */
function RowContent( { page, list, section, onOpen }: RowProps ) {
	const isMenuOpen = useSelect(
		( select ) => select( uiStore ).getContextMenu()?.pageId === page.id,
		[ page.id ]
	);
	const { openContextMenu } = useDispatch( uiStore );

	return (
		<div
			className={
				isMenuOpen ? 'tinta-tree__row is-menu-open' : 'tinta-tree__row'
			}
			onContextMenu={ ( event ) => {
				event.preventDefault();
				openContextMenu( page.id, ...menuPosition( event ), list );
			} }
		>
			<span className="tinta-tree__toggle" />
			<a
				className="tinta-tree__link"
				href={ pageUrl( page.id ) }
				onClick={ ( event ) => onOpen( event, page.id ) }
			>
				<span className="tinta-tree__icon" aria-hidden="true">
					{ page.icon || <Icon icon={ pageIcon } size={ 18 } /> }
				</span>
				<span className="tinta-tree__title">{ titleOf( page ) }</span>
			</a>
			<div className="tinta-tree__actions">
				<PageMenu
					pageId={ page.id }
					list={ list }
					label={ sprintf(
						/* translators: 1: page title, 2: sidebar section, like Pinned. */
						__( 'Actions for “%1$s” in %2$s', 'tinta' ),
						titleOf( page ),
						section
					) }
				/>
			</div>
		</div>
	);
}

/**
 * A page's title as text, or "Untitled".
 *
 * @param page Page.
 */
function titleOf( page: TreePage ): string {
	return decodeEntities( page.title ) || __( 'Untitled', 'tinta' );
}
