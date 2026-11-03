/**
 * Data the workspace screen prints for the app (PHP: `Workspace\Screen::app_data()`).
 */
export interface WorkspaceConfig {
	pageId: number;
	url: string;
	siteName: string;
	canCreate: boolean;
	settings: Record< string, unknown > & { styles?: object[] };
}

declare global {
	interface Window {
		liberWorkspace: WorkspaceConfig;
	}
}

export const POST_TYPE = 'liber_doc';

export const config = window.liberWorkspace;

/**
 * Workspace URL for a page.
 *
 * @param pageId Page ID.
 */
export function pageUrl( pageId: number ): string {
	const url = new URL( config.url, window.location.href );
	url.searchParams.set( 'doc', String( pageId ) );

	return url.toString();
}
