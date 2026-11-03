/**
 * The workspace screen: creating, saving and switching pages.
 */
import {
	expect,
	RequestUtils,
	test,
} from '@wordpress/e2e-test-utils-playwright';

/**
 * Password for the users these tests create on the disposable Playground site.
 */
const TEST_PASSWORD = 'liber-e2e-password';

interface PageRecord {
	id: number;
	parent: number;
	status: string;
	meta: { _liber_icon: string };
	content: { raw: string };
	title: { raw: string };
}

test.describe( 'Workspace', () => {
	test.beforeEach( async ( { requestUtils } ) => {
		await deleteAllPages( requestUtils );
		await requestUtils.deleteAllUsers();
	} );

	test( 'creates a private page and saves it while typing', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await admin.visitAdminPage( 'admin.php', 'page=liber' );
		await page
			.getByRole( 'button', { name: 'Create the first page' } )
			.click();
		await editor.canvas
			.getByRole( 'textbox', { name: 'Untitled' } )
			.fill( 'Roadmap' );

		await expect( sidebarLink( page, 'Roadmap' ) ).toBeVisible();

		const pageId = Number(
			new URL( page.url() ).searchParams.get( 'doc' )
		);

		await expect
			.poll(
				async () => ( await getPage( requestUtils, pageId ) ).title.raw
			)
			.toBe( 'Roadmap' );
		expect( ( await getPage( requestUtils, pageId ) ).status ).toBe(
			'private'
		);
		await expect(
			page.getByText( 'Saved', { exact: true } )
		).toBeVisible();
	} );

	test( 'opens pages in place, with back and forward', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const handbook = await createPage( requestUtils, 'Handbook' );
		const roadmap = await createPage( requestUtils, 'Roadmap' );
		const title = editor.canvas.getByRole( 'textbox', {
			name: 'Untitled',
		} );

		await admin.visitAdminPage(
			'admin.php',
			`page=liber&doc=${ handbook }`
		);
		await expect( title ).toHaveText( 'Handbook' );
		await page.evaluate( () => {
			( window as unknown as Record< string, boolean > ).liberLoaded =
				true;
		} );

		await sidebarLink( page, 'Roadmap' ).click();
		await expect( page ).toHaveURL( new RegExp( `doc=${ roadmap }` ) );
		await expect( title ).toHaveText( 'Roadmap' );

		await page.goBack();
		await expect( title ).toHaveText( 'Handbook' );

		const isSameDocument = await page.evaluate(
			() => ( window as unknown as Record< string, boolean > ).liberLoaded
		);
		expect( isSameDocument ).toBe( true );
	} );

	test( 'shows pages other people create, on the next Heartbeat', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		await createPage( requestUtils, 'Handbook' );
		await admin.visitAdminPage( 'admin.php', 'page=liber' );
		await expect( sidebarLink( page, 'Handbook' ) ).toBeVisible();

		await createPage( requestUtils, 'Created elsewhere' );
		await page.evaluate( () =>
			(
				window as unknown as {
					wp: { heartbeat: { connectNow: () => void } };
				}
			 ).wp.heartbeat.connectNow()
		);

		await expect( sidebarLink( page, 'Created elsewhere' ) ).toBeVisible();
	} );

	test( 'finds and opens pages from the command palette', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const handbook = await createPage( requestUtils, 'Handbook' );
		const onboarding = await createPage(
			requestUtils,
			'Onboarding',
			handbook
		);
		await admin.visitAdminPage(
			'admin.php',
			`page=liber&doc=${ handbook }`
		);

		await page.keyboard.press( 'ControlOrMeta+k' );
		await page.keyboard.type( 'onboard' );
		await page
			.getByRole( 'option', { name: 'Onboarding (Handbook)' } )
			.click();

		await expect( page ).toHaveURL( new RegExp( `doc=${ onboarding }` ) );
		await expect(
			editor.canvas.getByRole( 'textbox', { name: 'Untitled' } )
		).toHaveText( 'Onboarding' );
	} );

	test( 'sets a page icon from the list or any emoji', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const handbook = await createPage( requestUtils, 'Handbook' );
		const icon = async () =>
			( await getPage( requestUtils, handbook ) ).meta._liber_icon;
		await admin.visitAdminPage(
			'admin.php',
			`page=liber&doc=${ handbook }`
		);

		await editor.canvas.getByRole( 'button', { name: 'Add icon' } ).click();
		await page
			.getByRole( 'searchbox', { name: 'Filter emoji' } )
			.fill( 'rocket' );
		await page.getByRole( 'button', { name: 'rocket launch' } ).click();
		await expect.poll( icon ).toBe( '🚀' );

		await editor.canvas
			.getByRole( 'button', { name: 'Change icon' } )
			.click();
		await page
			.getByRole( 'searchbox', { name: 'Filter emoji' } )
			.fill( '🦄' );
		await page.getByRole( 'button', { name: 'Use 🦄' } ).click();
		await expect.poll( icon ).toBe( '🦄' );
	} );

	test( 'keeps edits made right before switching pages', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const handbook = await createPage( requestUtils, 'Handbook' );
		await createPage( requestUtils, 'Roadmap' );

		await admin.visitAdminPage(
			'admin.php',
			`page=liber&doc=${ handbook }`
		);
		await editor.canvas
			.getByRole( 'textbox', { name: 'Untitled' } )
			.fill( 'Team handbook' );
		await sidebarLink( page, 'Roadmap' ).click();

		await expect
			.poll(
				async () =>
					( await getPage( requestUtils, handbook ) ).title.raw
			)
			.toBe( 'Team handbook' );
	} );
} );

