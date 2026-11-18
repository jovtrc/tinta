/**
 * Workspace layout: the sidebar and the open page's editor, plus ⌘K commands
 * and dialogs. On small screens the sidebar is a drawer.
 */
import { Button, Popover, SlotFillProvider } from '@wordpress/components';
import { usePrevious } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { focus } from '@wordpress/dom';
import { useCallback, useEffect, useRef } from '@wordpress/element';
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
	const focusRefs = useSidebarFocus( sidebar.isOpen, pageId );
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
		'tinta-workspace__layout',
		! sidebar.isOpen && ! sidebar.isMobile && 'is-sidebar-hidden',
	]
		.filter( Boolean )
		.join( ' ' );

	return (
		<SlotFillProvider>
			<WorkspaceCommands currentId={ pageId } onOpen={ openPage } />
			<div ref={ focusRefs.layout } className={ layoutClass }>
				{ sidebar.isOpen && ! sidebar.isMobile && (
					<Sidebar currentId={ pageId } onOpen={ openPage } />
				) }
				<main
					ref={ focusRefs.main }
					className="tinta-workspace__main"
					tabIndex={ -1 }
				>
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
			<SnackbarNotices className="tinta-workspace__snackbar" />
			<Popover.Slot />
		</SlotFillProvider>
	);
}

/**
 * Refs for the layout and the main area that keep focus when the sidebar shows
 * or hides with the focused button: the first control takes it (the
 * sidebar's, or the button that shows the sidebar again), or the main area
 * when a page opens from the drawer, as its header is still loading.
 *
 * @param isOpen Whether the sidebar shows.
 * @param pageId Open page.
 */
function useSidebarFocus( isOpen: boolean, pageId: number ) {
	const layout = useRef< HTMLDivElement >( null );
	const main = useRef< HTMLElement >( null );
	const wasOpen = usePrevious( isOpen );
	const previousPageId = usePrevious( pageId );

	useEffect( () => {
		const ownerDocument = layout.current?.ownerDocument;

		if (
			wasOpen === undefined ||
			wasOpen === isOpen ||
			! layout.current ||
			ownerDocument?.activeElement !== ownerDocument?.body
		) {
			return;
		}

		if ( pageId !== previousPageId ) {
			main.current?.focus();
		} else {
			focus.tabbable.find( layout.current )[ 0 ]?.focus();
		}
	}, [ isOpen, wasOpen, pageId, previousPageId ] );

	return { layout, main };
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
		<div className="tinta-editor">
			<SidebarBar />
			<div className="tinta-workspace__empty">
				<p>{ __( 'No pages yet.', 'tinta' ) }</p>
				{ config.canCreate && (
					<Button variant="primary" onClick={ () => createPage() }>
						{ __( 'Create the first page', 'tinta' ) }
					</Button>
				) }
			</div>
		</div>
	);
}
