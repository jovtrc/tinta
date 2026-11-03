/**
 * Workspace layout: the sidebar and the open page's editor, plus ⌘K commands
 * and the trash. On small screens the sidebar is a drawer.
 */
import { Button, Popover, SlotFillProvider } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { SnackbarNotices } from '@wordpress/notices';

import { OpenPage } from '../editor/open-page';
import { WorkspaceCommands } from './commands';
import { config } from './config';
import { Drawer, DrawerBar, DrawerContext } from './drawer';
import { store as prefsStore } from './store/prefs';
import { Sidebar } from './sidebar/sidebar';
import { TrashDialog } from './sidebar/trash-dialog';
import { useCreatePage } from './use-create-page';
import { usePageRoute } from './use-page-route';
import { useTreeRefresh } from './use-tree-refresh';

/**
 * Renders the workspace.
 */
export function App() {
	const [ pageId, navigate ] = usePageRoute();
	const [ isTrashOpen, setTrashOpen ] = useState( false );
	const [ isDrawerOpen, setDrawerOpen ] = useState( false );
	const isMobile = useViewportMatch( 'medium', '<' );
	useTreeRefresh();
	const { visitPage } = useDispatch( prefsStore );
	const drawer = useMemo(
		() => ( { isMobile, isOpen: isDrawerOpen, setOpen: setDrawerOpen } ),
		[ isMobile, isDrawerOpen ]
	);

	const closeDrawer = useCallback( () => setDrawerOpen( false ), [] );
	const openPage = useCallback(
		( id: number ) => {
			setDrawerOpen( false );
			navigate( id );
		},
		[ navigate ]
	);

	useEffect( () => {
		setDrawerOpen( false );

		if ( pageId ) {
			visitPage( pageId );
		}
	}, [ pageId, visitPage ] );

	return (
		<SlotFillProvider>
			<DrawerContext.Provider value={ drawer }>
				<WorkspaceCommands
					onOpen={ openPage }
					onOpenTrash={ () => setTrashOpen( true ) }
				/>
				<div className="liber-workspace__layout">
					{ ! isMobile && (
						<Sidebar
							currentId={ pageId }
							onOpen={ openPage }
							onOpenTrash={ () => setTrashOpen( true ) }
						/>
					) }
					<main className="liber-workspace__main">
						{ pageId ? (
							<OpenPage key={ pageId } pageId={ pageId } />
						) : (
							<EmptyWorkspace onOpen={ openPage } />
						) }
					</main>
				</div>
				{ isMobile && isDrawerOpen && (
					<Drawer onClose={ closeDrawer }>
						<Sidebar
							currentId={ pageId }
							onOpen={ openPage }
							onOpenTrash={ () => setTrashOpen( true ) }
							onClose={ closeDrawer }
						/>
					</Drawer>
				) }
			</DrawerContext.Provider>
			{ isTrashOpen && (
				<TrashDialog onClose={ () => setTrashOpen( false ) } />
			) }
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
			<DrawerBar />
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
