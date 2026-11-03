/**
 * What shows in place of a page while it loads, or when it can't open.
 */
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { DrawerBar } from '../app/drawer';

/**
 * A spinner while the page loads.
 */
export function LoadingPage() {
	return (
		<div className="liber-editor">
			<DrawerBar />
			<div className="liber-editor__message">
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
		<div className="liber-editor">
			<DrawerBar />
			<p className="liber-editor__message">
				{ __(
					'This page doesn’t exist, or you can’t open it.',
					'liber'
				) }
			</p>
		</div>
	);
}
