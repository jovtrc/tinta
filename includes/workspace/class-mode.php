<?php
/**
 * Workspace mode.
 *
 * @package Liber
 */

namespace Liber\Workspace;

use WP_User;

defined( 'ABSPATH' ) || exit;

/**
 * With workspace mode on, people land in the workspace after logging in, and
 * Members and Viewers stay there: other wp-admin screens send them back,
 * except their profile. Administrators keep all of wp-admin.
 */
final class Mode {

	/**
	 * Hooks login and admin screens.
	 */
	public function register(): void {
		add_filter( 'login_redirect', array( $this, 'login_redirect' ), 10, 3 );
		add_action( 'admin_init', array( $this, 'keep_in_workspace' ) );
		add_filter( 'admin_body_class', array( $this, 'body_class' ) );
	}

	/**
	 * Sends workspace users to the workspace after login, unless they were going elsewhere.
	 *
	 * @param string                 $redirect_to Where core will send them.
	 * @param string                 $requested   Where the login form asked to go.
	 * @param WP_User|\WP_Error|null $user       User who logged in.
	 */
	public function login_redirect( string $redirect_to, string $requested, $user ): string {
		$goes_to_dashboard = '' === $requested || admin_url() === $requested;

		if ( Settings::is_workspace_mode() && $user instanceof WP_User && user_can( $user, 'liber_access' ) && $goes_to_dashboard ) {
			return Screen::url();
		}

		return $redirect_to;
	}

	/**
	 * Sends Members and Viewers back to the workspace from other admin screens.
	 */
	public function keep_in_workspace(): void {
		global $pagenow;

		if ( ! Settings::is_workspace_mode() || wp_doing_ajax() ) {
			return;
		}

		$url = self::redirect_for(
			(string) $pagenow,
			wp_unslash( $_GET ), // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only navigation.
			current_user_can( 'liber_access' ) && ! current_user_can( 'liber_manage' )
		);

		if ( $url ) {
			wp_safe_redirect( $url );
			exit;
		}
	}

	/**
	 * Where an admin screen request should go instead, for people kept in the workspace.
	 * Allowed: the workspace, their profile, uploads, admin-post, and core's lock take-over.
	 *
	 * @param string               $core_screen Admin file, like "index.php".
	 * @param array<string, mixed> $query       Query arguments.
	 * @param bool                 $is_kept     Whether the user is a Member or Viewer.
	 */
	public static function redirect_for( string $core_screen, array $query, bool $is_kept ): ?string {
		$allowed = in_array( $core_screen, array( 'profile.php', 'async-upload.php', 'admin-post.php' ), true )
			|| ( 'admin.php' === $core_screen && Screen::SLUG === ( $query['page'] ?? '' ) )
			|| ( 'post.php' === $core_screen && ! empty( $query['get-post-lock'] ) );

		return $is_kept && ! $allowed ? Screen::url() : null;
	}

	/**
	 * Marks admin pages while workspace mode is on, so the workspace can hide the admin chrome.
	 *
	 * @param string $classes Admin body classes.
	 */
	public function body_class( string $classes ): string {
		return Settings::is_workspace_mode() ? $classes . ' liber-workspace-mode' : $classes;
	}
}
