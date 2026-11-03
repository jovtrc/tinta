/**
 * A tree row's actions, shown on hover or focus: the page menu, and + to add
 * a subpage (editors).
 */
import { Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { plus } from '@wordpress/icons';

import { config, MAX_DEPTH } from '../config';
import { PageMenu } from './page-menu';

interface PageActionsProps {
	pageId: number;
	title: string;
	level: number;
	onAddSubpage: () => void;
}

/**
 * Renders the actions.
 *
 * @param props              Props.
 * @param props.pageId       Page ID.
 * @param props.title        Page title, for labels.
 * @param props.level        Page level, 1 at the top.
 * @param props.onAddSubpage Adds a page inside this one.
 */
export function PageActions( {
	pageId,
	title,
	level,
	onAddSubpage,
}: PageActionsProps ) {
	return (
		<div className="tinta-tree__actions">
			<PageMenu
				pageId={ pageId }
				label={ sprintf(
					/* translators: %s: page title. */
					__( 'Actions for “%s”', 'tinta' ),
					title
				) }
			/>
			{ config.canCreate && level < MAX_DEPTH && (
				<Button
					size="small"
					icon={ plus }
					label={ sprintf(
						/* translators: %s: page title. */
						__( 'Add a page inside “%s”', 'tinta' ),
						title
					) }
					onClick={ onAddSubpage }
				/>
			) }
		</div>
	);
}
