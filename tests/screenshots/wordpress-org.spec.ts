/**
 * Fills the workspace with a small studio's pages, people and notes, then
 * takes the wordpress.org screenshots into `.wordpress-org/`, in workspace
 * mode. Captions are in readme.txt's Screenshots section, in the same order.
 */
import {
	expect,
	RequestUtils,
	test,
	type Admin,
} from '@wordpress/e2e-test-utils-playwright';
import type { Page } from '@playwright/test';

const OUT = '.wordpress-org';

/**
 * Password for the people this script creates on the disposable Playground site.
 */
const PASSWORD = 'tinta-screenshots-password';

type BlockSpec = [ string, Record< string, unknown >?, BlockSpec[]? ];

interface Block {
	attributes: Record< string, unknown >;
}

/**
 * The WordPress scripts the workspace screen loads, as page globals.
 */
interface WpGlobals {
	apiFetch: < T = unknown >( options: object ) => Promise< T >;
	blocks: {
		createBlock: (
			name: string,
			attributes: Record< string, unknown >,
			inner: Block[]
		) => Block;
		serialize: ( blocks: Block[] ) => string;
	};
}

interface PageSpec {
	key: string;
	title: string;
	icon: string;
	parent?: string;
	blocks?: BlockSpec[];
}

const p = ( content: string ): BlockSpec => [ 'core/paragraph', { content } ];
const h = ( content: string ): BlockSpec => [
	'core/heading',
	{ level: 2, content },
];
const list = ( items: string[] ): BlockSpec => [
	'core/list',
	{},
	items.map( ( content ) => [ 'core/list-item', { content } ] ),
];

const PAGES: PageSpec[] = [
	{
		key: 'handbook',
		title: 'Handbook',
		icon: '📘',
		blocks: [ p( 'How we work at Blue Fern, from your first day on.' ) ],
	},
	{ key: 'onboarding', title: 'Onboarding', icon: '👋', parent: 'handbook' },
	{ key: 'how', title: 'How we work', icon: '🧭', parent: 'handbook' },
	{ key: 'timeoff', title: 'Time off', icon: '🏖️', parent: 'handbook' },
	{
		key: 'tools',
		title: 'Tools and accounts',
		icon: '🔑',
		parent: 'handbook',
	},
	{ key: 'engineering', title: 'Engineering', icon: '🛠️' },
	{ key: 'deploys', title: 'Deploys', icon: '🚀', parent: 'engineering' },
	{ key: 'oncall', title: 'On-call', icon: '📟', parent: 'engineering' },
	{ key: 'design', title: 'Design', icon: '🎨' },
	{ key: 'brand', title: 'Brand guidelines', icon: '🖌️', parent: 'design' },
	{ key: 'clients', title: 'Clients', icon: '🤝' },
	{ key: 'meetings', title: 'Meetings', icon: '🗓️' },
	{ key: 'weekly', title: 'Weekly sync', icon: '📝', parent: 'meetings' },
	{ key: 'retro', title: 'Q4 retro', icon: '🔁', parent: 'meetings' },
];

/**
 * The page the color scheme screenshot shows.
 */
const DEPLOYS: BlockSpec[] = [
	p(
		'We deploy the website and client sites from the main branch, twice a week.'
	),
	[
		'tinta/callout',
		{ emoji: '⚠️' },
		[
			p(
				'No deploys on Friday afternoons. If something breaks, it waits until Monday.'
			),
		],
	],
	h( 'Before you deploy' ),
	list( [
		'Checks pass on the pull request.',
		'Someone else reviewed the change.',
		'The staging site looks right on a phone.',
	] ),
	h( 'Deploy' ),
	[ 'core/code', { content: 'git tag v2.14.0 && git push origin v2.14.0' } ],
	p(
		'The release workflow builds the site and posts in #deploys when it is live.'
	),
];

/**
 * The page most screenshots show. The first paragraph carries the notes.
 *
 * @param ids Page IDs by key.
 */
