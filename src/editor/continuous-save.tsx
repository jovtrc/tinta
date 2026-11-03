/**
 * Saves the page while you write: a moment after the last edit, and when you
 * leave the page. Failed saves retry, waiting longer each time.
 */
import { store as coreStore } from '@wordpress/core-data';
import { useRegistry, useSelect } from '@wordpress/data';
import type { DataRegistry } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

import { POST_TYPE } from '../app/config';

const SAVE_DELAY = 1000;

const MAX_RETRY_DELAY = 30_000;

/**
 * Watches the page's edits and saves them.
 *
 * @param props        Props.
 * @param props.pageId Page ID.
 */
export function ContinuousSave( { pageId }: { pageId: number } ) {
	const registry = useRegistry();
	const failures = useRef( 0 );
	const { edits, isSaving } = useSelect(
		( select ) => ( {
			edits: select( coreStore ).getEntityRecordNonTransientEdits(
				'postType',
				POST_TYPE,
				pageId
			),
			isSaving: select( coreStore ).isSavingEntityRecord(
				'postType',
				POST_TYPE,
				pageId
			),
		} ),
		[ pageId ]
	);

	useEffect( () => {
		if ( isSaving || ! Object.keys( edits ).length ) {
			return;
		}

		const delay = Math.min(
			SAVE_DELAY * 2 ** failures.current,
			MAX_RETRY_DELAY
		);
		const timer = setTimeout( async () => {
			failures.current = ( await savePage( registry, pageId ) )
				? 0
				: failures.current + 1;
		}, delay );

		return () => clearTimeout( timer );
	}, [ edits, isSaving, pageId, registry ] );

	useEffect(
		() => () => {
			if (
				registry
					.select( coreStore )
					.hasEditsForEntityRecord( 'postType', POST_TYPE, pageId )
			) {
				savePage( registry, pageId );
			}
		},
		[ pageId, registry ]
	);

	return null;
}

/**
 * Saves the page's pending edits; shows a notice when that fails.
 *
 * @param registry Data registry.
 * @param pageId   Page ID.
 * @return Whether the save worked.
 */
async function savePage(
	registry: DataRegistry,
	pageId: number
): Promise< boolean > {
	try {
		await registry
			.dispatch( coreStore )
			.saveEditedEntityRecord( 'postType', POST_TYPE, pageId, {
				throwOnError: true,
			} );
		registry.dispatch( noticesStore ).removeNotice( 'liber-save-error' );

		return true;
	} catch {
		registry
			.dispatch( noticesStore )
			.createErrorNotice(
				__( 'Your changes aren’t saved yet. Retrying…', 'liber' ),
				{ id: 'liber-save-error', type: 'snackbar' }
			);

		return false;
	}
}
