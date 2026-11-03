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
	PostTitle,
	UnsavedChangesWarning,
} from '@wordpress/editor';
import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { InlineNotices } from '@wordpress/notices';
import type { ComponentType } from 'react';

import { config } from '../app/config';
import { ContinuousSave } from './continuous-save';
import { EditorHeader } from './editor-header';
import { LockModal } from './lock-modal';
import { TitleSync } from './title-sync';
import type { PageLock } from './use-page-access';
import type { PageRecord } from './use-page-record';

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
	const [ isInspectorOpen, setInspectorOpen ] = useState( false );
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
			<TitleSync pageId={ page.id } />
			<LockModal />
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
