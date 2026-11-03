/**
 * Workspace entry: registers blocks and mounts the app on Liber's admin screen.
 */
import { createRoot } from '@wordpress/element';
import '@wordpress/format-library';

import { App } from './app';
import { registerBlocks } from './blocks';
import './workspace.scss';

registerBlocks();

const root = document.getElementById( 'liber-workspace' );

if ( root ) {
	createRoot( root ).render( <App /> );
}
