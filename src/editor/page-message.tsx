/**
 * What shows in place of a page while it loads, or when it can't open.
 */
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { SidebarBar } from '../app/sidebar/sidebar-toggle';

/**
 * A spinner while the page loads.
 */
export function LoadingPage() {
	return (
		<div className="tinta-editor">
			<SidebarBar />
			<div className="tinta-editor__message">
				<Spinner />
			</div>
		</div>
	);
}

/**
 * The page was deleted, or the user can't read it.
 */
export function MissingPage() {
	return (
		<div className="tinta-editor">
			<SidebarBar />
			<p className="tinta-editor__message">
				{ __(
					'This page doesn’t exist, or you can’t open it.',
					'tinta'
				) }
			</p>
		</div>
	);
}