test.describe( 'Page actions and trash', () => {
	test.beforeEach( async ( { requestUtils } ) => {
		await deleteAllPages( requestUtils );
	} );

	test( 'adds a page inside another', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const handbook = await createPage( requestUtils, 'Handbook' );
		await admin.visitAdminPage(
			'admin.php',
			`page=liber&doc=${ handbook }`
		);

		await sidebarLink( page, 'Handbook' ).hover();
		await page
			.getByRole( 'button', { name: 'Add a page inside “Handbook”' } )
			.click();

		await expect( page ).not.toHaveURL( new RegExp( `doc=${ handbook }` ) );
		const pageId = Number(
			new URL( page.url() ).searchParams.get( 'doc' )
		);
		expect( ( await getPage( requestUtils, pageId ) ).parent ).toBe(
			handbook
		);
	} );

	test( 'moves a page and its subpages to the trash, and restores them', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const handbook = await createPage( requestUtils, 'Handbook' );
		const onboarding = await createPage(
			requestUtils,
			'Onboarding',
			handbook
		);
		await createPage( requestUtils, 'Roadmap' );
		await admin.visitAdminPage(
			'admin.php',
			`page=liber&doc=${ handbook }`
		);

		await sidebarLink( page, 'Handbook' ).hover();
		await page
			.getByRole( 'button', { name: 'Actions for “Handbook”' } )
			.click();
		await page.getByRole( 'menuitem', { name: 'Move to trash' } ).click();
		await expect(
			page.getByText( '“Handbook” and its 1 subpage go to the trash.' )
		).toBeVisible();
		await page
			.getByRole( 'dialog' )
			.getByRole( 'button', { name: 'Move to trash' } )
			.click();

		await expect( sidebarLink( page, 'Handbook' ) ).toHaveCount( 0 );
		await expect( sidebarLink( page, 'Roadmap' ) ).toHaveAttribute(
			'aria-current',
			'page'
		);
		expect( ( await getPage( requestUtils, onboarding ) ).status ).toBe(
			'trash'
		);

		await page
			.getByRole( 'button', { name: 'Trash', exact: true } )
			.click();
		await page.getByRole( 'button', { name: 'Restore' } ).click();
		await expect( page.getByText( 'The trash is empty.' ) ).toBeVisible();
		await page.getByRole( 'button', { name: 'Close' } ).click();
		await expect( sidebarLink( page, 'Handbook' ) ).toBeVisible();
		expect( ( await getPage( requestUtils, onboarding ) ).status ).toBe(
			'private'
		);
	} );
} );

