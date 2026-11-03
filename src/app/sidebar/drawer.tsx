/**
 * The sidebar as a drawer on small screens: it slides in over the page, keeps
 * focus inside, closes on Escape or a tap outside, and gives focus back to
 * the button that opened it.
 */
import {
	useConstrainedTabbing,
	useFocusOnMount,
	useFocusReturn,
	useMergeRefs,
	useRefEffect,
} from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import type { ReactNode } from 'react';

interface DrawerProps {
	children: ReactNode;
	onClose: () => void;
}

/**
 * Renders the open drawer.
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
