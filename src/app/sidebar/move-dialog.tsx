/**
 * "Move to…": the keyboard way to move a page. Pick a new parent, or the top
 * level; the page goes last among its new siblings. Parents inside the page
 * itself, or that would push it past level 5, aren't offered.
 */
import { Button, ComboboxControl, Modal } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

import { MAX_DEPTH } from '../config';
import { store as workspaceStore, type TreePage } from '../store';
import { ancestorsOf, heightOf, levelOf, subtreeOf } from '../tree-utils';

const TOP_LEVEL = '0';

interface MoveDialogProps {
	page: TreePage;
	onClose: () => void;
}

/**
 * Renders the dialog.
 *
 * @param props         Props.
 * @param props.page    Page to move.
 * @param props.onClose Closes the dialog.
 */
export function MoveDialog( { page, onClose }: MoveDialogProps ) {
	const pages = useSelect(
		( select ) => select( workspaceStore ).getPages() ?? [],
		[]
	);
	const { movePage } = useDispatch( workspaceStore );
	const { createErrorNotice } = useDispatch( noticesStore );
	const [ parent, setParent ] = useState< string | null >( null );
	const subtree = subtreeOf( page.id, pages );
	const height = heightOf( page.id, pages );

	const options = [
		{ value: TOP_LEVEL, label: __( 'Top level', 'tinta' ) },
		...pages
			.filter(
				( item ) =>
					! subtree.includes( item.id ) &&
					item.id !== page.parent &&
					levelOf( item.id, pages ) + height <= MAX_DEPTH
			)
			.map( ( item ) => ( {
				value: String( item.id ),
				label: pathOf( item, pages ),
			} ) ),
	].filter( ( option ) => option.value !== String( page.parent ) );

	const move = async () => {
		const parentId = Number( parent );
		const position = pages.filter(
			( item ) => item.parent === parentId && item.id !== page.id
		).length;

		onClose();
		try {
			await movePage( page.id, parentId, position );
		} catch {
			createErrorNotice( __( 'The page could not be moved.', 'tinta' ), {
				type: 'snackbar',
			} );
		}
	};

	return (
		<Modal
			title={ sprintf(
				/* translators: %s: page title. */
				__( 'Move “%s”', 'tinta' ),
				titleOf( page )
			) }
			onRequestClose={ onClose }
			size="medium"
		>
			<ComboboxControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Move inside', 'tinta' ) }
				value={ parent }
				options={ options }
				onChange={ ( value ) => setParent( value ?? null ) }
			/>
			<div className="tinta-dialog__actions">
				<Button variant="tertiary" onClick={ onClose }>
					{ __( 'Cancel', 'tinta' ) }
				</Button>
				<Button
					variant="primary"
					disabled={ parent === null }
					onClick={ move }
				>
					{ __( 'Move', 'tinta' ) }
				</Button>
			</div>
		</Modal>
	);
}

/**
 * A page's title as text, or "Untitled".
 *
 * @param page Page.
 */
function titleOf( page: TreePage ): string {
	return decodeEntities( page.title ) || __( 'Untitled', 'tinta' );
}

/**
 * "Parent › Page", so pages with the same title can be told apart.
 *
 * @param page  Page.
 * @param pages Flat page list.
 */
function pathOf( page: TreePage, pages: TreePage[] ): string {
	return [ ...ancestorsOf( page.id, pages ).reverse(), page.id ]
		.map( ( id ) => titleOf( pages.find( ( item ) => item.id === id )! ) )
		.join( ' › ' );
}