test.describe( 'Moving pages', () => {
	test.beforeEach( async ( { requestUtils } ) => {
		await deleteAllPages( requestUtils );
	} );

	test( 'moves pages by dragging them', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const handbook = await createPage( requestUtils, 'Handbook' );
		const roadmap = await createPage( requestUtils, 'Roadmap' );
		const ideas = await createPage( requestUtils, 'Ideas' );
		await admin.visitAdminPage( 'admin.php', `page=liber&doc=${ ideas }` );

		await dragOnto( page, 'Roadmap', 'Handbook', 'inside' );
		await expect
			.poll(
				async () => ( await getPage( requestUtils, roadmap ) ).parent
			)
			.toBe( handbook );

		await dragOnto( page, 'Ideas', 'Handbook', 'before' );
		await expect
			.poll( async () => {
				const tree = await requestUtils.rest< {
					pages: { title: string; parent: number }[];
				} >( { path: '/liber/v1/tree' } );

				return tree.pages
					.filter( ( { parent } ) => ! parent )
					.map( ( { title } ) => title );
			} )
			.toEqual( [ 'Ideas', 'Handbook' ] );
	} );
} );

/**
 * Drags a sidebar page onto another one, inside it or above it.
 *
 * @param page  Playwright page.
 * @param from  Title of the page to drag.
 * @param onto  Title of the target page.
 * @param where Drop inside the target, or above it.
 */
async function dragOnto(
	page: import( '@playwright/test' ).Page,
	from: string,
	onto: string,
	where: 'inside' | 'before'
) {
	const start = ( await sidebarLink( page, from ).boundingBox() )!;
	const end = ( await sidebarLink( page, onto ).boundingBox() )!;
	const startX = start.x + start.width / 2;
	const startY = start.y + start.height / 2;

	await page.mouse.move( startX, startY );
	await page.mouse.down();
	await page.mouse.move( startX, startY + 10, { steps: 5 } );
	await page.mouse.move(
		end.x + end.width / 2,
		where === 'inside' ? end.y + end.height / 2 : end.y + 2,
		{ steps: 10 }
	);
	await page.mouse.up();
}

test( 'moves a page with "Move to…"', async ( {
	admin,
	page,
	requestUtils,
} ) => {
	await deleteAllPages( requestUtils );
	const handbook = await createPage( requestUtils, 'Handbook' );
	const roadmap = await createPage( requestUtils, 'Roadmap' );
	await admin.visitAdminPage( 'admin.php', `page=liber&doc=${ roadmap }` );

	await sidebarLink( page, 'Roadmap' ).hover();
	await page.getByRole( 'button', { name: 'Actions for “Roadmap”' } ).click();
	await page.getByRole( 'menuitem', { name: 'Move to…' } ).click();
	await page.getByRole( 'combobox', { name: 'Move inside' } ).fill( 'Hand' );
	await page.getByRole( 'option', { name: 'Handbook' } ).click();
	await page.getByRole( 'button', { name: 'Move', exact: true } ).click();

	await expect
		.poll( async () => ( await getPage( requestUtils, roadmap ) ).parent )
		.toBe( handbook );
} );

test.describe( 'Pinned, recent and expanded', () => {
	test.beforeEach( async ( { requestUtils } ) => {
		await deleteAllPages( requestUtils );
		await requestUtils.rest( {
			method: 'POST',
			path: '/wp/v2/users/me',
			data: {
				liber_prefs: {
					pinned: [],
					recent: [],
					expanded: [],
					emojis: [],
				},
			},
		} );
	} );

	test( 'keeps pins, recent pages and expanded branches per user', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const handbook = await createPage( requestUtils, 'Handbook' );
		await createPage( requestUtils, 'Onboarding', handbook );
		const roadmap = await createPage( requestUtils, 'Roadmap' );
		await admin.visitAdminPage(
			'admin.php',
			`page=liber&doc=${ roadmap }`
		);

		await sidebarLink( page, 'Handbook' ).click();
		const recent = page.getByRole( 'list', { name: 'Recent' } );
		await expect( recent.getByRole( 'link' ) ).toHaveText( [
			'Handbook',
			'Roadmap',
		] );

		await sidebarLink( page, 'Roadmap' ).hover();
		await page
			.getByRole( 'button', { name: 'Actions for “Roadmap”' } )
			.click();
		await page.getByRole( 'menuitem', { name: 'Pin' } ).click();
		await expect(
			page.getByRole( 'list', { name: 'Pinned' } ).getByRole( 'link' )
		).toHaveText( [ 'Roadmap' ] );
		await page.getByRole( 'button', { name: 'Expand' } ).click();
		await expect( sidebarLink( page, 'Onboarding' ) ).toBeVisible();
		await expect
			.poll( async () => {
				const { liber_prefs: prefs } = await requestUtils.rest< {
					liber_prefs: { pinned: number[]; expanded: number[] };
				} >( {
					path: '/wp/v2/users/me',
					params: { context: 'edit' },
				} );
				return [ prefs.pinned, prefs.expanded ];
			} )
			.toEqual( [ [ roadmap ], [ handbook ] ] );

		await page.reload();
		await expect(
			page.getByRole( 'list', { name: 'Pinned' } ).getByRole( 'link' )
		).toHaveText( [ 'Roadmap' ] );
		await expect( sidebarLink( page, 'Onboarding' ) ).toBeVisible();
	} );
} );

