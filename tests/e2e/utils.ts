/**
 * Helpers shared by the e2e tests: pages and settings through the REST API.
 */
import type { RequestUtils } from '@wordpress/e2e-test-utils-playwright';

/**
 * Password for the users these tests create on the disposable Playground site.
 */
export const TEST_PASSWORD = 'tinta-e2e-password';

export interface PageRecord {
	id: number;
	parent: number;
	status: string;
	meta: { _tinta_icon: string };
	content: { raw: string };
	title: { raw: string };
}

/**
 * Reads a page through the REST API.
 *
 * @param requestUtils REST helpers.
 * @param pageId       Page ID.
 */
export function getPage( requestUtils: RequestUtils, pageId: number ) {
	return requestUtils.rest< PageRecord >( {
		path: `/wp/v2/tinta-docs/${ pageId }`,
		params: { context: 'edit' },
	} );
}

/**
 * A page link in the sidebar's page tree.
 *
 * @param page  Playwright page.
 * @param title Page title.
 */
export function sidebarLink(
	page: import( '@playwright/test' ).Page,
	title: string
) {
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
export async function createPage(
	requestUtils: RequestUtils,
	title: string,
	parent = 0
): Promise< number > {
	const record = await requestUtils.rest< PageRecord >( {
		method: 'POST',
		path: '/wp/v2/tinta-docs',
		data: { title, status: 'private', parent },
	} );

	return record.id;
}

/**
 * Deletes every page, trashed ones included.
 *
 * @param requestUtils REST helpers.
 */
export async function deleteAllPages( requestUtils: RequestUtils ) {
	const pages = await requestUtils.rest< PageRecord[] >( {
		path: '/wp/v2/tinta-docs',
		params: { status: 'private,trash', per_page: 100, context: 'edit' },
	} );

	await Promise.all(
		pages.map( ( { id } ) =>
			requestUtils.rest( {
				method: 'DELETE',
				path: `/wp/v2/tinta-docs/${ id }`,
				params: { force: true },
			} )
		)
	);
}

/**
 * Marks the setup wizard as done, or not yet done.
 *
 * @param requestUtils REST helpers.
 * @param done         Whether setup is done.
 */
export async function setSetupDone(
	requestUtils: RequestUtils,
	done: boolean
) {
	await requestUtils.rest( {
		method: 'POST',
		path: '/wp/v2/settings',
		data: { tinta_settings: { setup_done: done } },
	} );
}
