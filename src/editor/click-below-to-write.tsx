/**
 * A click below the last block starts a new paragraph (or goes to the empty
 * one already there), as in core's editor. It's how you keep writing after a
 * block without text, like a page link. Presses on the scrollbar don't count.
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { isUnmodifiedDefaultBlock } from '@wordpress/blocks';
import { useRefEffect } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Listens on the canvas; renders nothing visible.
 */
export function ClickBelowToWrite() {
	const { getBlock, getBlockOrder } = useSelect( blockEditorStore );
	const { insertDefaultBlock, selectBlock } = useDispatch( blockEditorStore );

	const ref = useRefEffect(
		( node: HTMLElement ) => {
			const doc = node.ownerDocument;

			const onPointerDown = ( event: PointerEvent ) => {
				const blocks = doc.querySelector( '.is-root-container' );
				const isOnPage =
					( event.target === doc.body ||
						event.target === doc.documentElement ) &&
					event.clientX < doc.documentElement.clientWidth;

				if (
					! blocks ||
					! isOnPage ||
					event.clientY < blocks.getBoundingClientRect().bottom
				) {
					return;
				}

				event.preventDefault();
				const last = getBlock( getBlockOrder( '' ).at( -1 ) ?? '' );

				if ( last && isUnmodifiedDefaultBlock( last ) ) {
					selectBlock( last.clientId );
				} else {
					insertDefaultBlock();
				}
			};

			doc.addEventListener( 'pointerdown', onPointerDown );

			return () =>
				doc.removeEventListener( 'pointerdown', onPointerDown );
		},
		[ getBlock, getBlockOrder, insertDefaultBlock, selectBlock ]
	);

	return <div ref={ ref } hidden />;
}