function onboarding( ids: Record< string, number > ): BlockSpec[] {
	return [
		p(
			'Welcome to Blue Fern! This page walks you through your first week. Nothing here is urgent: read, meet people, ask a lot.'
		),
		[
			'tinta/callout',
			{ emoji: '💡' },
			[
				p(
					'Your buddy for the first month is Ana. Book thirty minutes with her on day one.'
				),
			],
		],
		h( 'Your first week' ),
		list( [
			'Set up your laptop and accounts.',
			'Read How we work and the brand guidelines.',
			'Join the weekly sync on Monday at 10:00.',
			'Ship a small change to the website by Friday.',
		] ),
		h( 'Who to ask' ),
		[
			'core/table',
			{
				head: [
					{
						cells: [
							{ content: 'Topic', tag: 'th' },
							{ content: 'Person', tag: 'th' },
						],
					},
				],
				body: [
					[ 'Laptops and accounts', 'Rafael' ],
					[ 'Payroll and time off', 'Ana' ],
					[ 'Design reviews', 'Maya' ],
				].map( ( row ) => ( {
					cells: row.map( ( content ) => ( { content, tag: 'td' } ) ),
				} ) ),
			},
		],
		h( 'Read next' ),
		[ 'tinta/page-link', { pageId: ids.tools } ],
		[ 'tinta/page-link', { pageId: ids.how } ],
	];
}

test( 'takes the wordpress.org screenshots', async ( {
	admin,
	page,
	requestUtils,
} ) => {
	test.setTimeout( 180_000 );
	await resetSite( requestUtils );
	const people = await addPeople( requestUtils );
	await setSettings( requestUtils, { workspace_mode: true } );
	try {
		await takeScreenshots( admin, page, requestUtils, people );
	} finally {
		await setSettings( requestUtils, {
			workspace_mode: false,
			setup_done: true,
		} );
	}
} );

/**
 * Builds the workspace and takes the screenshots, with workspace mode on.
 *
 * @param admin        Admin helpers.
 * @param page         Playwright page.
 * @param requestUtils REST helpers, as Maya.
 * @param people       Ana and Rafael.
 */
async function takeScreenshots(
	admin: Admin,
	page: Page,
	requestUtils: RequestUtils,
	people: Awaited< ReturnType< typeof addPeople > >
) {
	const shot = ( name: string ) =>
		page.screenshot( { path: `${ OUT }/${ name }` } );

	await admin.visitAdminPage( 'admin.php', 'page=tinta' );
	const ids = await createPages( page, PAGES );
	const noteId = await addNotes( requestUtils, people, ids.onboarding );
	await setContent( page, ids.onboarding, onboarding( ids ), noteId );
	await setContent( page, ids.deploys, DEPLOYS );
	await requestUtils.rest( {
		method: 'POST',
		path: '/wp/v2/users/me',
		data: {
			tinta_prefs: {
				pinned: [ ids.onboarding, ids.deploys ],
				recent: [ ids.weekly, ids.deploys, ids.brand ],
				expanded: [ ids.handbook, ids.meetings ],
				emojis: [],
			},
		},
	} );

	await openPage( admin, page, ids.onboarding );
	await shot( 'screenshot-1.png' );

	await page
		.frameLocator( 'iframe[name="editor-canvas"]' )
		.getByRole( 'button', { name: /notes on this block/ } )
		.click();
	await expect(
		page.getByRole( 'complementary', { name: 'Notes' } )
	).toBeVisible();
	await parkMouse( page );
	await shot( 'screenshot-2.png' );

	await openPage( admin, page, ids.onboarding );
	await page.keyboard.press( 'ControlOrMeta+k' );
	await page.keyboard.type( 'de' );
	await expect( page.getByRole( 'option' ).first() ).toBeVisible();
	await shot( 'screenshot-3.png' );

	await setSettings( requestUtils, { setup_done: false } );
	await openPage( admin, page, ids.onboarding );
	await expect(
		page.getByRole( 'dialog', { name: 'Set up your workspace' } )
	).toBeVisible();
	await shot( 'screenshot-4.png' );
	await page.getByRole( 'button', { name: 'Skip for now' } ).click();

	const scheme = await setColorScheme( admin, page, 'midnight' );
	await openPage( admin, page, ids.deploys );
	await shot( 'screenshot-5.png' );
	await setColorScheme( admin, page, scheme );

	await page.setViewportSize( { width: 390, height: 844 } );
	await openPage( admin, page, ids.onboarding );
	await page.getByRole( 'button', { name: 'Open sidebar' } ).click();
	await expect(
		page.getByRole( 'link', { name: 'Deploys' } ).first()
	).toBeVisible();
	await shot( 'screenshot-6.png' );
}

