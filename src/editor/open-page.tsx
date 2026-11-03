/**
 * The open page: the editor for users who can edit it, a reader for the rest.
 * The app remounts it per page (`key`), so every page starts fresh.
 */
import { LoadingPage, MissingPage } from './page-message';
import { PageEditor } from './page-editor';
import { PageView } from './page-view';
import { usePageAccess } from './use-page-access';
import { usePageRecord } from './use-page-record';

/**
 * Picks the editor or the reader once the page's lock answers.
 * The editable record loads at the same time, so switching pages stays quick.
 *
 * @param props        Props.
 * @param props.pageId Page ID.
 */
export function OpenPage( { pageId }: { pageId: number } ) {
	const access = usePageAccess( pageId );
	const { page, isMissing } = usePageRecord( pageId, 'edit' );

	if ( access.mode === 'read-only' ) {
		return <PageView pageId={ pageId } />;
	}

	if ( isMissing ) {
		return <MissingPage />;
	}

	if ( access.mode === 'loading' || ! page ) {
		return <LoadingPage />;
	}

	return <PageEditor page={ page } lock={ access.lock } />;
}
