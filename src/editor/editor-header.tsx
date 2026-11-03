/**
 * Editor header: the mobile menu button, undo/redo, save status, Notes and the
 * block settings toggle.
 */
import { Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import {
	EditorHistoryRedo,
	EditorHistoryUndo,
	store as editorStore,
} from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { drawerRight } from '@wordpress/icons';

import { DrawerToggle } from '../app/drawer';
import { NotesToggle } from '../notes/notes-panel';

interface EditorHeaderProps {
	isInspectorOpen: boolean;
	onToggleInspector: () => void;
}

/**
 * Renders the header.
 *
 * @param props                   Props.
 * @param props.isInspectorOpen   Whether block settings are shown.
 * @param props.onToggleInspector Shows or hides block settings.
 */
export function EditorHeader( {
	isInspectorOpen,
	onToggleInspector,
}: EditorHeaderProps ) {
	return (
		<div className="liber-editor__header">
			<DrawerToggle />
			<EditorHistoryUndo />
			<EditorHistoryRedo />
			<div className="liber-editor__spacer" />
			<SaveStatus />
			<NotesToggle />
			<Button
				icon={ drawerRight }
				label={ __( 'Block settings', 'liber' ) }
				isPressed={ isInspectorOpen }
				onClick={ onToggleInspector }
				size="compact"
			/>
		</div>
	);
}

/**
 * "Saving…" while there are unsaved edits, then "Saved".
 */
function SaveStatus() {
	const isSaved = useSelect(
		( select ) =>
			! select( editorStore ).isEditedPostDirty() &&
			! select( editorStore ).isSavingPost(),
		[]
	);

	return (
		<span className="liber-editor__status" aria-live="polite">
			{ isSaved ? __( 'Saved', 'liber' ) : __( 'Saving…', 'liber' ) }
		</span>
	);
}
