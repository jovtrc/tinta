<?php
/**
 * A private site, with workspace mode on.
 *
 * @package Liber
 */

namespace Liber\Workspace;

use WP_Error;

defined( 'ABSPATH' ) || exit;

/**
 * Logged-out visitors are sent to the login screen (feeds, author archives and
 * the rest of the front end included), the REST API asks for a login, and
 * sitemaps are off. Nothing changes while workspace mode is off.
 */
final class Private_Site {

	/**
	 * Hooks the front end, REST and sitemaps.
	 */
	public function register(): void {
		add_action( 'template_redirect', array( $this, 'require_login' ), 0 );
		add_filter( 'rest_authentication_errors', array( $this, 'require_rest_login' ) );
		add_filter( 'wp_sitemaps_enabled', array( $this, 'sitemaps_enabled' ) );
	}

	/**
	 * Sends logged-out visitors to the login screen, before core's canonical
	 * redirects, which would reveal usernames (`?author=1`).
	 */
	public function require_login(): void {
		if ( Settings::is_workspace_mode() && ! is_user_logged_in() ) {
			auth_redirect();
		}
	}

	/**
	 * Refuses REST requests from logged-out visitors.
	 *
	 * @param WP_Error|null|true $result Authentication result so far.
	 * @return WP_Error|null|true
	 */
	public function require_rest_login( $result ) {
		if ( null !== $result || is_user_logged_in() || ! Settings::is_workspace_mode() ) {
			return $result;
		}

		return new WP_Error(
			'rest_not_logged_in',
			__( 'This workspace is private. Please log in.', 'liber' ),
			array( 'status' => 401 )
		);
	}

	/**
	 * Turns sitemaps off.
	 *
	 * @param bool $enabled Whether sitemaps are on.
	 */
	public function sitemaps_enabled( bool $enabled ): bool {
		return $enabled && ! Settings::is_workspace_mode();
	}
}
