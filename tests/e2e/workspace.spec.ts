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
	status: string;
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
 * A page link in the workspace sidebar.
 *
 * @param page  Playwright page.
 * @param title Page title.
 */
function sidebarLink( page: import( '@playwright/test' ).Page, title: string ) {
	return page
		.getByRole( 'navigation', { name: 'Workspace' } )
		.getByRole( 'link', { name: title } );
}

/**
 * Creates a private page through the REST API.
 *
 * @param requestUtils REST helpers.
 * @param title        Page title.
 * @return The page ID.
 */
async function createPage(
	requestUtils: RequestUtils,
	title: string
): Promise< number > {
	const record = await requestUtils.rest< PageRecord >( {
		method: 'POST',
		path: '/wp/v2/liber-docs',
		data: { title, status: 'private' },
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
