/**
 * Whether the sidebar shows: a column on wide screens that can be hidden, a
 * drawer below wp-admin's mobile breakpoint.
 */
import { useViewportMatch } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';

import { store as uiStore } from '../store/ui';

/**
 * The sidebar's state, and a function that shows or hides it.
 */
export function useSidebar() {
	const isMobile = useViewportMatch( 'medium', '<' );
	const isOpen = useSelect(
		( select ) =>
			isMobile
				? select( uiStore ).isDrawerOpen()
				: ! select( uiStore ).isSidebarHidden(),
		[ isMobile ]
	);
	const { setDrawerOpen, setSidebarHidden } = useDispatch( uiStore );

	const setOpen = ( open: boolean ) =>
		isMobile ? setDrawerOpen( open ) : setSidebarHidden( ! open );

	return { isMobile, isOpen, setOpen };
}
