/**
 * Sample content for a new workspace: a "Welcome" page with a "Getting
 * started" page inside it. Built from blocks, so the markup is always what
 * the editor itself would save.
 */
import apiFetch from '@wordpress/api-fetch';
import { createBlock, serialize } from '@wordpress/blocks';
import { escapeHTML } from '@wordpress/escape-html';
import { __ } from '@wordpress/i18n';

/**
 * Pages' REST route (PHP: `Post_Type`'s `rest_base`).
 */
const PAGES_PATH = '/wp/v2/tinta-docs';

type Block = ReturnType< typeof createBlock >;

const paragraph = ( text: string ) =>
	createBlock( 'core/paragraph', { content: escapeHTML( text ) } );

const heading = ( text: string ) =>
	createBlock( 'core/heading', { level: 2, content: escapeHTML( text ) } );

const list = ( items: string[], ordered = false ) =>
	createBlock(
		'core/list',
		{ ordered },
		items.map( ( item ) =>
			createBlock( 'core/list-item', { content: escapeHTML( item ) } )
		)
	);

/**
 * Creates a private page.
 *
 * @param title  Title.
 * @param icon   Emoji icon.
 * @param blocks Content.
 * @param parent Parent page ID.
 * @return The page ID.
 */
async function createPage(
	title: string,
	icon: string,
	blocks: Block[],
	parent = 0
): Promise< number > {
	const page = await apiFetch< { id: number } >( {
		path: PAGES_PATH,
		method: 'POST',
		data: {
			title,
			parent,
			status: 'private',
			content: serialize( blocks ),
			meta: { _tinta_icon: icon },
		},
	} );

	return page.id;
}

/**
 * Creates both pages.
 *
 * @return The Welcome page's ID.
 */
export async function createSamplePages(): Promise< number > {
	const welcome = [
		paragraph(
			__(
				'This is your team’s workspace: docs, notes and plans, private to the people you invite.',
				'tinta'
			)
		),
		createBlock( 'tinta/callout', { emoji: '💡' }, [
			paragraph(
				__(
					'Pages live in the sidebar. Put pages inside pages to keep things organized, and drag them to move them around.',
					'tinta'
				)
			),
		] ),
		heading( __( 'Writing', 'tinta' ) ),
		list( [
			__(
				'Type / to add a block: headings, lists, tables, code, callouts and more.',
				'tinta'
			),
			__( 'Drag the handle at a block’s left to move it.', 'tinta' ),
			__( 'Everything saves as you type.', 'tinta' ),
		] ),
		heading( __( 'Working together', 'tinta' ) ),
		list( [
			__(
				'Select a block and choose Add note to leave a note. Type @ to mention someone.',
				'tinta'
			),
			__(
				'Pin the pages you use most; they stay at the top of the sidebar.',
				'tinta'
			),
			__( 'Press ⌘K (Ctrl+K on Windows) to find any page.', 'tinta' ),
		] ),
	];

	const welcomeId = await createPage(
		__( 'Welcome', 'tinta' ),
		'👋',
		welcome
	);
	const startedId = await createPage(
		__( 'Getting started', 'tinta' ),
		'🚀',
		[
			paragraph( __( 'A few things to try first:', 'tinta' ) ),
			list(
				[
					__(
						'Create a page with New page, or with + next to a page to add one inside it.',
						'tinta'
					),
					__( 'Pick an emoji for it above the title.', 'tinta' ),
					__(
						'Invite your team from Workspace settings → Invite people.',
						'tinta'
					),
				],
				true
			),
		],
		welcomeId
	);

	await apiFetch( {
		path: `${ PAGES_PATH }/${ welcomeId }`,
		method: 'POST',
		data: {
			content: serialize( [
				...welcome,
				heading( __( 'Next', 'tinta' ) ),
				createBlock( 'tinta/page-link', { pageId: startedId } ),
			] ),
		},
	} );

	return welcomeId;
}
