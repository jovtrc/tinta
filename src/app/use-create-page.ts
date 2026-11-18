/**
 * Creates a page and opens it, marked as new so its title gets focus.
 */
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';

import { store as workspaceStore } from './store';
import { store as uiStore } from './store/ui';

/**
 * A function that creates a page under a parent and opens it.
 *
 * @param onOpen Opens a page.
 */
export function useCreatePage( onOpen: ( pageId: number ) => void ) {
	const { createPage } = useDispatch( workspaceStore );
	const { setNewPage } = useDispatch( uiStore );
	const { createErrorNotice } = useDispatch( noticesStore );

	return async ( parent = 0 ) => {
		try {
			const pageId = await createPage( parent );
			setNewPage( pageId );
			onOpen( pageId );
		} catch {
			createErrorNotice(
				__( 'The page could not be created.', 'tinta' ),
				{
					type: 'snackbar',
				}
			);
		}
	};
}
