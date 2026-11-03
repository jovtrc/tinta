/**
 * Renames a page from its menu.
 */
import { Button, Modal, TextControl } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import type { FormEvent } from 'react';

import { store as workspaceStore, type TreePage } from '../store';

interface RenameDialogProps {
	page: TreePage;
	onClose: () => void;
}

/**
 * Renders the dialog.
 *
 * @param props         Props.
 * @param props.page    Page to rename.
 * @param props.onClose Closes the dialog.
 */
export function RenameDialog( { page, onClose }: RenameDialogProps ) {
	const [ title, setTitle ] = useState( decodeEntities( page.title ) );
	const { renamePage } = useDispatch( workspaceStore );
	const { createErrorNotice } = useDispatch( noticesStore );

	const rename = async ( event: FormEvent ) => {
		event.preventDefault();
		onClose();
		try {
			await renamePage( page.id, title.trim() );
		} catch {
			createErrorNotice(
				__( 'The page could not be renamed.', 'liber' ),
				{ type: 'snackbar' }
			);
		}
	};

	return (
		<Modal
			title={ __( 'Rename page', 'liber' ) }
			onRequestClose={ onClose }
			focusOnMount="firstContentElement"
			size="small"
		>
			<form onSubmit={ rename }>
				<TextControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Title', 'liber' ) }
					placeholder={ __( 'Untitled', 'liber' ) }
					value={ title }
					onChange={ setTitle }
					onFocus={ ( event ) => event.target.select() }
				/>
				<div className="liber-dialog__actions">
					<Button variant="tertiary" onClick={ onClose }>
						{ __( 'Cancel', 'liber' ) }
					</Button>
					<Button variant="primary" type="submit">
						{ __( 'Rename', 'liber' ) }
					</Button>
				</div>
			</form>
		</Modal>
	);
}
