/**
 * Core's "This post is already being edited" dialog, with Take over.
 */
import { PostLockedModal } from '@wordpress/editor';
import { useEffect, useState } from '@wordpress/element';
import type { ComponentType } from 'react';

/**
 * Its published types describe a class that isn't a valid JSX component.
 */
const LockedModal = PostLockedModal as unknown as ComponentType;

/**
 * Mounts the dialog after the editor stored the page's lock: it reads the lock once, when it mounts.
 */
export function LockModal() {
	const [ isReady, setReady ] = useState( false );

	useEffect( () => setReady( true ), [] );

	return isReady ? <LockedModal /> : null;
}
