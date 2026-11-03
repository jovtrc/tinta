/**
 * Workspace layout: the sidebar and the open page's editor, plus ⌘K commands
 * and dialogs. On small screens the sidebar is a drawer.
 */
import { Button, Popover, SlotFillProvider } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { SnackbarNotices } from '@wordpress/notices';

import { OpenPage } from '../editor/open-page';
import { WorkspaceCommands } from './commands';
import { config } from './config';
import { Dialogs } from './dialogs';
import { Drawer } from './sidebar/drawer';
import { Sidebar } from './sidebar/sidebar';
import { SidebarBar } from './sidebar/sidebar-toggle';
import { useSidebar } from './sidebar/use-sidebar';
import { store as prefsStore } from './store/prefs';
import { store as uiStore } from './store/ui';
import { useCreatePage } from './use-create-page';
import { usePageRoute } from './use-page-route';
import { useTreeRefresh } from './use-tree-refresh';

/**
 * Renders the workspace.
 */
export function App() {
	const [ pageId, navigate ] = usePageRoute();
	const sidebar = useSidebar();
	useTreeRefresh();
	const { visitPage } = useDispatch( prefsStore );
	const { openDialog, setDrawerOpen } = useDispatch( uiStore );
	const closeDrawer = useCallback(
		() => setDrawerOpen( false ),
		[ setDrawerOpen ]
	);

	const openPage = useCallback(
		( id: number ) => {
			closeDrawer();
			navigate( id );
		},
		[ closeDrawer, navigate ]
	);

	useEffect( () => {
		if ( config.setup && ! config.setup.done ) {
			openDialog( 'setup' );
		}
	}, [ openDialog ] );

	useEffect( () => {
		closeDrawer();

		if ( pageId ) {
			visitPage( pageId );
		}
	}, [ pageId, visitPage, closeDrawer ] );

	const layoutClass = [
		'liber-workspace__layout',
		! sidebar.isOpen && ! sidebar.isMobile && 'is-sidebar-hidden',
	]
		.filter( Boolean )
		.join( ' ' );

	return (
		<SlotFillProvider>
			<WorkspaceCommands currentId={ pageId } onOpen={ openPage } />
			<div className={ layoutClass }>
				{ sidebar.isOpen && ! sidebar.isMobile && (
					<Sidebar currentId={ pageId } onOpen={ openPage } />
				) }
				<main className="liber-workspace__main">
					{ pageId ? (
						<OpenPage key={ pageId } pageId={ pageId } />
					) : (
						<EmptyWorkspace onOpen={ openPage } />
					) }
				</main>
			</div>
			{ sidebar.isOpen && sidebar.isMobile && (
				<Drawer onClose={ closeDrawer }>
					<Sidebar currentId={ pageId } onOpen={ openPage } />
				</Drawer>
			) }
			<Dialogs currentId={ pageId } onOpen={ openPage } />
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
		<div className="liber-editor">
			<SidebarBar />
			<div className="liber-workspace__empty">
				<p>{ __( 'No pages yet.', 'liber' ) }</p>
				{ config.canCreate && (
					<Button variant="primary" onClick={ () => createPage() }>
						{ __( 'Create the first page', 'liber' ) }
					</Button>
				) }
			</div>
		</div>
	);
}
