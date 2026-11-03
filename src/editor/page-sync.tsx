/**
 * Shows the title being typed, and a new icon, in the page tree right away.
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect } from '@wordpress/element';

import { store as workspaceStore } from '../app/store';
import { ICON_META } from './page-header';

/**
 * Copies the edited title and icon into the workspace store.
 *
 * @param props        Props.
 * @param props.pageId Page ID.
 */
export function PageSync( { pageId }: { pageId: number } ) {
	const { title, icon } = useSelect( ( select ) => {
		const { getEditedPostAttribute } = select( editorStore );
		const meta = getEditedPostAttribute( 'meta' ) as
			Record< string, string > | undefined;

		return {
			title: getEditedPostAttribute( 'title' ) as string,
			icon: meta?.[ ICON_META ] ?? '',
		};
	}, [] );
	const { updatePage } = useDispatch( workspaceStore );

	useEffect( () => {
		updatePage( pageId, { title, icon } );
	}, [ pageId, title, icon, updatePage ] );

	return null;
}
