/**
 * A page's menu: Pin (everyone), Rename, Move to… and Move to trash (editors).
 * Opens from the "⋯" button in the tree and the page header, or with a right
 * click on a page in the sidebar.
 */
import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	NavigableMenu,
	Popover,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	moreHorizontal,
	moveTo,
	pencil,
	starEmpty,
	starFilled,
	trash,
} from '@wordpress/icons';

import { config } from '../config';
import { store as prefsStore } from '../store/prefs';
import { store as uiStore, type DialogName } from '../store/ui';
import type { MouseEvent } from 'react';

interface PageMenuProps {
	pageId: number;
	label: string;
	size?: 'small' | 'compact';
}

/**
 * The "⋯" button and its menu.
 *
 * @param props        Props.
 * @param props.pageId Page ID.
 * @param props.label  The button's label.
 * @param props.size   The button's size.
 */
export function PageMenu( { pageId, label, size = 'small' }: PageMenuProps ) {
	return (
		<DropdownMenu
			icon={ moreHorizontal }
			label={ label }
			toggleProps={ { size } }
		>
			{ ( { onClose } ) => (
				<PageMenuItems pageId={ pageId } onClose={ onClose } />
			) }
		</DropdownMenu>
	);
}

/**
 * Where to open the menu for a right click: at the pointer, or below the row
 * when the keyboard's menu key fired it.
 *
 * @param event The `contextmenu` event.
 */
export function menuPosition(
	event: MouseEvent< HTMLElement >
): [ number, number ] {
	if ( event.clientX || event.clientY ) {
		return [ event.clientX, event.clientY ];
	}

	const row = event.currentTarget.getBoundingClientRect();

	return [ row.left, row.bottom ];
}

/**
 * The menu opened with a right click (see `openContextMenu`).
 */
export function PageContextMenu() {
	const menu = useSelect(
		( select ) => select( uiStore ).getContextMenu(),
		[]
	);
	const { closeContextMenu } = useDispatch( uiStore );
	const anchor = useMemo(
		() =>
			menu && {
				getBoundingClientRect: () => new DOMRect( menu.x, menu.y ),
				ownerDocument: document,
			},
		[ menu ]
	);

	if ( ! menu || ! anchor ) {
		return null;
	}

	return (
		<Popover
			anchor={ anchor }
			placement="bottom-start"
			offset={ 2 }
			focusOnMount="firstElement"
			className="components-dropdown__content components-dropdown-menu__popover"
			onClose={ closeContextMenu }
		>
			<NavigableMenu
				className="components-dropdown-menu__menu"
				role="menu"
				aria-label={ __( 'Page actions', 'liber' ) }
			>
				<PageMenuItems
					pageId={ menu.pageId }
					onClose={ closeContextMenu }
				/>
			</NavigableMenu>
		</Popover>
	);
}

/**
 * The menu's items.
 *
 * @param props         Props.
 * @param props.pageId  Page ID.
 * @param props.onClose Closes the menu.
 */
function PageMenuItems( {
	pageId,
	onClose,
}: {
	pageId: number;
	onClose: () => void;
} ) {
	const isPinned = useSelect(
		( select ) => select( prefsStore ).getPrefs().pinned.includes( pageId ),
		[ pageId ]
	);
	const { togglePin } = useDispatch( prefsStore );
	const { openDialog } = useDispatch( uiStore );

	const editorItems: Array< [ DialogName, string, typeof pencil ] > = [
		[ 'rename', __( 'Rename', 'liber' ), pencil ],
		[ 'move', __( 'Move to…', 'liber' ), moveTo ],
		[ 'move-to-trash', __( 'Move to trash', 'liber' ), trash ],
	];

	return (
		<MenuGroup>
			<MenuItem
				icon={ isPinned ? starFilled : starEmpty }
				onClick={ () => {
					onClose();
					togglePin( pageId );
				} }
			>
				{ isPinned ? __( 'Unpin', 'liber' ) : __( 'Pin', 'liber' ) }
			</MenuItem>
			{ config.canCreate &&
				editorItems.map( ( [ dialog, text, icon ] ) => (
					<MenuItem
						key={ dialog }
						icon={ icon }
						onClick={ () => {
							onClose();
							openDialog( dialog, pageId );
						} }
					>
						{ text }
					</MenuItem>
				) ) }
		</MenuGroup>
	);
}
