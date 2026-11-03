/**
 * Drag and drop in the page tree, like Notion: drop on the top or bottom
 * quarter of a page to go above or below it, in the middle to go inside it.
 * Targets that would put a page inside itself, or past level 5, are skipped.
 */
import {
	PointerSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
	type DragMoveEvent,
	type DragStartEvent,
} from '@dnd-kit/core';
import { useDispatch } from '@wordpress/data';
import { useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

import { MAX_DEPTH } from '../config';
import { store as workspaceStore, type TreePage } from '../store';
import { heightOf, levelOf, subtreeOf } from '../tree-utils';

export type DropZone = 'before' | 'after' | 'inside';

export interface DropTarget {
	id: number;
	zone: DropZone;
}

/**
 * Drag state and handlers for the tree's DndContext.
 *
 * @param pages    Flat page list.
 * @param onExpand Expands a page, after dropping inside it.
 */
export function useTreeDrag(
	pages: TreePage[],
	onExpand: ( pageId: number ) => void
) {
	const [ draggedId, setDraggedId ] = useState( 0 );
	const [ target, setTarget ] = useState< DropTarget | null >( null );
	const justDropped = useRef( false );
	const sensors = useSensors(
		useSensor( PointerSensor, { activationConstraint: { distance: 6 } } )
	);
	const { movePage } = useDispatch( workspaceStore );
	const { createErrorNotice } = useDispatch( noticesStore );

	const reset = () => {
		setDraggedId( 0 );
		setTarget( null );
	};

	const onDragEnd = async ( event: DragEndEvent ) => {
		const drop = findTarget( event, pages );
		reset();
		justDropped.current = true;
		setTimeout( () => ( justDropped.current = false ) );

		if ( ! drop ) {
			return;
		}

		const pageId = Number( event.active.id );
		const { parent, position } = placement( pageId, drop, pages );
		if ( drop.zone === 'inside' ) {
			onExpand( drop.id );
		}

		try {
			await movePage( pageId, parent, position );
		} catch {
			createErrorNotice( __( 'The page could not be moved.', 'tinta' ), {
				type: 'snackbar',
			} );
		}
	};

	return {
		sensors,
		draggedId,
		target,
		justDropped,
		handlers: {
			onDragStart: ( event: DragStartEvent ) =>
				setDraggedId( Number( event.active.id ) ),
			onDragMove: ( event: DragMoveEvent ) =>
				setTarget( findTarget( event, pages ) ),
			onDragEnd,
			onDragCancel: reset,
		},
	};
}

/**
 * Where the pointer would drop the dragged page, if it may go there.
 *
 * @param event Drag event.
 * @param pages Flat page list.
 */
function findTarget(
	event: DragMoveEvent | DragEndEvent,
	pages: TreePage[]
): DropTarget | null {
	const { active, over, activatorEvent, delta } = event;
	const overPage = pages.find( ( page ) => page.id === Number( over?.id ) );
	const pageId = Number( active.id );

	if (
		! over ||
		! overPage ||
		subtreeOf( pageId, pages ).includes( overPage.id )
	) {
		return null;
	}

	const pointerY = ( activatorEvent as PointerEvent ).clientY + delta.y;
	const ratio = ( pointerY - over.rect.top ) / over.rect.height;
	const zone: DropZone =
		( ratio < 0.25 && 'before' ) || ( ratio > 0.75 && 'after' ) || 'inside';
	const parent = zone === 'inside' ? overPage.id : overPage.parent;

	if ( levelOf( parent, pages ) + heightOf( pageId, pages ) > MAX_DEPTH ) {
		return null;
	}

	return { id: overPage.id, zone };
}

/**
 * New parent and position for a drop.
 *
 * @param pageId Dragged page.
 * @param drop   Drop target.
 * @param pages  Flat page list.
 */
function placement( pageId: number, drop: DropTarget, pages: TreePage[] ) {
	const over = pages.find( ( page ) => page.id === drop.id )!;
	const parent = drop.zone === 'inside' ? over.id : over.parent;
	const siblings = pages.filter(
		( page ) => page.parent === parent && page.id !== pageId
	);

	if ( drop.zone === 'inside' ) {
		return { parent, position: siblings.length };
	}

	const index = siblings.findIndex( ( page ) => page.id === over.id );

	return { parent, position: drop.zone === 'before' ? index : index + 1 };
}
