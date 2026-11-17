/**
 * Automated accessibility checks (axe-core, WCAG 2.2 A and AA) on Tinta's own
 * UI: the workspace, its dialogs, menus and panels. Serious and critical
 * problems fail the test.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@wordpress/e2e-test-utils-playwright';
import type { Page } from '@playwright/test';

import {
	createPage,
	deleteAllPages,
	setSetupDone,
	sidebarLink,
	TEST_PASSWORD,
} from './utils';

const WORKSPACE = '#tinta-workspace';
const MODAL = '.components-modal__screen-overlay';
const POPOVER = '.components-popover';
const DRAWER = '.tinta-drawer';

/**
 * Core's editable block text (`role="document"` with `aria-multiline`) is
 * WordPress's own markup, in every block editor; it's left out.
 */
const CORE_RICH_TEXT = [
	'iframe[name="editor-canvas"]',
	'.block-editor-rich-text__editable',
];

/**
 * Checks the given parts of the screen and fails on serious or critical problems.
 *
 * @param page    Playwright page.
 * @param include Selectors of the parts to check.
 */
async function expectAccessible( page: Page, include: string[] ) {
	let builder = new AxeBuilder( { page } )
		.withTags( [ 'wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa' ] )
		.exclude( CORE_RICH_TEXT );
	for ( const selector of include ) {
		builder = builder.include( selector );
	}
	const { violations } = await builder.analyze();

	expect(
		violations
			.filter( ( { impact } ) =>
				[ 'serious', 'critical' ].includes( impact ?? '' )
			)
			.map(
				( { id, help, nodes } ) =>
					`${ id }: ${ help } → ${ nodes
						.map( ( node ) => node.html.slice( 0, 200 ) )
						.join( ', ' ) }`
			)
	).toEqual( [] );
}

test.describe( 'Accessibility', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await setSetupDone( requestUtils, true );
	} );

	test.beforeEach( async ( { requestUtils } ) => {
		await deleteAllPages( requestUtils );
		await requestUtils.deleteAllUsers();
	} );

	test( 'the workspace with a page open', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const handbook = await createPage( requestUtils, 'Handbook' );
		await createPage( requestUtils, 'Onboarding', handbook );
		await admin.visitAdminPage(
			'admin.php',
			`page=tinta&doc=${ handbook }`
		);
		await expect( sidebarLink( page, 'Handbook' ) ).toBeVisible();

		await expectAccessible( page, [ WORKSPACE ] );
	} );

	test( 'the page menu and its dialogs', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const handbook = await createPage( requestUtils, 'Handbook' );
		await createPage( requestUtils, 'Roadmap' );
		await admin.visitAdminPage(
			'admin.php',
			`page=tinta&doc=${ handbook }`
		);
		const openMenu = () =>
			page
				.getByRole( 'button', {
					name: 'Actions for “Handbook”',
					exact: true,
				} )
				.click();

		await openMenu();
		await expect( page.locator( POPOVER ).getByRole( 'menu' ) ).toBeVisible();
		await expectAccessible( page, [ POPOVER ] );

		await page.getByRole( 'menuitem', { name: 'Move to…' } ).click();
		await expect( page.getByRole( 'dialog' ) ).toBeVisible();
		await expectAccessible( page, [ MODAL ] );
		await page.keyboard.press( 'Escape' );

		await openMenu();
		await page.getByRole( 'menuitem', { name: 'Rename' } ).click();
		await expect( page.getByRole( 'dialog' ) ).toBeVisible();
		await expectAccessible( page, [ MODAL ] );
	} );

	test( 'the settings and trash dialogs', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		await createPage( requestUtils, 'Handbook' );
		await admin.visitAdminPage( 'admin.php', 'page=tinta' );

		await page
			.getByRole( 'button', { name: 'Workspace settings' } )
			.click();
		await expect(
			page.getByRole( 'textbox', { name: 'Workspace name' } )
		).toBeVisible();
		await expectAccessible( page, [ MODAL ] );
		await page.keyboard.press( 'Escape' );

		await page.getByRole( 'button', { name: 'Trash' } ).click();
		await expect( page.getByRole( 'dialog' ) ).toBeVisible();
		await expectAccessible( page, [ MODAL ] );
	} );

	test( 'the notes panel', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const pageId = await createPage( requestUtils, 'Setup' );
		const note = await requestUtils.rest< { id: number } >( {
			method: 'POST',
			path: '/wp/v2/comments',
			data: {
				post: pageId,
				content: 'Check the Node version.',
				type: 'note',
				status: 'hold',
			},
		} );
		await requestUtils.rest( {
			method: 'POST',
			path: `/wp/v2/tinta-docs/${ pageId }`,
			data: {
				content: `<!-- wp:paragraph {"metadata":{"noteId":[${ note.id }]}} --><p>Install Node.</p><!-- /wp:paragraph -->`,
			},
		} );
		await admin.visitAdminPage( 'admin.php', `page=tinta&doc=${ pageId }` );

		await editor.canvas
			.getByRole( 'button', { name: '1 note on this block' } )
			.click();
		await expect(
			page.getByRole( 'complementary', { name: 'Notes' } )
		).toBeVisible();

		await expectAccessible( page, [ WORKSPACE ] );
	} );

	test( 'the setup wizard', async ( { admin, page, requestUtils } ) => {
		await setSetupDone( requestUtils, false );
		await admin.visitAdminPage( 'admin.php', 'page=tinta' );
		const wizard = page.getByRole( 'dialog', {
			name: 'Set up your workspace',
		} );
		await expect( wizard ).toBeVisible();
		await expectAccessible( page, [ MODAL ] );

		await wizard.getByRole( 'button', { name: 'Get started' } ).click();
		await expect(
			wizard.getByRole( 'textbox', { name: 'Workspace name' } )
		).toBeVisible();
		await expectAccessible( page, [ MODAL ] );
		await setSetupDone( requestUtils, true );
	} );

	test( 'the read-only view for viewers', async ( {
		browser,
		requestUtils,
	} ) => {
		const handbook = await createPage( requestUtils, 'Handbook' );
		await requestUtils.createUser( {
			username: 'vera',
			email: 'vera@example.com',
			password: TEST_PASSWORD,
			roles: [ 'tinta_viewer' ],
		} );
		const context = await browser.newContext( {
			baseURL: requestUtils.baseURL,
		} );
		await context.request.post( '/wp-login.php', {
			failOnStatusCode: true,
			form: { log: 'vera', pwd: TEST_PASSWORD },
		} );
		const page = await context.newPage();
		await page.goto( `/wp-admin/admin.php?page=tinta&doc=${ handbook }` );
		await expect( page.getByText( 'View only' ) ).toBeVisible();

		await expectAccessible( page, [ WORKSPACE ] );
		await context.close();
	} );

	test.describe( 'On a phone', () => {
		test.use( { viewport: { width: 390, height: 844 } } );

		test( 'the sidebar drawer', async ( { admin, page, requestUtils } ) => {
			const handbook = await createPage( requestUtils, 'Handbook' );
			await admin.visitAdminPage(
				'admin.php',
				`page=tinta&doc=${ handbook }`
			);

			await page.getByRole( 'button', { name: 'Open sidebar' } ).click();
			await expect(
				page.getByRole( 'dialog', { name: 'Sidebar' } )
			).toBeVisible();

			await expectAccessible( page, [ DRAWER ] );
		} );
	} );
} );
