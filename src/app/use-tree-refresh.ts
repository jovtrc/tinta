/**
 * Refetches the page tree when a Heartbeat tick reports a newer generation,
 * so other people's changes show up without a reload.
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { addAction, removeAction } from '@wordpress/hooks';

import { store as workspaceStore } from './store';

const NAMESPACE = 'liber/tree-refresh';

/**
 * Asks for the generation on each tick and refetches when it changed.
 */
export function useTreeRefresh() {
	const generation = useSelect(
		( select ) => select( workspaceStore ).getGeneration(),
		[]
	);
	const { invalidateResolution } = useDispatch( workspaceStore );

	useEffect( () => {
		if ( generation === null ) {
			return;
		}

		addAction(
			'heartbeat.send',
			NAMESPACE,
			( data: Record< string, unknown > ) => {
				data.liber_tree = generation;
			}
		);
		addAction(
			'heartbeat.tick',
			NAMESPACE,
			( response: Record< string, unknown > ) => {
				const latest = response.liber_tree;
				if ( typeof latest === 'number' && latest !== generation ) {
					invalidateResolution( 'getPages', [] );
				}
			}
		);

		return () => {
			removeAction( 'heartbeat.send', NAMESPACE );
			removeAction( 'heartbeat.tick', NAMESPACE );
		};
	}, [ generation, invalidateResolution ] );
}
