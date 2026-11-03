/**
 * The editor for one page, built from public editor components.
 * The app remounts it per page (`key`), so every page starts with a fresh editor state.
 */
import {
	BlockCanvas,
	BlockInspector,
	BlockList,
} from '@wordpress/block-editor';
import { Spinner } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import {
	AutosaveMonitor,
	EditorKeyboardShortcuts,
	EditorKeyboardShortcutsRegister,
	EditorProvider,
	PostTitle,
	UnsavedChangesWarning,
} from '@wordpress/editor';
import { useState } from '@wordpress/element';
import { InlineNotices } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';

import type { ComponentType } from 'react';

import { config, POST_TYPE } from '../app/config';
import { EditorHeader } from './editor-header';
import { TitleSync } from './title-sync';

/**
 * Registers the editor's shortcuts (⌘S, undo…). Its published types wrongly return a DOM `Element`.
 */
const ShortcutsRegister =
	EditorKeyboardShortcutsRegister as unknown as ComponentType;

/**
 * Page width and spacing inside the canvas (core's layout wrappers are private).
 */
const CANVAS_STYLES = [
	...( config.settings.styles ?? [] ),
	{
		css: `.editor-styles-wrapper { padding: 64px 24px 160px; }
		.editor-styles-wrapper .editor-post-title,
		.editor-styles-wrapper .is-root-container { max-width: 720px; margin-inline: auto; }`,
	},
];

/**
 * Loads the page, then renders the editor.
 *
 * @param props        Props.
 * @param props.pageId Page ID.
 */
export function PageEditor( { pageId }: { pageId: number } ) {
	const [ isInspectorOpen, setInspectorOpen ] = useState( false );
	const { page, isMissing } = useSelect(
		( select ) => {
			const args: [ string, string, number ] = [
				'postType',
				POST_TYPE,
				pageId,
			];
			const record = select( coreStore ).getEntityRecord( ...args );

			return {
				page: record,
				isMissing:
					! record &&
					select( coreStore ).hasFinishedResolution(
						'getEntityRecord',
						args
					),
			};
		},
		[ pageId ]
	);

	if ( isMissing ) {
		return (
			<p className="liber-editor__message">
				{ __(
					'This page doesn’t exist, or you can’t open it.',
					'liber'
				) }
			</p>
		);
	}

	if ( ! page ) {
		return (
			<div className="liber-editor__message">
				<Spinner />
			</div>
		);
	}

	return (
		<EditorProvider post={ page } settings={ config.settings }>
			<ShortcutsRegister />
			<EditorKeyboardShortcuts />
			<AutosaveMonitor />
			<UnsavedChangesWarning />
			<TitleSync pageId={ pageId } />
			<div className="liber-editor">
				<EditorHeader
					isInspectorOpen={ isInspectorOpen }
					onToggleInspector={ () =>
						setInspectorOpen( ! isInspectorOpen )
					}
				/>
				<InlineNotices />
				<div className="liber-editor__body">
					<div className="liber-editor__canvas">
						<BlockCanvas height="100%" styles={ CANVAS_STYLES }>
							<PostTitle />
							<BlockList />
						</BlockCanvas>
					</div>
					{ isInspectorOpen && (
						<aside
							className="liber-editor__inspector"
							aria-label={ __( 'Block settings', 'liber' ) }
						>
							<BlockInspector />
						</aside>
					) }
				</div>
			</div>
		</EditorProvider>
	);
}
