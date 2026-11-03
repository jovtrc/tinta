/**
 * Data the workspace screen prints for the app (PHP: `Workspace\Screen::app_data()`).
 */
export interface WorkspaceConfig {
	pageId: number;
	url: string;
	siteName: string;
	siteIcon: string;
	canCreate: boolean;
	canManage: boolean;
	roles: Record< string, string >;
	setup: {
		done: boolean;
		conflicts: Array< { name: string; reason: string } >;
		openRegistration: boolean;
		registrationUrl: string;
	} | null;
	userId: number;
	user: { name: string; role: string; avatar: string };
	links: {
		profile: string;
		admin: string;
		invite: string;
		plugins: string;
		logout: string;
	};
	settings: Record< string, unknown > & { styles?: object[] };
}

declare global {
	interface Window {
		tintaWorkspace: WorkspaceConfig;
	}
}

export const POST_TYPE = 'tinta_doc';

/**
 * Deepest level a page can have (PHP: `Post_Type::MAX_DEPTH`).
 */
export const MAX_DEPTH = 5;

export const config = window.tintaWorkspace;

/**
 * Workspace URL for a page.
 *
 * @param pageId Page ID; 0 opens the empty workspace.
 */
export function pageUrl( pageId: number ): string {
	const url = new URL( config.url, window.location.href );
	url.searchParams.set( 'doc', String( pageId ) );

	return url.toString();
}
