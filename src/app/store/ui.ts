/**
 * `liber/ui` store: the open workspace dialog, the page menu opened with a
 * right click, and whether the sidebar shows (hidden on wide screens, open as
 * a drawer on small ones).
 */
import { createReduxStore, register } from '@wordpress/data';

export type DialogName =
	'move' | 'move-to-trash' | 'rename' | 'settings' | 'setup' | 'trash';

export interface Dialog {
	name: DialogName;
	pageId: number;
}

export interface ContextMenu {
	pageId: number;
	x: number;
	y: number;
}

interface State {
	dialog: Dialog | null;
	contextMenu: ContextMenu | null;
	isSidebarHidden: boolean;
	isDrawerOpen: boolean;
}

type Action =
	| { type: 'OPEN_DIALOG'; dialog: Dialog | null }
	| { type: 'OPEN_CONTEXT_MENU'; contextMenu: ContextMenu | null }
	| { type: 'SET_SIDEBAR_HIDDEN'; isHidden: boolean }
	| { type: 'SET_DRAWER_OPEN'; isOpen: boolean };

const actions = {
	/**
	 * Opens a dialog, for a page when it acts on one.
	 *
	 * @param name   Dialog.
	 * @param pageId Page it acts on.
	 */
	openDialog: ( name: DialogName, pageId = 0 ): Action => ( {
		type: 'OPEN_DIALOG',
		dialog: { name, pageId },
	} ),

	closeDialog: (): Action => ( { type: 'OPEN_DIALOG', dialog: null } ),

	/**
	 * Opens a page's menu at the pointer.
	 *
	 * @param pageId Page ID.
	 * @param x      Pointer's distance from the window's left edge.
	 * @param y      Pointer's distance from the window's top edge.
	 */
	openContextMenu: ( pageId: number, x: number, y: number ): Action => ( {
		type: 'OPEN_CONTEXT_MENU',
		contextMenu: { pageId, x, y },
	} ),

	closeContextMenu: (): Action => ( {
		type: 'OPEN_CONTEXT_MENU',
		contextMenu: null,
	} ),

	setSidebarHidden: ( isHidden: boolean ): Action => ( {
		type: 'SET_SIDEBAR_HIDDEN',
		isHidden,
	} ),

	setDrawerOpen: ( isOpen: boolean ): Action => ( {
		type: 'SET_DRAWER_OPEN',
		isOpen,
	} ),
};

/**
 * Applies an action.
 *
 * @param state  Current state.
 * @param action Action.
 */
function reducer(
	state: State = {
		dialog: null,
		contextMenu: null,
		isSidebarHidden: false,
		isDrawerOpen: false,
	},
	action: Action
): State {
	switch ( action.type ) {
		case 'OPEN_DIALOG':
			return { ...state, dialog: action.dialog };
		case 'OPEN_CONTEXT_MENU':
			return { ...state, contextMenu: action.contextMenu };
		case 'SET_SIDEBAR_HIDDEN':
			return { ...state, isSidebarHidden: action.isHidden };
		case 'SET_DRAWER_OPEN':
			return { ...state, isDrawerOpen: action.isOpen };
	}

	return state;
}

const selectors = {
	getDialog: ( state: State ) => state.dialog,
	getContextMenu: ( state: State ) => state.contextMenu,
	isSidebarHidden: ( state: State ) => state.isSidebarHidden,
	isDrawerOpen: ( state: State ) => state.isDrawerOpen,
};

export const store = createReduxStore( 'liber/ui', {
	reducer,
	actions,
	selectors,
} );

register( store );
