/**
 * The editor for one page, built from public editor components.
 */
import {
	BlockCanvas,
	BlockInspector,
	BlockList,
} from '@wordpress/block-editor';
import {
	EditorKeyboardShortcuts,
	EditorKeyboardShortcutsRegister,
	EditorProvider,
	store as editorStore,
	UnsavedChangesWarning,
} from '@wordpress/editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { InlineNotices } from '@wordpress/notices';
import type { ComponentType } from 'react';

import { config } from '../app/config';
import { NoteMarkers } from '../notes/note-markers';
import { NotesPanel } from '../notes/notes-panel';
import { store as notesStore } from '../notes/store';
import { BlocksPanel } from './blocks-panel';
import { ClickBelowToWrite } from './click-below-to-write';
import { ContinuousSave } from './continuous-save';
import { EditorHeader } from './editor-header';
import { LockModal } from './lock-modal';
import { PageHeader } from './page-header';
import { PageSync } from './page-sync';
import type { PageLock } from './use-page-access';
import type { PageRecord } from './use-page-record';

/**
 * Registers the editor's shortcuts (⌘S, undo…). Its published types wrongly return a DOM `Element`.
 */
const ShortcutsRegister =
	EditorKeyboardShortcutsRegister as unknown as ComponentType;

/**
 * Page width, spacing and header inside the canvas (core's layout wrappers are private).
 */
const CANVAS_STYLES = [
	...( config.settings.styles ?? [] ),
	{
		css: `.editor-styles-wrapper { padding: 48px 24px 160px; }
		@media (max-width: 600px) { .editor-styles-wrapper { padding: 24px 16px 120px; } }
		.editor-styles-wrapper .liber-page-header,
		.editor-styles-wrapper .is-root-container { max-width: 720px; margin-inline: auto; }
		.liber-page-icon, .liber-page-icon__add { display: block; border: 0; background: none; cursor: pointer; font-family: inherit; }
		.liber-page-icon { margin-inline-start: -6px; padding: 4px 6px; border-radius: 8px; font-size: 64px; line-height: 1.1; }
		.liber-page-icon:hover { background: rgba(0, 0, 0, 0.05); }
		.liber-page-icon__add { margin-inline-start: -6px; padding: 4px 6px; border-radius: 4px; font-size: 14px; color: #757575; opacity: 0; }
		.liber-page-header:hover .liber-page-icon__add, .liber-page-icon__add:focus-visible, .liber-page-icon__add[aria-expanded="true"] { opacity: 1; }
		.liber-page-icon__add:hover { background: rgba(0, 0, 0, 0.05); }
		.liber-page-meta { margin: 0 0 24px; font-size: 13px; color: #757575; }
		.editor-styles-wrapper { position: relative; }
		.liber-note-markers { position: absolute; inset: 0; pointer-events: none; }
		.liber-note-marker { position: absolute; display: inline-flex; align-items: center; gap: 4px; height: 26px; padding: 0 8px; font: 500 12px/1 inherit; color: #1e1e1e; background: #fff; border: 1px solid #e0e0e0; border-radius: 13px; cursor: pointer; pointer-events: auto; }
		.liber-note-marker:hover { border-color: #949494; }
		.liber-note-marker svg { fill: currentColor; }`,
	},
];

interface PageEditorProps {
	page: PageRecord;
	lock: PageLock;
}

/**
 * Renders the editor, with the page's lock in its settings.
 *
 * @param props      Props.
 * @param props.page Page record (edit context).
 * @param props.lock The page's lock.
 */
export function PageEditor( { page, lock }: PageEditorProps ) {
	const settings = useMemo(
		() => ( {
			...config.settings,
			postLock: {
				isLocked: lock.isLocked,
				user: lock.user ?? undefined,
				activePostLock: lock.activePostLock ?? undefined,
			},
			postLockUtils: lock.postLockUtils,
		} ),
		[ lock ]
	);

	return (
		<EditorProvider post={ page } settings={ settings }>
			<ShortcutsRegister />
			<EditorKeyboardShortcuts />
			<ContinuousSave pageId={ page.id } />
			<UnsavedChangesWarning />
			<PageSync pageId={ page.id } />
			<LockModal />
			<EditorLayout />
		</EditorProvider>
	);
}

/**
 * Header, canvas and one side panel at a time: Blocks, Notes or block
 * settings. It sits inside the provider, which gives each page its own
 * editor stores, so it reads the same ones the canvas writes to.
 */
function EditorLayout() {
	const [ isInspectorOpen, setInspectorOpen ] = useState( false );
	const isNotesOpen = useSelect(
		( select ) => select( notesStore ).isOpen(),
		[]
	);
	const isBlocksOpen = useSelect(
		( select ) => select( editorStore ).isInserterOpened(),
		[]
	);
	const { setOpen: setNotesOpen } = useDispatch( notesStore );
	const { setIsInserterOpened } = useDispatch( editorStore );

	useEffect( () => {
		if ( isBlocksOpen ) {
			setNotesOpen( false );
			setInspectorOpen( false );
		}
	}, [ isBlocksOpen, setNotesOpen ] );

	useEffect( () => {
		if ( isNotesOpen ) {
			setIsInserterOpened( false );
		}
	}, [ isNotesOpen, setIsInserterOpened ] );

	return (
		<div className="liber-editor">
			<EditorHeader
				isInspectorOpen={ isInspectorOpen && ! isNotesOpen }
				onToggleInspector={ () => {
					setNotesOpen( false );
					setIsInserterOpened( false );
					setInspectorOpen( isNotesOpen || ! isInspectorOpen );
				} }
			/>
			<InlineNotices />
			<div className="liber-editor__body">
				<div className="liber-editor__canvas">
					<BlockCanvas height="100%" styles={ CANVAS_STYLES }>
						<PageHeader />
						<BlockList />
						<ClickBelowToWrite />
						<NoteMarkers />
					</BlockCanvas>
				</div>
				{ isBlocksOpen && <BlocksPanel /> }
				{ isNotesOpen && <NotesPanel /> }
				{ isInspectorOpen && ! isNotesOpen && ! isBlocksOpen && (
					<aside
						className="liber-editor__inspector"
						aria-label={ __( 'Block settings', 'liber' ) }
					>
						<BlockInspector />
					</aside>
				) }
			</div>
		</div>
	);
}
