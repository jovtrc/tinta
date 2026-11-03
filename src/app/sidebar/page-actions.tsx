/**
 * A tree row's actions, shown on hover or focus: a menu with Pin (everyone)
 * and Move to trash (editors), and + to add a subpage (editors).
 */
import {
	Button,
	DropdownMenu,
	MenuGroup,
	MenuItem,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import {
	moreHorizontal,
	plus,
	starEmpty,
	starFilled,
	trash,
} from '@wordpress/icons';

import { config, MAX_DEPTH } from '../config';

interface PageActionsProps {
	title: string;
	level: number;
	isPinned: boolean;
	onTogglePin: () => void;
	onAddSubpage: () => void;
	onTrash: () => void;
}

/**
 * Renders the actions.
 *
 * @param props              Props.
 * @param props.title        Page title, for labels.
 * @param props.level        Page level, 1 at the top.
 * @param props.isPinned     Whether the page is pinned.
 * @param props.onTogglePin  Pins or unpins the page.
 * @param props.onAddSubpage Adds a page inside this one.
 * @param props.onTrash      Asks to move the page to the trash.
 */
export function PageActions( {
	title,
	level,
	isPinned,
	onTogglePin,
	onAddSubpage,
	onTrash,
}: PageActionsProps ) {
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
							icon={ isPinned ? starFilled : starEmpty }
							onClick={ () => {
								onClose();
								onTogglePin();
							} }
						>
							{ isPinned
								? __( 'Unpin', 'liber' )
								: __( 'Pin', 'liber' ) }
						</MenuItem>
						{ config.canCreate && (
							<MenuItem
								icon={ trash }
								onClick={ () => {
									onClose();
									onTrash();
								} }
							>
								{ __( 'Move to trash', 'liber' ) }
							</MenuItem>
						) }
					</MenuGroup>
				) }
			</DropdownMenu>
			{ config.canCreate && level < MAX_DEPTH && (
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
