/**
 * Sidebar: workspace name, Search, New page, Pinned, Recent (other pages
 * visited lately, not pinned), the page tree, the trash, and the account menu.
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

const RECENT_SHOWN = 5;

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
			className="tinta-sidebar"
			aria-label={ __( 'Workspace', 'tinta' ) }
		>
			<div className="tinta-sidebar__header">
				{ config.siteIcon ? (
					<img
						className="tinta-sidebar__icon"
						src={ config.siteIcon }
						alt=""
						width={ 22 }
						height={ 22 }
					/>
				) : (
					<span className="tinta-sidebar__icon" aria-hidden="true">
						{ config.siteName.trim().charAt( 0 ).toUpperCase() }
					</span>
				) }
				<span className="tinta-sidebar__name">{ config.siteName }</span>
				<Button
					icon={ isMobile ? closeSmall : drawerLeft }
					label={ __( 'Close sidebar', 'tinta' ) }
					size="small"
					onClick={ () => setOpen( false ) }
				/>
			</div>
			<Button
				className="tinta-sidebar__action"
				icon={ search }
				onClick={ () => openCommandPalette() }
			>
				{ __( 'Search', 'tinta' ) }
				<kbd className="tinta-sidebar__shortcut" aria-hidden="true">
					{ displayShortcut.primary( 'k' ) }
				</kbd>
			</Button>
			{ config.canCreate && (
				<Button
					className="tinta-sidebar__action"
					icon={ plus }
					onClick={ () => createPage() }
				>
					{ __( 'New page', 'tinta' ) }
				</Button>
			) }
			<PageSection
				title={ __( 'Pinned', 'tinta' ) }
				list="pinned"
				pageIds={ prefs.pinned }
				onOpen={ onOpen }
				onReorder={ ( pinned ) => updatePrefs( { pinned } ) }
			/>
			<PageSection
				title={ __( 'Recent', 'tinta' ) }
				list="recent"
				pageIds={ prefs.recent
					.filter(
						( id ) =>
							id !== currentId && ! prefs.pinned.includes( id )
					)
					.slice( 0, RECENT_SHOWN ) }
				onOpen={ onOpen }
			/>
			<div className="tinta-sidebar__heading-row">
				<h2 className="tinta-sidebar__heading">
					{ __( 'Pages', 'tinta' ) }
				</h2>
				{ config.canCreate && (
					<Button
						className="tinta-sidebar__heading-action"
						icon={ plus }
						size="small"
						label={ __( 'Add a page', 'tinta' ) }
						onClick={ () => createPage() }
					/>
				) }
			</div>
			<PageTree currentId={ currentId } onOpen={ onOpen } />
			{ config.canCreate && (
				<Button
					className="tinta-sidebar__action tinta-sidebar__trash"
					icon={ trash }
					onClick={ () => openDialog( 'trash' ) }
				>
					{ __( 'Trash', 'tinta' ) }
				</Button>
			) }
			<UserMenu />
			<PageContextMenu />
		</nav>
	);
}
