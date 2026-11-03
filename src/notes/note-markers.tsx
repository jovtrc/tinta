/**
 * A marker beside each block with open notes, in the canvas margin, showing
 * how many notes it has. Clicking it opens Notes at that block's threads.
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useMergeRefs, useResizeObserver } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useLayoutEffect, useState } from '@wordpress/element';
import { _n, isRTL, sprintf } from '@wordpress/i18n';
import { comment, Icon } from '@wordpress/icons';

import { store as notesStore } from './store';
import { useThreads } from './use-threads';

const MARKER_WIDTH = 56;
const GAP = 12;

interface Marker {
	clientId: string;
	count: number;
	top: number;
	start: number;
}

/**
 * Renders the markers, placed from where their blocks are on the page.
 */
export function NoteMarkers() {
	const postId = useSelect(
		( select ) => select( editorStore ).getCurrentPostId() as number,
		[]
	);
	const blocks = useSelect(
		( select ) =>
			(
				select( blockEditorStore ) as unknown as {
					getBlocks: () => unknown[];
				}
			 ).getBlocks(),
		[]
	);
	const { threads } = useThreads( postId );
	const { setOpen } = useDispatch( notesStore );
	const { selectBlock } = useDispatch( blockEditorStore );
	const [ layer, setLayer ] = useState< HTMLElement | null >( null );
	const [ markers, setMarkers ] = useState< Marker[] >( [] );
	const [ layout, setLayout ] = useState( 0 );
	const observe = useResizeObserver( () => setLayout( ( n ) => n + 1 ) );
	const ref = useMergeRefs( [
		( node: HTMLElement | null ) => setLayer( node ),
		observe,
	] );

	useLayoutEffect( () => {
		const doc = layer?.ownerDocument;
		const content = doc?.querySelector( '.is-root-container' );

		if ( ! layer || ! doc || ! content ) {
			return;
		}

		const counts = new Map< string, number >();
		for ( const thread of threads ) {
			if ( thread.clientId && ! thread.isResolved ) {
				counts.set(
					thread.clientId,
					( counts.get( thread.clientId ) ?? 0 ) +
						1 +
						thread.replies.length
				);
			}
		}

		const origin = layer.getBoundingClientRect();
		const box = content.getBoundingClientRect();
		const after = isRTL()
			? origin.right - box.left
			: box.right - origin.left;
		const start = Math.min( after + GAP, origin.width - MARKER_WIDTH );

		setMarkers(
			[ ...counts ].flatMap( ( [ clientId, count ] ) => {
				const block = doc.querySelector(
					`[data-block="${ clientId }"]`
				);

				return block
					? [
							{
								clientId,
								count,
								top:
									block.getBoundingClientRect().top -
									origin.top,
								start,
							},
						]
					: [];
			} )
		);
	}, [ layer, threads, blocks, layout ] );

	return (
		<div ref={ ref } className="liber-note-markers">
			{ markers.map( ( marker ) => (
				<button
					key={ marker.clientId }
					type="button"
					className="liber-note-marker"
					style={ {
						top: marker.top,
						insetInlineStart: marker.start,
					} }
					aria-label={ sprintf(
						/* translators: %d: number of notes. */
						_n(
							'%d note on this block',
							'%d notes on this block',
							marker.count,
							'liber'
						),
						marker.count
					) }
					onClick={ () => {
						selectBlock( marker.clientId );
						setOpen( true );
					} }
				>
					<Icon icon={ comment } size={ 16 } />
					<span aria-hidden="true">{ marker.count }</span>
				</button>
			) ) }
		</div>
	);
}
