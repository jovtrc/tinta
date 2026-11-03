/**
 * Loads a page record through core-data.
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

import { POST_TYPE } from '../app/config';

export interface PageRecord {
	id: number;
	title: { raw?: string; rendered: string };
	content: { raw?: string; rendered: string };
	[ key: string ]: unknown;
}

/**
 * The page, and whether loading it failed (deleted, or not readable).
 *
 * @param pageId  Page ID.
 * @param context "edit" for the editor, "view" for readers.
 */
export function usePageRecord( pageId: number, context: 'edit' | 'view' ) {
	return useSelect(
		( select ) => {
			const args: [ string, string, number, object? ] =
				context === 'edit'
					? [ 'postType', POST_TYPE, pageId ]
					: [ 'postType', POST_TYPE, pageId, { context } ];
			const page = select( coreStore ).getEntityRecord( ...args ) as
				PageRecord | undefined;

			return {
				page,
				isMissing:
					! page &&
					select( coreStore ).hasFinishedResolution(
						'getEntityRecord',
						args
					),
			};
		},
		[ pageId, context ]
	);
}