test.describe( 'Blocks', () => {
	test.beforeEach( async ( { requestUtils } ) => {
		await deleteAllPages( requestUtils );
	} );

	test( 'writes in a callout right after inserting it', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const pageId = await createPage( requestUtils, 'Notes' );
		await admin.visitAdminPage( 'admin.php', `page=liber&doc=${ pageId }` );

		await startTyping( editor );
		await page.keyboard.type( '/callout' );
		await expect(
			page.getByRole( 'option', { name: 'Callout' } )
		).toBeVisible();
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Remember the handbook.' );

		await expect
			.poll(
				async () =>
					( await getPage( requestUtils, pageId ) ).content.raw
			)
			.toMatch( /wp:liber\/callout[\s\S]*Remember the handbook\./ );
	} );

	test( 'links to a page and opens it', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const handbook = await createPage( requestUtils, 'Handbook' );
		const roadmap = await createPage( requestUtils, 'Roadmap' );
		await admin.visitAdminPage(
			'admin.php',
			`page=liber&doc=${ roadmap }`
		);

		await startTyping( editor );
		await page.keyboard.type( '/page link' );
		await expect(
			page.getByRole( 'option', { name: 'Page link' } )
		).toBeVisible();
		await page.keyboard.press( 'Enter' );
		await editor.canvas
			.getByRole( 'combobox', { name: 'Page' } )
			.fill( 'Hand' );
		await editor.canvas.getByRole( 'option', { name: 'Handbook' } ).click();

		await expect
			.poll(
				async () =>
					( await getPage( requestUtils, roadmap ) ).content.raw
			)
			.toContain( `"pageId":${ handbook }` );

		await editor.showBlockToolbar();
		await page.getByRole( 'button', { name: 'Open', exact: true } ).click();
		await expect( page ).toHaveURL( new RegExp( `doc=${ handbook }` ) );
	} );

	test( 'offers only the allowed blocks', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const pageId = await createPage( requestUtils, 'Notes' );
		await admin.visitAdminPage( 'admin.php', `page=liber&doc=${ pageId }` );

		await startTyping( editor );
		await page.keyboard.type( '/table' );
		await expect(
			page.getByRole( 'option', { name: 'Table' } )
		).toBeVisible();

		await page.keyboard.press( 'Escape' );
		await page.keyboard.press( 'ControlOrMeta+a' );
		await page.keyboard.type( '/columns' );
		await expect(
			page.getByRole( 'option', { name: 'Columns' } )
		).toHaveCount( 0 );
	} );
} );

/**
 * Puts the cursor in a new page's first block.
 *
 * @param editor Editor helpers.
 */
async function startTyping(
	editor: import( '@wordpress/e2e-test-utils-playwright' ).Editor
) {
	await editor.canvas
		.getByRole( 'button', { name: 'Add default block' } )
		.click();
}

