/**
 * A tree row's actions: add a subpage, and a menu with Move to trash.
 * Shown on hover or focus; hidden from users who can't edit.
 */
import {
	Button,
	DropdownMenu,
	MenuGroup,
	MenuItem,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { moreHorizontal, plus, trash } from '@wordpress/icons';

import { config } from '../config';

/**
 * Deepest level a page can have (PHP: `Post_Type::MAX_DEPTH`).
 */
const MAX_DEPTH = 5;

interface PageActionsProps {
	title: string;
	level: number;
	onAddSubpage: () => void;
	onTrash: () => void;
}

/**
 * Renders the actions.
 *
 * @param props              Props.
 * @param props.title        Page title, for labels.
 * @param props.level        Page level, 1 at the top.
 * @param props.onAddSubpage Adds a page inside this one.
 * @param props.onTrash      Asks to move the page to the trash.
 */
export function PageActions( {
	title,
	level,
	onAddSubpage,
	onTrash,
}: PageActionsProps ) {
	if ( ! config.canCreate ) {
		return null;
	}

	return (
		<div className="liber-tree__actions">
			<DropdownMenu
				icon={ moreHorizontal }
				label={ sprintf(
					/* translators: %s: page title. */
					__( 'Actions for “%s”', 'liber' ),
					title
				) }
				toggleProps={ { size: 'small' } }
			>
				{ ( { onClose } ) => (
					<MenuGroup>
						<MenuItem
							icon={ trash }
							onClick={ () => {
								onClose();
								onTrash();
							} }
						>
							{ __( 'Move to trash', 'liber' ) }
						</MenuItem>
					</MenuGroup>
				) }
			</DropdownMenu>
			{ level < MAX_DEPTH && (
				<Button
					size="small"
					icon={ plus }
					label={ sprintf(
						/* translators: %s: page title. */
						__( 'Add a page inside “%s”', 'liber' ),
						title
					) }
					onClick={ onAddSubpage }
				/>
			) }
		</div>
	);
}
