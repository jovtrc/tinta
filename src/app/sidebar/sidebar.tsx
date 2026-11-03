/**
 * Sidebar: workspace name, New page, the page tree, and the trash.
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { plus, trash } from '@wordpress/icons';

import { config } from '../config';
import { useCreatePage } from '../use-create-page';
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