test.describe( 'Notes', () => {
	test.beforeEach( async ( { requestUtils } ) => {
		await deleteAllPages( requestUtils );
	} );

	test( 'adds a note with a mention, replies and resolves it', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const { id: pageId } = await requestUtils.rest< PageRecord >( {
			method: 'POST',
			path: '/wp/v2/liber-docs',
			data: {
				title: 'Handbook',
				status: 'private',
				content:
					'<!-- wp:paragraph --><p>VPN steps</p><!-- /wp:paragraph -->',
			},
		} );
		const notes = () =>
			requestUtils.rest< { status: string; content: { raw: string } }[] >(
				{
					path: '/wp/v2/comments',
					params: {
						post: pageId,
						type: 'note',
						status: 'all',
						context: 'edit',
						parent: 0,
					},
				}
			);
		await admin.visitAdminPage( 'admin.php', `page=liber&doc=${ pageId }` );

		await editor.canvas.getByText( 'VPN steps' ).click();
		await editor.showBlockToolbar();
		await page.getByRole( 'button', { name: 'Add note' } ).click();
		await page.keyboard.type( 'Please check, @adm' );
		await expect(
			page.getByRole( 'list', { name: 'People to mention' } )
		).toBeVisible();
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'thanks' );
		await page.keyboard.press( 'ControlOrMeta+Enter' );

		await expect
			.poll( async () => ( await notes() )[ 0 ]?.content.raw )
			.toContain( 'class="wp-note-mention user-1"' );

		const panel = page.getByRole( 'complementary', { name: 'Notes' } );
		await panel
			.getByRole( 'button', { name: 'Reply', exact: true } )
			.click();
		await page.keyboard.type( 'Done.' );
		await page.keyboard.press( 'ControlOrMeta+Enter' );
		await expect( panel.getByText( 'Done.' ) ).toBeVisible();

		await panel
			.getByRole( 'button', { name: 'Resolve', exact: true } )
			.click();
		await expect( panel.getByText( /No open notes/ ) ).toBeVisible();
		await expect
			.poll( async () => ( await notes() )[ 0 ]?.status )
			.toBe( 'approved' );
	} );
} );

test.describe( 'Settings', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.rest( {
			method: 'POST',
			path: '/wp/v2/settings',
			data: { liber_settings: { workspace_mode: false } },
		} );
	} );

	test( 'turns workspace mode on from the settings', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		await deleteAllPages( requestUtils );
		await createPage( requestUtils, 'Handbook' );
		await admin.visitAdminPage( 'admin.php', 'page=liber' );
		await expect( page.locator( '#adminmenuwrap' ) ).toBeVisible();

		await page
			.getByRole( 'button', { name: 'Workspace settings' } )
			.click();
		await page.getByRole( 'checkbox', { name: 'Workspace mode' } ).check();
		await page.getByRole( 'button', { name: 'Save', exact: true } ).click();

		await expect( page.locator( '#adminmenuwrap' ) ).toBeHidden();
		await page.getByRole( 'button', { name: 'Your account' } ).click();
		await expect(
			page.getByRole( 'menuitem', { name: 'Admin tools' } )
		).toBeVisible();
	} );
} );

test.describe( 'Mobile', () => {
	test.use( { viewport: { width: 390, height: 844 } } );

	test.beforeEach( async ( { requestUtils } ) => {
		await deleteAllPages( requestUtils );
	} );

	test( 'opens the sidebar as a drawer', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const handbook = await createPage( requestUtils, 'Handbook' );
		await createPage( requestUtils, 'Roadmap' );
		const drawer = page.getByRole( 'dialog', { name: 'Sidebar' } );
		const menuButton = page.getByRole( 'button', { name: 'Open sidebar' } );

		await admin.visitAdminPage(
			'admin.php',
			`page=liber&doc=${ handbook }`
		);
		await expect( menuButton ).toBeVisible();
		await expect( sidebarLink( page, 'Roadmap' ) ).toBeHidden();

		await menuButton.click();
		await expect( drawer ).toBeVisible();
		await page.keyboard.press( 'Escape' );
		await expect( drawer ).toBeHidden();
		await expect( menuButton ).toBeFocused();

		await menuButton.click();
		await sidebarLink( page, 'Roadmap' ).click();
		await expect( drawer ).toBeHidden();
		await expect(
			editor.canvas.getByRole( 'textbox', { name: 'Untitled' } )
		).toHaveText( 'Roadmap' );
	} );
} );

