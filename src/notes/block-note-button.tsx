/**
 * "Add note" in every block's toolbar, for people who can edit pages.
 */
import { BlockControls } from '@wordpress/block-editor';
import { ToolbarButton } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { comment } from '@wordpress/icons';
import type { ComponentType } from 'react';

import { store as notesStore } from './store';

interface BlockEditProps {
	clientId: string;
	isSelected: boolean;
}

const withNoteButton = createHigherOrderComponent(
	( BlockEdit: ComponentType< BlockEditProps > ) =>
		function NoteButton( props: BlockEditProps ) {
			const { startNote } = useDispatch( notesStore );

			return (
				<>
					<BlockEdit { ...props } />
					{ props.isSelected && (
						<BlockControls group="other">
							<ToolbarButton
								icon={ comment }
								label={ __( 'Add note', 'tinta' ) }
								onClick={ () => startNote( props.clientId ) }
							/>
						</BlockControls>
					) }
				</>
			);
		},
	'withNoteButton'
);

/**
 * Adds the button to block toolbars.
 */
export function registerNoteButton() {
	addFilter( 'editor.BlockEdit', 'tinta/note-button', withNoteButton );
}
