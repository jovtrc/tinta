/**
 * The open workspace dialog, wherever it was opened from: the tree, the page
 * header, the account menu or ⌘K (see the `liber/ui` store).
 */
import { useDispatch, useSelect } from '@wordpress/data';

import { SetupWizard } from './setup/setup-wizard';
import { MoveDialog } from './sidebar/move-dialog';
import { RenameDialog } from './sidebar/rename-dialog';
import { SettingsDialog } from './sidebar/settings-dialog';
import { TrashConfirm } from './sidebar/trash-confirm';
import { TrashDialog } from './sidebar/trash-dialog';
import { store as workspaceStore } from './store';
import { store as uiStore } from './store/ui';

interface DialogsProps {
	currentId: number;
	onOpen: ( pageId: number ) => void;
}

/**
 * Renders the dialog, if one is open.
 *
 * @param props           Props.
 * @param props.currentId Open page.
 * @param props.onOpen    Opens a page.
 */
export function Dialogs( { currentId, onOpen }: DialogsProps ) {
	const dialog = useSelect( ( select ) => select( uiStore ).getDialog(), [] );
	const page = useSelect(
		( select ) =>
			select( workspaceStore )
				.getPages()
				?.find( ( item ) => item.id === dialog?.pageId ),
		[ dialog ]
	);
	const { closeDialog } = useDispatch( uiStore );

	switch ( dialog?.name ) {
		case 'settings':
			return <SettingsDialog onClose={ closeDialog } />;
		case 'setup':
			return <SetupWizard onClose={ closeDialog } />;
		case 'trash':
			return <TrashDialog onClose={ closeDialog } />;
	}

	if ( ! dialog || ! page ) {
		return null;
	}

	switch ( dialog.name ) {
		case 'rename':
			return <RenameDialog page={ page } onClose={ closeDialog } />;
		case 'move':
			return <MoveDialog page={ page } onClose={ closeDialog } />;
		case 'move-to-trash':
			return (
				<TrashConfirm
					page={ page }
					currentId={ currentId }
					onOpen={ onOpen }
					onClose={ closeDialog }
				/>
			);
	}

	return null;
}