test.describe( 'Locks and roles', () => {
	test.beforeEach( async ( { requestUtils } ) => {
		await deleteAllPages( requestUtils );
		await requestUtils.deleteAllUsers();
	} );

	test( 'tells you who is editing a page', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const handbook = await createPage( requestUtils, 'Handbook' );
		await requestUtils.createUser( {
			username: 'maria',
			email: 'maria@example.com',
			firstName: 'Maria',
			lastName: 'Souza',
			password: TEST_PASSWORD,
			roles: [ 'liber_member' ],
		} );
		const asMaria = await RequestUtils.setup( {
			user: { username: 'maria', password: TEST_PASSWORD },
			baseURL: requestUtils.baseURL,
		} );
		await asMaria.rest( {
			method: 'POST',
			path: `/liber/v1/docs/${ handbook }/lock`,
		} );

		await admin.visitAdminPage(
			'admin.php',
			`page=liber&doc=${ handbook }`
		);

		const dialog = page.getByRole( 'dialog', {
			name: 'This post is already being edited',
		} );
		await expect( dialog ).toBeVisible();
		await expect(
			dialog.getByRole( 'link', { name: 'Take over' } )
		).toBeVisible();
	} );

	test( 'shows pages read-only to viewers', async ( {
		browser,
		requestUtils,
	} ) => {
		const handbook = await createPage( requestUtils, 'Handbook' );
		await requestUtils.createUser( {
			username: 'vera',
			email: 'vera@example.com',
			password: TEST_PASSWORD,
			roles: [ 'liber_viewer' ],
		} );
		const context = await browser.newContext( {
			baseURL: requestUtils.baseURL,
		} );
		const page = await context.newPage();

		await page.goto(
			`/wp-login.php?redirect_to=${ encodeURIComponent(
				`/wp-admin/admin.php?page=liber&doc=${ handbook }`
			) }`
		);
		await page.getByLabel( 'Username or Email Address' ).fill( 'vera' );
		await page
			.getByLabel( 'Password', { exact: true } )
			.fill( TEST_PASSWORD );
		await page.getByRole( 'button', { name: 'Log In' } ).click();

		await expect( page.getByText( 'View only' ) ).toBeVisible();
		await expect(
			page.getByRole( 'button', { name: 'New page' } )
		).toHaveCount( 0 );

		await context.close();
	} );
} );

/**
 * Reads a page through the REST API.
 *
 * @param requestUtils REST helpers.
 * @param pageId       Page ID.
 */
function getPage( requestUtils: RequestUtils, pageId: number ) {
	return requestUtils.rest< PageRecord >( {
		path: `/wp/v2/liber-docs/${ pageId }`,
		params: { context: 'edit' },
	} );
}

/**
 * A page link in the sidebar's page tree.
 *
 * @param page  Playwright page.
 * @param title Page title.
 */
function sidebarLink( page: import( '@playwright/test' ).Page, title: string ) {
	return page
		.getByRole( 'list', { name: 'Pages' } )
		.getByRole( 'link', { name: title } );
}

/**
 * Creates a private page through the REST API.
 *
 * @param requestUtils REST helpers.
 * @param title        Page title.
 * @param parent       Parent page ID.
 * @return The page ID.
 */
async function createPage(
	requestUtils: RequestUtils,
	title: string,
	parent = 0
): Promise< number > {
	const record = await requestUtils.rest< PageRecord >( {
		method: 'POST',
		path: '/wp/v2/liber-docs',
		data: { title, status: 'private', parent },
	} );

	return record.id;
}

/**
 * Deletes every page, trashed ones included.
 *
 * @param requestUtils REST helpers.
 */
async function deleteAllPages( requestUtils: RequestUtils ) {
	const pages = await requestUtils.rest< PageRecord[] >( {
		path: '/wp/v2/liber-docs',
		params: { status: 'private,trash', per_page: 100, context: 'edit' },
	} );

	await Promise.all(
		pages.map( ( { id } ) =>
			requestUtils.rest( {
				method: 'DELETE',
				path: `/wp/v2/liber-docs/${ id }`,
				params: { force: true },
			} )
		)
	);
}
