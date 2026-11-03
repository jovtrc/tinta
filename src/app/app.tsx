/**
 * Workspace layout: the sidebar and the open page's editor.
 */
import { Button, Popover, SlotFillProvider } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { SnackbarNotices } from '@wordpress/notices';

import { PageEditor } from '../editor/page-editor';
import { Sidebar } from './sidebar/sidebar';
import { useCreatePage } from './use-create-page';
import { usePageRoute } from './use-page-route';

/**
 * Renders the workspace.
 */
export function App() {
	const [ pageId, openPage ] = usePageRoute();

	return (
		<SlotFillProvider>
			<div className="liber-workspace__layout">
				<Sidebar currentId={ pageId } onOpen={ openPage } />
				<main className="liber-workspace__main">
					{ pageId ? (
						<PageEditor key={ pageId } pageId={ pageId } />
					) : (
						<EmptyWorkspace onOpen={ openPage } />
					) }
				</main>
			</div>
			<SnackbarNotices className="liber-workspace__snackbar" />
			<Popover.Slot />
		</SlotFillProvider>
	);
}

/**
 * Shown when the workspace has no pages yet.
 *
 * @param props        Props.
 * @param props.onOpen Opens a page.
 */
function EmptyWorkspace( { onOpen }: { onOpen: ( pageId: number ) => void } ) {
	const createPage = useCreatePage( onOpen );

	return (
		<div className="liber-workspace__empty">
			<p>{ __( 'No pages yet.', 'liber' ) }</p>
			<Button variant="primary" onClick={ () => createPage() }>
				{ __( 'Create the first page', 'liber' ) }
			</Button>
		</div>
	);
}
