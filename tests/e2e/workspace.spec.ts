/**
 * The workspace screen: creating, saving and switching pages.
 */
import { expect, test } from '@wordpress/e2e-test-utils-playwright';
import type { RequestUtils } from '@wordpress/e2e-test-utils-playwright';

interface PageRecord {
	id: number;
	status: string;
	title: { raw: string };
}

test.describe( 'Workspace', () => {
	test.beforeEach( async ( { requestUtils } ) => {
		await deleteAllPages( requestUtils );
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
