/**
 * Sidebar: workspace name, New page, the page tree, and the trash.
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { plus, trash } from '@wordpress/icons';

import { config } from '../config';
import { useCreatePage } from '../use-create-page';
import { PageTree } from './page-tree';
import { TrashDialog } from './trash-dialog';

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
	const [ isTrashOpen, setTrashOpen ] = useState( false );

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
					onClick={ () => setTrashOpen( true ) }
				>
					{ __( 'Trash', 'liber' ) }
				</Button>
			) }
			{ isTrashOpen && (
				<TrashDialog onClose={ () => setTrashOpen( false ) } />
			) }
		</nav>
	);
}
