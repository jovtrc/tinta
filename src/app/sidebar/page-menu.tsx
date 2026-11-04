/**
 * A page's menu: Pin (everyone), Rename, Move to… and Move to trash (editors),
 * and Move up or down in the list it opened from. Opens from the "⋯" button
 * on sidebar rows and in the page header, or with a right click on a page in
 * the sidebar.
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
import { useOrderMoves, type PageList } from './use-order-moves';
import type { MouseEvent } from 'react';

interface PageMenuProps {
	pageId: number;
	label: string;
	list?: PageList;
	size?: 'small' | 'compact';
}

/**
 * The "⋯" button and its menu.
 *
 * @param props        Props.
 * @param props.pageId Page ID.
 * @param props.label  The button's label.
 * @param props.list   Where the button is: the tree (and page header), Pinned or Recent.
 * @param props.size   The button's size.
 */
export function PageMenu( {
	pageId,
	label,
	list = 'tree',
	size = 'small',
}: PageMenuProps ) {
	return (
		<DropdownMenu
			icon={ moreHorizontal }
			label={ label }
			toggleProps={ { size } }
		>
			{ ( { onClose } ) => (
				<PageMenuItems
					pageId={ pageId }
					list={ list }
					onClose={ onClose }
				/>
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
				aria-label={ __( 'Page actions', 'tinta' ) }
			>
				<PageMenuItems
					pageId={ menu.pageId }
					list={ menu.list }
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
 * @param props.list    Where the menu opened.
 * @param props.onClose Closes the menu.
 */
function PageMenuItems( {
	pageId,
	list,
	onClose,
}: {
	pageId: number;
	list: PageList;
	onClose: () => void;
} ) {
	const isPinned = useSelect(
		( select ) => select( prefsStore ).getPrefs().pinned.includes( pageId ),
		[ pageId ]
	);
	const { togglePin } = useDispatch( prefsStore );
	const { openDialog } = useDispatch( uiStore );
	const moves = useOrderMoves( pageId, list ).map(
		( { label, icon, move } ) => (
			<MenuItem
				key={ label }
				icon={ icon }
				onClick={ () => {
					onClose();
					move();
				} }
			>
				{ label }
			</MenuItem>
		)
	);

	const dialogItem = (
		dialog: DialogName,
		text: string,
		icon: typeof pencil
	) => (
		<MenuItem
			icon={ icon }
			onClick={ () => {
				onClose();
				openDialog( dialog, pageId );
			} }
		>
			{ text }
		</MenuItem>
	);

	return (
		<MenuGroup>
			<MenuItem
				icon={ isPinned ? starFilled : starEmpty }
				onClick={ () => {
					onClose();
					togglePin( pageId );
				} }
			>
				{ isPinned ? __( 'Unpin', 'tinta' ) : __( 'Pin', 'tinta' ) }
			</MenuItem>
			{ list === 'pinned' && moves }
			{ config.canCreate && (
				<>
					{ dialogItem( 'rename', __( 'Rename', 'tinta' ), pencil ) }
					{ dialogItem( 'move', __( 'Move to…', 'tinta' ), moveTo ) }
					{ list === 'tree' && moves }
					{ dialogItem(
						'move-to-trash',
						__( 'Move to trash', 'tinta' ),
						trash
					) }
				</>
			) }
		</MenuGroup>
	);
}
