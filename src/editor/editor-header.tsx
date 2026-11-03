/**
 * Editor header: the sidebar button (when the sidebar is hidden or a drawer),
 * undo/redo, save status, Notes, the block settings toggle and the page menu.
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

import { PageMenu } from '../app/sidebar/page-menu';
import { SidebarToggle } from '../app/sidebar/sidebar-toggle';
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
	const pageId = useSelect(
		( select ) => select( editorStore ).getCurrentPostId() as number,
		[]
	);

	return (
		<div className="liber-editor__header">
			<SidebarToggle />
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
			<PageMenu
				pageId={ pageId }
				label={ __( 'Page actions', 'liber' ) }
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