/**
 * Starts from an empty workspace named Blue Fern Studio, with its own icon.
 *
 * @param requestUtils REST helpers.
 */
async function resetSite( requestUtils: RequestUtils ) {
	const docs = await requestUtils.rest< { id: number }[] >( {
		path: '/wp/v2/tinta-docs',
		params: { status: 'private,trash', per_page: 100, context: 'edit' },
	} );
	await Promise.all(
		docs.map( ( { id } ) =>
			requestUtils.rest( {
				method: 'DELETE',
				path: `/wp/v2/tinta-docs/${ id }`,
				params: { force: true },
			} )
		)
	);
	await requestUtils.deleteAllUsers();
	const icon = await requestUtils.uploadMedia(
		'tests/screenshots/site-icon.png'
	);
	await requestUtils.rest( {
		method: 'POST',
		path: '/wp/v2/settings',
		data: {
			title: 'Blue Fern Studio',
			site_icon: icon.id,
			tinta_settings: { setup_done: true },
		},
	} );
	await requestUtils.rest( {
		method: 'POST',
		path: '/wp/v2/users/me',
		data: { first_name: 'Maya', last_name: 'Chen', name: 'Maya Chen' },
	} );
}

/**
 * Adds two Members, signed in for their own notes before the site turns private.
 *
 * @param requestUtils REST helpers.
 */
async function addPeople( requestUtils: RequestUtils ) {
	const add = async ( username: string, first: string, last: string ) => {
		const user = await requestUtils.createUser( {
			username,
			email: `${ username }@example.com`,
			firstName: first,
			lastName: last,
			password: PASSWORD,
			roles: [ 'tinta_member' ],
		} );
		await requestUtils.rest( {
			method: 'POST',
			path: `/wp/v2/users/${ user.id }`,
			data: { name: `${ first } ${ last }` },
		} );
		const utils = await RequestUtils.setup( {
			user: { username, password: PASSWORD },
		} );
		await utils.setupRest();

		return { id: user.id, name: `${ first } ${ last }`, utils };
	};

	return {
		ana: await add( 'ana', 'Ana', 'Souza' ),
		rafael: await add( 'rafael', 'Rafael', 'Lima' ),
	};
}

/**
 * Creates the pages in order, through the REST API, from the workspace screen.
 *
 * @param page  Playwright page.
 * @param specs Pages, parents first.
 * @return Page IDs by key.
 */
function createPages( page: Page, specs: PageSpec[] ) {
	const rows = specs.map( ( { key, title, icon, parent = '' } ) => ( {
		key,
		title,
		icon,
		parent,
	} ) );

	return page.evaluate( async ( pages ) => {
		const ids: Record< string, number > = {};
		const order: Record< number, number > = {};

		for ( const spec of pages ) {
			const parent = spec.parent ? ids[ spec.parent ] : 0;
			order[ parent ] = ( order[ parent ] ?? -1 ) + 1;
			const created = await (
				window as unknown as { wp: WpGlobals }
			 ).wp.apiFetch< { id: number } >( {
				path: '/wp/v2/tinta-docs',
				method: 'POST',
				data: {
					title: spec.title,
					parent,
					menu_order: order[ parent ],
					status: 'private',
					meta: { _tinta_icon: spec.icon },
				},
			} );
			ids[ spec.key ] = created.id;
		}

		return ids;
	}, rows );
}

/**
 * Saves a page's content, built from blocks so the markup matches the editor's.
 *
 * @param page   Playwright page.
 * @param pageId Page ID.
 * @param blocks Content.
 * @param noteId Note on the first block, if any.
 */
