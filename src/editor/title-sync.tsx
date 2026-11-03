/**
 * Shows the title being typed in the page tree right away.
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect } from '@wordpress/element';

import { store as workspaceStore } from '../app/store';

/**
 * Copies the edited title into the workspace store.
 *
 * @param props        Props.
 * @param props.pageId Page ID.
 */
export function TitleSync( { pageId }: { pageId: number } ) {
	const title = useSelect(
		( select ) =>
			select( editorStore ).getEditedPostAttribute( 'title' ) as string,
		[]
	);
	const { renamePage } = useDispatch( workspaceStore );

	useEffect( () => {
		renamePage( pageId, title );
	}, [ pageId, title, renamePage ] );

	return null;
}
