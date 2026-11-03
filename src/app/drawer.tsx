/**
 * Mobile sidebar. Below wp-admin's mobile breakpoint the sidebar leaves the
 * layout and slides in over the page from a menu button in the page header.
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import {
	useConstrainedTabbing,
	useFocusOnMount,
	useFocusReturn,
	useMergeRefs,
	useRefEffect,
} from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { createContext, useContext } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { menu } from '@wordpress/icons';
import type { ReactNode } from 'react';

interface DrawerState {
	isMobile: boolean;
	isOpen: boolean;
	setOpen: ( isOpen: boolean ) => void;
}

export const DrawerContext = createContext< DrawerState >( {
	isMobile: false,
	isOpen: false,
	setOpen: () => undefined,
} );

/**
 * The menu button that opens the sidebar. Renders nothing on wider screens.
 */
export function DrawerToggle() {
	const { isMobile, isOpen, setOpen } = useContext( DrawerContext );
	const { clearSelectedBlock } = useDispatch( blockEditorStore );

	if ( ! isMobile ) {
		return null;
	}

	return (
		<Button
			icon={ menu }
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
 * A header with only the menu button, for screens without a page header.
 * Renders nothing on wider screens.
 */
export function DrawerBar() {
	const { isMobile } = useContext( DrawerContext );

	return isMobile ? (
		<div className="liber-editor__header">
			<DrawerToggle />
		</div>
	) : null;
}

interface DrawerProps {
	children: ReactNode;
	onClose: () => void;
}

/**
 * The open drawer: keeps focus inside, closes on Escape or a tap outside, and
 * gives focus back to the menu button.
 *
 * @param props          Props.
 * @param props.children The sidebar.
 * @param props.onClose  Closes the drawer.
 */
export function Drawer( { children, onClose }: DrawerProps ) {
	const closeOnEscape = useRefEffect(
		( node: HTMLElement ) => {
			const onKeyDown = ( event: KeyboardEvent ) => {
				if ( event.key === 'Escape' && ! event.defaultPrevented ) {
					event.preventDefault();
					onClose();
				}
			};

			node.addEventListener( 'keydown', onKeyDown );

			return () => node.removeEventListener( 'keydown', onKeyDown );
		},
		[ onClose ]
	);
	const ref = useMergeRefs( [
		useConstrainedTabbing(),
		useFocusOnMount( 'firstElement' ),
		useFocusReturn(),
		closeOnEscape,
	] );

	return (
		<>
			<div
				className="liber-drawer__backdrop"
				aria-hidden="true"
				onClick={ onClose }
			/>
			<div
				ref={ ref }
				className="liber-drawer"
				role="dialog"
				aria-modal="true"
				aria-label={ __( 'Sidebar', 'liber' ) }
			>
				{ children }
			</div>
		</>
	);
}
