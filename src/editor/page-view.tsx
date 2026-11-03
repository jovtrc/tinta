/**
 * Read-only page for users who can't edit (Viewers): the server's rendered HTML.
 */
import { RawHTML } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';

import { PageMenu } from '../app/sidebar/page-menu';
import { SidebarToggle } from '../app/sidebar/sidebar-toggle';
import { Breadcrumbs } from './breadcrumbs';
import { EditedByLine, ICON_META } from './page-header';
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
		<div className="tinta-editor">
			<div className="tinta-editor__header">
				<SidebarToggle />
				<Breadcrumbs pageId={ pageId } />
				<div className="tinta-editor__spacer" />
				<span className="tinta-editor__status">
					{ __( 'View only', 'tinta' ) }
				</span>
				<PageMenu
					pageId={ pageId }
					label={ __( 'Page actions', 'tinta' ) }
					size="compact"
				/>
			</div>
			<div className="tinta-reader">
				<article className="tinta-reader__page">
					{ page.meta?.[ ICON_META ] && (
						<div className="tinta-reader__icon" aria-hidden="true">
							{ page.meta[ ICON_META ] }
						</div>
					) }
					<h1 className="tinta-reader__title">
						{ decodeEntities( page.title.rendered ) ||
							__( 'Untitled', 'tinta' ) }
					</h1>
					<EditedByLine
						name={ page.last_editor?.name }
						avatar={ page.last_editor?.avatar }
						modifiedGmt={ page.modified_gmt }
					/>
					<RawHTML className="tinta-reader__content">
						{ page.content.rendered }
					</RawHTML>
				</article>
			</div>
		</div>
	);
}
