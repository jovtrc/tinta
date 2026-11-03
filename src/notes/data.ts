/**
 * Notes as core stores them: comments of type `note` (replies point to their
 * thread through `parent`), threads linked to blocks by `metadata.noteId`, and
 * mentions as `<span class="wp-note-mention user-N">` chips.
 */
import { escapeHTML } from '@wordpress/escape-html';

export interface Note {
	id: number;
	parent: number;
	author: number;
	author_name: string;
	author_avatar_urls?: Record< string, string >;
	date_gmt: string;
	status: string;
	content: { rendered: string };
	meta?: { _wp_note_status?: string };
}

export interface NoteMetadata {
	noteId?: unknown;
	[ key: string ]: unknown;
}

export interface Person {
	id: number;
	name: string;
	avatar: string;
}

/**
 * Query core's own Notes UI uses.
 *
 * @param postId Page ID.
 */
export function notesQuery( postId: number ) {
	return { post: postId, type: 'note', status: 'all', per_page: -1 };
}

/**
 * Thread IDs a block points to.
 *
 * @param metadata Block metadata.
 */
export function noteIdsOf( metadata?: NoteMetadata ): number[] {
	const raw = ( [] as unknown[] ).concat( metadata?.noteId ?? [] );

	return [ ...new Set( raw.map( Number ).filter( ( id ) => id > 0 ) ) ];
}

/**
 * Block metadata with a thread added, as an array like core writes it.
 *
 * @param metadata Block metadata.
 * @param noteId   Thread ID.
 */
export function withNoteId(
	metadata: NoteMetadata | undefined,
	noteId: number
) {
	return {
		...metadata,
		noteId: [ ...new Set( [ ...noteIdsOf( metadata ), noteId ] ) ],
	};
}

/**
 * Block metadata without a thread.
 *
 * @param metadata Block metadata.
 * @param noteId   Thread ID.
 */
export function withoutNoteId(
	metadata: NoteMetadata | undefined,
	noteId: number
) {
	const ids = noteIdsOf( metadata ).filter( ( id ) => id !== noteId );
	const { noteId: removed, ...rest } = metadata ?? {};

	return ids.length ? { ...rest, noteId: ids } : rest;
}

/**
 * Note HTML from typed text: escaped, line breaks kept, and each `@Name` of
 * a chosen person turned into core's mention chip.
 *
 * @param text     Typed text.
 * @param mentions People picked while typing.
 */
export function toNoteHtml( text: string, mentions: Person[] ): string {
	let html = escapeHTML( text.trim() ).replace( /\n/g, '<br>' );

	for ( const person of mentions ) {
		const tag = `@${ escapeHTML( person.name ) }`;
		html = html
			.split( tag )
			.join(
				`<span class="wp-note-mention user-${ person.id }">${ tag }</span>`
			);
	}

	return html;
}
