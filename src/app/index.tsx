/**
 * Workspace entry: registers core blocks and mounts the app on Liber's admin screen.
 */
import { registerCoreBlocks } from '@wordpress/block-library';
import { createRoot } from '@wordpress/element';
import '@wordpress/format-library';

import { App } from './app';
import './workspace.scss';

registerCoreBlocks();

const root = document.getElementById( 'liber-workspace' );

if ( root ) {
	createRoot( root ).render( <App /> );
}
