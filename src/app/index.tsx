/**
 * Workspace entry: registers blocks and mounts the app on Tinta's admin screen.
 */
import { createRoot } from '@wordpress/element';
import '@wordpress/format-library';

import { App } from './app';
import { registerNoteButton } from '../notes/block-note-button';
import { registerBlocks } from './blocks';
import { config } from './config';
import './workspace.scss';

registerBlocks();

if ( config.canCreate ) {
	registerNoteButton();
}

const root = document.getElementById( 'tinta-workspace' );

if ( root ) {
	createRoot( root ).render( <App /> );
}
