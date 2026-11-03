/**
 * Sidebar: workspace name, New page, Pinned, Recent, the page tree, and the trash.
 */
import { Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { plus, trash } from '@wordpress/icons';

import { config } from '../config';
import { store as prefsStore } from '../store/prefs';
import { useCreatePage } from '../use-create-page';
import { PageSection } from './page-section';
import { PageTree } from './page-tree';

interface SidebarProps {
	currentId: number;
	onOpen: ( pageId: number ) => void;
	onOpenTrash: () => void;
}

/**
 * Renders the sidebar.
 *
 * @param props             Props.
 * @param props.currentId   Open page.
 * @param props.onOpen      Opens a page.
 * @param props.onOpenTrash Opens the trash.
 */
export function Sidebar( { currentId, onOpen, onOpenTrash }: SidebarProps ) {
	const createPage = useCreatePage( onOpen );
	const prefs = useSelect(
		( select ) => select( prefsStore ).getPrefs(),
		[]
	);

	return (
		<nav
			className="liber-sidebar"
			aria-label={ __( 'Workspace', 'liber' ) }
		>
			<div className="liber-sidebar__header">{ config.siteName }</div>
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
			/>
			<PageSection
				title={ __( 'Recent', 'liber' ) }
				pageIds={ prefs.recent }
				currentId={ currentId }
				onOpen={ onOpen }
			/>
			<h2 className="liber-sidebar__heading">
				{ __( 'Pages', 'liber' ) }
			</h2>
			<PageTree currentId={ currentId } onOpen={ onOpen } />
			{ config.canCreate && (
				<Button
					className="liber-sidebar__action liber-sidebar__trash"
					icon={ trash }
					onClick={ onOpenTrash }
				>
					{ __( 'Trash', 'liber' ) }
				</Button>
			) }
		</nav>
	);
}
