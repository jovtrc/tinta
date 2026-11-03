<?php
/**
 * Opens the setup wizard after activation.
 *
 * @package Tinta
 */

namespace Tinta\Setup;

use Tinta\Workspace\Screen;
use Tinta\Workspace\Settings;

defined( 'ABSPATH' ) || exit;

/**
 * Activating Tinta on a site takes the administrator who did it to the
 * workspace, where the setup wizard opens. Only once, and not for bulk or
 * network activation, WP-CLI, or a site whose setup is already done.
 */
final class Setup_Redirect {

	public const FLAG = 'tinta_setup_redirect';

	/**
	 * Remembers who activated the plugin (activation hook).
	 *
	 * @param bool $network_wide Whether the plugin was network activated.
	 */
	public static function flag( bool $network_wide = false ): void {
		$user_id = get_current_user_id();

		if ( $user_id && ! $network_wide ) {
			set_transient( self::FLAG, $user_id, MINUTE_IN_SECONDS );
		}
	}

	/**
	 * Hooks the redirect.
	 */
	public function register(): void {
		add_action( 'admin_init', array( $this, 'maybe_redirect' ) );
	}

	/**
	 * Sends the administrator who activated the plugin to the workspace.
	 */
	public function maybe_redirect(): void {
		$user_id = get_transient( self::FLAG );

		if ( false === $user_id || wp_doing_ajax() ) {
			return;
		}

		delete_transient( self::FLAG );

		if ( $this->should_redirect( (int) $user_id ) ) {
			wp_safe_redirect( Screen::url() );
			exit;
		}
	}

	/**
	 * Whether this request may leave for the wizard.
	 *
	 * @param int $user_id Who activated the plugin.
	 */
	private function should_redirect( int $user_id ): bool {
		return get_current_user_id() === $user_id
			&& ! is_network_admin()
			&& ! isset( $_GET['activate-multi'] ) // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read only: core's flag for bulk activation.
			&& ! Settings::get()['setup_done']
			&& current_user_can( 'tinta_manage' );
	}
}
