/**
 * Keyboard use: where focus goes when pages, dialogs, panels and steps open
 * and close, and the emoji grid's single Tab stop and arrow keys.
 */
import { expect, test } from '@wordpress/e2e-test-utils-playwright';

import {
	createPage,
	deleteAllPages,
	getPage,
	type PageRecord,
	setSetupDone,
	sidebarLink,
} from './utils';

test.describe( 'Keyboard', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await setSetupDone( requestUtils, true );
	} );

	test.beforeEach( async ( { requestUtils } ) => {
		await deleteAllPages( requestUtils );
	} );

	test( 'opens a new page with focus in its title', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const handbook = await createPage( requestUtils, 'Handbook' );
		await createPage( requestUtils, 'Onboarding', handbook );
		await admin.visitAdminPage(
			'admin.php',
			`page=tinta&doc=${ handbook }`
		);
		await expect(
			page.getByRole( 'button', {
				name: /^(Expand|Collapse) “Handbook”$/,
			} )
		).toBeVisible();

		await page
			.getByRole( 'button', { name: 'New page', exact: true } )
			.click();
		await expect(
			editor.canvas.getByRole( 'textbox', { name: 'Untitled' } )
		).toBeFocused();
		await page.keyboard.type( 'Roadmap' );
		await expect( sidebarLink( page, 'Roadmap' ) ).toBeVisible();
	} );

	test( 'gives focus back to the page menu when its dialogs close', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		await createPage( requestUtils, 'Handbook' );
		const roadmap = await createPage( requestUtils, 'Roadmap' );
		await admin.visitAdminPage(
			'admin.php',
			`page=tinta&doc=${ roadmap }`
		);
		const actions = page.getByRole( 'button', {
			name: 'Actions for “Roadmap”',
			exact: true,
		} );

		await actions.focus();
		await page.keyboard.press( 'Enter' );
		await page.getByRole( 'menuitem', { name: 'Move to…' } ).click();
		const moveInside = page.getByRole( 'combobox', {
			name: 'Move inside',
		} );
		await expect( moveInside ).toBeFocused();
		await page.keyboard.type( 'Hand' );
		await expect( moveInside ).toHaveAttribute( 'aria-expanded', 'true' );
		await page.keyboard.press( 'Escape' );
		await expect( moveInside ).toHaveAttribute( 'aria-expanded', 'false' );
		await page.keyboard.press( 'Escape' );
		await expect( page.getByRole( 'dialog' ) ).toBeHidden();
		await expect( actions ).toBeFocused();

		await page.keyboard.press( 'Enter' );
		await page.getByRole( 'menuitem', { name: 'Move to trash' } ).click();
		await expect(
			page.getByRole( 'dialog', { name: 'Move to trash?' } )
		).toHaveAccessibleDescription( /Roadmap/ );
		await page.keyboard.press( 'Escape' );
		await expect( actions ).toBeFocused();
	} );

	test( 'opens Settings on its first tab', async ( { admin, page } ) => {
		await admin.visitAdminPage( 'admin.php', 'page=tinta' );
		const settings = page.getByRole( 'button', {
			name: 'Settings',
			exact: true,
		} );

		await settings.click();
		await expect(
			page.getByRole( 'tab', { name: 'General' } )
		).toBeFocused();
		await page.keyboard.press( 'Escape' );
		await expect( settings ).toBeFocused();
	} );

	test( 'keeps focus with the note being worked on', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const { id: pageId } = await requestUtils.rest< PageRecord >( {
			method: 'POST',
			path: '/wp/v2/tinta-docs',
			data: {
				title: 'Handbook',
				status: 'private',
				content:
					'<!-- wp:paragraph --><p>VPN steps</p><!-- /wp:paragraph -->',
			},
		} );
		await admin.visitAdminPage( 'admin.php', `page=tinta&doc=${ pageId }` );
		const panel = page.getByRole( 'complementary', { name: 'Notes' } );
		const addNote = page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Add note' } );

		await editor.canvas.getByText( 'VPN steps' ).click();
		await editor.showBlockToolbar();
		await addNote.focus();
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Escape' );
		await expect( addNote ).toBeFocused();

		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Check the VPN.' );
		await page.keyboard.press( 'ControlOrMeta+Enter' );
		const thread = panel.getByRole( 'article' );
		await expect( thread ).toBeFocused();

		const reply = thread.getByRole( 'button', {
			name: 'Reply',
			exact: true,
		} );
		await reply.click();
		await page.keyboard.type( 'Done.' );
		await page.keyboard.press( 'ControlOrMeta+Enter' );
		await expect( thread.getByText( 'Done.' ) ).toBeVisible();
		await expect( reply ).toBeFocused();

		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Escape' );
		await expect( reply ).toBeFocused();

		await thread.getByRole( 'button', { name: 'Resolve' } ).click();
		await expect( panel ).toBeFocused();

		await panel.getByRole( 'button', { name: 'Close notes' } ).click();
		await expect(
			page.getByRole( 'button', { name: 'Notes', exact: true } )
		).toBeFocused();
	} );

	test( 'moves through the emoji with arrow keys, from one Tab stop', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const handbook = await createPage( requestUtils, 'Handbook' );
		await requestUtils.rest( {
			method: 'POST',
			path: '/wp/v2/users/me',
			data: {
				tinta_prefs: {
					pinned: [],
					recent: [],
					expanded: [],
					emojis: [],
				},
			},
		} );
		await admin.visitAdminPage(
			'admin.php',
			`page=tinta&doc=${ handbook }`
		);
		const search = page.getByRole( 'searchbox', { name: 'Filter emoji' } );
		const emoji = page.getByRole( 'option' );

		await editor.canvas.getByRole( 'button', { name: 'Add icon' } ).click();
		await search.focus();
		await page.keyboard.press( 'Tab' );
		await expect( emoji.first() ).toBeFocused();
		await page.keyboard.press( 'ArrowRight' );
		await expect( emoji.nth( 1 ) ).toBeFocused();
		await page.keyboard.press( 'ArrowDown' );
		await expect( emoji.nth( 9 ) ).toBeFocused();

		await page.keyboard.press( 'Shift+Tab' );
		await expect( search ).toBeFocused();
		await page.keyboard.press( 'Tab' );
		await expect( emoji.nth( 9 ) ).toBeFocused();

		const picked = await emoji.nth( 9 ).textContent();
		await page.keyboard.press( 'Enter' );
		await expect
			.poll(
				async () =>
					( await getPage( requestUtils, handbook ) ).meta._tinta_icon
			)
			.toBe( picked );
	} );
} );

test.describe( 'Keyboard in the setup wizard', () => {
	test.beforeEach( async ( { requestUtils } ) => {
		await deleteAllPages( requestUtils );
		await setSetupDone( requestUtils, false );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await setSetupDone( requestUtils, true );
	} );

	test( 'moves focus to each step', async ( { admin, page } ) => {
		await admin.visitAdminPage( 'admin.php', 'page=tinta' );
		const wizard = page.getByRole( 'dialog', {
			name: 'Set up your workspace',
		} );
		const name = wizard.getByRole( 'textbox', { name: 'Workspace name' } );

		await wizard.getByRole( 'button', { name: 'Get started' } ).click();
		await expect( name ).toBeFocused();
		await wizard.getByRole( 'button', { name: 'Continue' } ).click();
		await expect(
			wizard.getByRole( 'combobox', { name: 'New people join as' } )
		).toBeFocused();
		await wizard.getByRole( 'button', { name: 'Back' } ).click();
		await expect( name ).toBeFocused();
	} );
} );
