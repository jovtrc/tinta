/**
 * Confirms moving a page, and its subpages, to the trash.
 */
import { Button, Modal } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

import { store as workspaceStore, type TreePage } from '../store';
import { subtreeOf } from '../tree-utils';

interface TrashConfirmProps {
	page: TreePage;
	currentId: number;
	onOpen: ( pageId: number ) => void;
	onClose: () => void;
}

/**
 * Renders the dialog. If the open page goes to the trash, opens its parent,
 * or the first page left.
 *
 * @param props           Props.
 * @param props.page      Page to trash.
 * @param props.currentId Open page.
 * @param props.onOpen    Opens a page.
 * @param props.onClose   Closes the dialog.
 */
export function TrashConfirm( {
	page,
	currentId,
	onOpen,
	onClose,
}: TrashConfirmProps ) {
	const pages = useSelect(
		( select ) => select( workspaceStore ).getPages() ?? [],
		[]
	);
	const { trashPage } = useDispatch( workspaceStore );
	const { createErrorNotice } = useDispatch( noticesStore );
	const [ isBusy, setBusy ] = useState( false );
	const subtree = subtreeOf( page.id, pages );
	const subpages = subtree.length - 1;
	const title = decodeEntities( page.title ) || __( 'Untitled', 'liber' );

	const confirm = async () => {
		setBusy( true );
		try {
			await trashPage( page.id );
			if ( subtree.includes( currentId ) ) {
				const next = pages.find(
					( { id, parent } ) => ! parent && ! subtree.includes( id )
				);
				onOpen( page.parent || next?.id || 0 );
			}
		} catch {
			createErrorNotice(
				__( 'The page could not be moved to the trash.', 'liber' ),
				{ type: 'snackbar' }
			);
		}
		onClose();
	};

	return (
		<Modal
			title={ __( 'Move to trash?', 'liber' ) }
			onRequestClose={ onClose }
			size="small"
		>
			<p>
				{ subpages
					? sprintf(
							/* translators: 1: page title, 2: number of subpages. */
							_n(
								'“%1$s” and its %2$d subpage go to the trash.',
								'“%1$s” and its %2$d subpages go to the trash.',
								subpages,
								'liber'
							),
							title,
							subpages
						)
					: sprintf(
							/* translators: %s: page title. */
							__( '“%s” goes to the trash.', 'liber' ),
							title
						) }
			</p>
			<div className="liber-dialog__actions">
				<Button variant="tertiary" onClick={ onClose }>
					{ __( 'Cancel', 'liber' ) }
				</Button>
				<Button
					variant="primary"
					isDestructive
					isBusy={ isBusy }
					disabled={ isBusy }
					onClick={ confirm }
				>
					{ __( 'Move to trash', 'liber' ) }
				</Button>
			</div>
		</Modal>
	);
}
