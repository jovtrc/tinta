/**
 * A drag handle before the block under the pointer, like Notion's:
 * drag it to move the block, click it to select the block. Hidden while
 * typing. Inside a callout it moves the whole callout. Drops go through core's own drop zones, which read the same
 * `wp-blocks` drag data core's block toolbar sets.
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useMergeRefs, useRefEffect } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __, isRTL } from '@wordpress/i18n';
import { dragHandle, Icon } from '@wordpress/icons';
import type { DragEvent } from 'react';

const HANDLE_WIDTH = 24;

/**
 * A callout's text is its own blocks, but people move the callout as one.
 */
const CALLOUT = '[data-type="liber/callout"]';

interface Hovered {
	clientId: string;
	top: number;
	start: number;
}

interface BlockSelectors {
	isTyping: () => boolean;
	canMoveBlock: ( clientId: string ) => boolean;
	getBlockRootClientId: ( clientId: string ) => string | null;
}

/**
 * Renders the handle for the hovered block.
 */
export function BlockHandle() {
	const [ hovered, setHovered ] = useState< Hovered | null >( null );
	const [ layer, setLayer ] = useState< HTMLElement | null >( null );
	const isTyping = useSelect(
		( select ) =>
			(
				select( blockEditorStore ) as unknown as BlockSelectors
			 ).isTyping(),
		[]
	);
	const { canMoveBlock, getBlockRootClientId } = useSelect(
		blockEditorStore
	) as BlockSelectors;
	const { selectBlock, startDraggingBlocks, stopDraggingBlocks } =
		useDispatch( blockEditorStore );

	const track = useRefEffect(
		( node: HTMLElement ) => {
			const doc = node.ownerDocument;

			const onMouseMove = ( event: MouseEvent ) => {
				const target = event.target as Element;

				if ( target.closest?.( '.liber-block-handle' ) ) {
					return;
				}

				const inner =
					target.closest?.( '[data-block]' ) ??
					rowAt( doc, event.clientY );
				const block = inner?.parentElement?.closest( CALLOUT ) ?? inner;
				const clientId = block?.getAttribute( 'data-block' );

				if ( ! block || ! clientId || ! canMoveBlock( clientId ) ) {
					setHovered( null );
					return;
				}

				const origin = node.getBoundingClientRect();
				const rect = block.getBoundingClientRect();
				const top = rect.top - origin.top;
				const before = isRTL()
					? origin.right - rect.right
					: rect.left - origin.left;
				const start = Math.max( 0, before - HANDLE_WIDTH - 4 );

				setHovered( ( current ) =>
					current?.clientId === clientId &&
					current.top === top &&
					current.start === start
						? current
						: { clientId, top, start }
				);
			};

			doc.addEventListener( 'mousemove', onMouseMove );

			return () => doc.removeEventListener( 'mousemove', onMouseMove );
		},
		[ canMoveBlock ]
	);
	const ref = useMergeRefs( [
		( node: HTMLElement | null ) => setLayer( node ),
		track,
	] );

	const startDrag = ( event: DragEvent, clientId: string ) => {
		const block = layer?.ownerDocument.querySelector(
			`[data-block="${ clientId }"]`
		);

		event.dataTransfer.effectAllowed = 'move';
		event.dataTransfer.setData(
			'wp-blocks',
			JSON.stringify( {
				type: 'block',
				srcClientIds: [ clientId ],
				srcRootClientId: getBlockRootClientId( clientId ) ?? '',
			} )
		);

		if ( block ) {
			event.dataTransfer.setDragImage( block, 0, 0 );
		}

		window.requestAnimationFrame( () =>
			startDraggingBlocks( [ clientId ] )
		);
	};

	return (
		<div ref={ ref } className="liber-block-handles">
			{ hovered && ! isTyping && (
				<button
					type="button"
					draggable
					tabIndex={ -1 }
					className="liber-block-handle"
					style={ {
						top: hovered.top,
						insetInlineStart: hovered.start,
					} }
					aria-label={ __( 'Drag to move', 'liber' ) }
					onClick={ () => selectBlock( hovered.clientId ) }
					onDragStart={ ( event ) =>
						startDrag( event, hovered.clientId )
					}
					onDragEnd={ () => stopDraggingBlocks() }
				>
					<Icon icon={ dragHandle } size={ 18 } />
				</button>
			) }
		</div>
	);
}

/**
 * The top-level block on the pointer's row, for a pointer in the margin.
 *
 * @param doc The canvas document.
 * @param y   Pointer's distance from the top of the canvas.
 */
function rowAt( doc: Document, y: number ): Element | null {
	const blocks = doc.querySelectorAll( '.is-root-container > [data-block]' );

	return (
		[ ...blocks ].find( ( block ) => {
			const rect = block.getBoundingClientRect();

			return rect.top <= y && y < rect.bottom;
		} ) ?? null
	);
}
