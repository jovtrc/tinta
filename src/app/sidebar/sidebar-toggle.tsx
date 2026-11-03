/**
 * The button that brings the sidebar back: in the page header on small
 * screens (it opens the drawer), or when someone hid the sidebar.
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { drawerLeft, menu } from '@wordpress/icons';

import { useSidebar } from './use-sidebar';

/**
 * Renders the button, or nothing while the sidebar shows beside the page.
 */
export function SidebarToggle() {
	const { isMobile, isOpen, setOpen } = useSidebar();
	const { clearSelectedBlock } = useDispatch( blockEditorStore );

	if ( isOpen && ! isMobile ) {
		return null;
	}

	return (
		<Button
			icon={ isMobile ? menu : drawerLeft }
			label={ __( 'Open sidebar', 'liber' ) }
			aria-expanded={ isOpen }
			size="compact"
			onClick={ () => {
				clearSelectedBlock();
				setOpen( true );
			} }
		/>
	);
}

/**
 * A header with only the button, for screens without a page header.
 */
export function SidebarBar() {
	const { isMobile, isOpen } = useSidebar();

	return isOpen && ! isMobile ? null : (
		<div className="liber-editor__header">
			<SidebarToggle />
		</div>
	);
}
