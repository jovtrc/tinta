/**
 * Sidebar: workspace name, Search, New page, Pinned, Recent, the page tree,
 * the trash, and the account menu.
 */
import { Button } from '@wordpress/components';
import { store as commandsStore } from '@wordpress/commands';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { closeSmall, drawerLeft, plus, search, trash } from '@wordpress/icons';
import { displayShortcut } from '@wordpress/keycodes';

import { config } from '../config';
import { store as prefsStore } from '../store/prefs';
import { store as uiStore } from '../store/ui';
import { useCreatePage } from '../use-create-page';
import { PageContextMenu } from './page-menu';
import { PageSection } from './page-section';
import { PageTree } from './page-tree';
import { useSidebar } from './use-sidebar';
import { UserMenu } from './user-menu';

interface SidebarProps {
	currentId: number;
	onOpen: ( pageId: number ) => void;
}

/**
 * Renders the sidebar.
 *
 * @param props           Props.
 * @param props.currentId Open page.
 * @param props.onOpen    Opens a page.
 */
export function Sidebar( { currentId, onOpen }: SidebarProps ) {
	const createPage = useCreatePage( onOpen );
	const { isMobile, setOpen } = useSidebar();
	const prefs = useSelect(
		( select ) => select( prefsStore ).getPrefs(),
		[]
	);
	const { open: openCommandPalette } = useDispatch( commandsStore );
	const { openDialog } = useDispatch( uiStore );
	const { updatePrefs } = useDispatch( prefsStore );

	return (
		<nav
			className="liber-sidebar"
			aria-label={ __( 'Workspace', 'liber' ) }
		>
			<div className="liber-sidebar__header">
				{ config.siteIcon ? (
					<img
						className="liber-sidebar__icon"
						src={ config.siteIcon }
						alt=""
						width={ 22 }
						height={ 22 }
					/>
				) : (
					<span className="liber-sidebar__icon" aria-hidden="true">
						{ config.siteName.trim().charAt( 0 ).toUpperCase() }
					</span>
				) }
				<span className="liber-sidebar__name">{ config.siteName }</span>
				<Button
					icon={ isMobile ? closeSmall : drawerLeft }
					label={ __( 'Close sidebar', 'liber' ) }
					size="small"
					onClick={ () => setOpen( false ) }
				/>
			</div>
			<Button
				className="liber-sidebar__action"
				icon={ search }
				onClick={ () => openCommandPalette() }
			>
				{ __( 'Search', 'liber' ) }
				<kbd className="liber-sidebar__shortcut" aria-hidden="true">
					{ displayShortcut.primary( 'k' ) }
				</kbd>
			</Button>
			{ config.canCreate && (
				<Button
					className="liber-sidebar__action"
					icon={ plus }
					onClick={ () => createPage() }
				>
					{ __( 'New page', 'liber' ) }
				</Button>
			) }
			<PageSection
				title={ __( 'Pinned', 'liber' ) }
				pageIds={ prefs.pinned }
				currentId={ currentId }
				onOpen={ onOpen }
				onReorder={ ( pinned ) => updatePrefs( { pinned } ) }
			/>
			<PageSection
				title={ __( 'Recent', 'liber' ) }
				pageIds={ prefs.recent }
				currentId={ currentId }
				onOpen={ onOpen }
			/>
			<div className="liber-sidebar__heading-row">
				<h2 className="liber-sidebar__heading">
					{ __( 'Pages', 'liber' ) }
				</h2>
				{ config.canCreate && (
					<Button
						className="liber-sidebar__heading-action"
						icon={ plus }
						size="small"
						label={ __( 'Add a page', 'liber' ) }
						onClick={ () => createPage() }
					/>
				) }
			</div>
			<PageTree currentId={ currentId } onOpen={ onOpen } />
			{ config.canCreate && (
				<Button
					className="liber-sidebar__action liber-sidebar__trash"
					icon={ trash }
					onClick={ () => openDialog( 'trash' ) }
				>
					{ __( 'Trash', 'liber' ) }
				</Button>
			) }
			<UserMenu />
			<PageContextMenu />
		</nav>
	);
}
