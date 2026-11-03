/**
 * Read-only page for users who can't edit (Viewers): the server's rendered HTML.
 */
import { RawHTML } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';

import { LoadingPage, MissingPage } from './page-message';
import { usePageRecord } from './use-page-record';

/**
 * Renders the page's title and content.
 *
 * @param props        Props.
 * @param props.pageId Page ID.
 */
export function PageView( { pageId }: { pageId: number } ) {
	const { page, isMissing } = usePageRecord( pageId, 'view' );

	if ( isMissing ) {
		return <MissingPage />;
	}

	if ( ! page ) {
		return <LoadingPage />;
	}

	return (
		<div className="liber-editor">
			<div className="liber-editor__header">
				<div className="liber-editor__spacer" />
				<span className="liber-editor__status">
					{ __( 'View only', 'liber' ) }
				</span>
			</div>
			<div className="liber-reader">
				<article className="liber-reader__page">
					<h1 className="liber-reader__title">
						{ decodeEntities( page.title.rendered ) ||
							__( 'Untitled', 'liber' ) }
					</h1>
					<RawHTML className="liber-reader__content">
						{ page.content.rendered }
					</RawHTML>
				</article>
			</div>
		</div>
	);
}
