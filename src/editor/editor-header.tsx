/**
 * Editor header: undo/redo, save status and the block settings toggle.
 */
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	EditorHistoryRedo,
	EditorHistoryUndo,
	store as editorStore,
} from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { drawerRight } from '@wordpress/icons';

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
			<EditorHistoryUndo />
			<EditorHistoryRedo />
			<div className="liber-editor__spacer" />
			<SaveStatus />
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
 * "Saved", "Saving…", or a Save button when there are changes (⌘S also saves).
 */
function SaveStatus() {
	const { isDirty, isSaving } = useSelect( ( select ) => {
		const editor = select( editorStore );

		return {
			isDirty: editor.isEditedPostDirty(),
			isSaving: editor.isSavingPost() && ! editor.isAutosavingPost(),
		};
	}, [] );
	const { savePost } = useDispatch( editorStore );

	if ( isSaving ) {
		return (
			<span className="liber-editor__status">
				{ __( 'Saving…', 'liber' ) }
			</span>
		);
	}

	if ( ! isDirty ) {
		return (
			<span className="liber-editor__status">
				{ __( 'Saved', 'liber' ) }
			</span>
		);
	}

	return (
		<Button variant="primary" size="compact" onClick={ () => savePost() }>
			{ __( 'Save', 'liber' ) }
		</Button>
	);
}