function setContent(
	page: Page,
	pageId: number,
	blocks: BlockSpec[],
	noteId = 0
) {
	return page.evaluate(
		async ( { id, json, note } ) => {
			const { createBlock, serialize } = (
				window as unknown as { wp: WpGlobals }
			 ).wp.blocks;
			const build = ( [
				name,
				attributes = {},
				inner = [],
			]: BlockSpec ): Block =>
				createBlock( name, attributes, inner.map( build ) );
			const built = ( JSON.parse( json ) as BlockSpec[] ).map( build );
			if ( note ) {
				built[ 0 ].attributes.metadata = { noteId: [ note ] };
			}

			await ( window as unknown as { wp: WpGlobals } ).wp.apiFetch( {
				path: `/wp/v2/tinta-docs/${ id }`,
				method: 'POST',
				data: { content: serialize( built ) },
			} );
		},
		{ id: pageId, json: JSON.stringify( blocks ), note: noteId }
	);
}

/**
 * A short thread on the Onboarding page: Ana asks, Maya mentions Rafael, Rafael answers.
 *
 * @param requestUtils REST helpers, as Maya.
 * @param people       Ana and Rafael.
 * @param pageId       Onboarding's ID.
 * @return The thread's first note.
 */
async function addNotes(
	requestUtils: RequestUtils,
	people: Awaited< ReturnType< typeof addPeople > >,
	pageId: number
) {
	const note = ( utils: RequestUtils, content: string, parent = 0 ) =>
		utils.rest< { id: number } >( {
			method: 'POST',
			path: '/wp/v2/comments',
			data: {
				post: pageId,
				content,
				parent,
				type: 'note',
				status: 'hold',
			},
		} );
	const { rafael } = people;
	const root = await note(
		people.ana.utils,
		'Should we mention the laptop pickup on Monday morning?'
	);
	await note(
		requestUtils,
		`Good call. <span class="wp-note-mention user-${ rafael.id }">@${ rafael.name }</span> can you add the pickup times?`,
		root.id
	);
	await note(
		rafael.utils,
		'Added them to Tools and accounts, with the office address.',
		root.id
	);

	return root.id;
}

/**
 * Opens a page in the workspace and waits for its title.
 *
 * @param admin  Admin helpers.
 * @param page   Playwright page.
 * @param pageId Page ID.
 */
async function openPage( admin: Admin, page: Page, pageId: number ) {
	await admin.visitAdminPage( 'admin.php', `page=tinta&doc=${ pageId }` );
	await expect(
		page
			.frameLocator( 'iframe[name="editor-canvas"]' )
			.getByRole( 'textbox', { name: 'Untitled' } )
	).toBeVisible();
	await parkMouse( page );
}

/**
 * Moves the pointer above the content, where it shows no hover controls.
 *
 * @param page Playwright page.
 */
async function parkMouse( page: Page ) {
	await page.mouse.move( page.viewportSize()!.width / 2, 60 );
}

/**
 * Picks the admin color scheme on the profile screen.
 *
 * @param admin  Admin helpers.
 * @param page   Playwright page.
 * @param scheme Scheme slug.
 * @return The scheme it replaced.
 */
async function setColorScheme( admin: Admin, page: Page, scheme: string ) {
	await admin.visitAdminPage( 'profile.php' );
	const previous = await page
		.locator( 'input[name="admin_color"]:checked' )
		.inputValue();
	await page.locator( `#admin_color_${ scheme }` ).check();
	await page.getByRole( 'button', { name: 'Update Profile' } ).click();
	await expect( page.locator( '#message' ) ).toBeVisible();

	return previous;
}

/**
 * Changes Tinta's settings.
 *
 * @param requestUtils            REST helpers.
 * @param settings                Settings to change.
 * @param settings.workspace_mode
 * @param settings.setup_done
 */
function setSettings(
	requestUtils: RequestUtils,
	settings: { workspace_mode?: boolean; setup_done?: boolean }
) {
	return requestUtils.rest( {
		method: 'POST',
		path: '/wp/v2/settings',
		data: { tinta_settings: settings },
	} );
}
