<?php
/**
 * The Liber Light admin color scheme.
 *
 * @package Liber
 */

namespace Liber\Workspace;

defined( 'ABSPATH' ) || exit;

/**
 * Adds Liber Light to the color schemes in Users → Profile, and gives it to
 * people who join while workspace mode is on. Everyone can still pick another.
 */
final class Color_Scheme {

	public const NAME = 'liber-light';

	/**
	 * Hooks the scheme and the default for new people.
	 */
	public function register(): void {
		add_action( 'admin_init', array( $this, 'add_scheme' ) );
		add_action( 'user_register', array( $this, 'suggest' ) );
	}

	/**
	 * Registers the scheme, with the swatches and icon colors the profile shows.
	 */
	public function add_scheme(): void {
		wp_admin_css_color(
			self::NAME,
			__( 'Liber Light', 'liber' ),
			plugins_url( 'build/admin-colors/liber-light.css', LIBER_FILE ),
			array( '#f6f7f7', '#e1e7fc', '#3858e9', '#1d2327' ),
			array(
				'base'    => '#646970',
				'focus'   => '#3858e9',
				'current' => '#3858e9',
			)
		);
	}

	/**
	 * New people get Liber Light while workspace mode is on.
	 *
	 * @param int $user_id New user's ID.
	 */
	public function suggest( int $user_id ): void {
		if ( Settings::is_workspace_mode() ) {
			update_user_meta( $user_id, 'admin_color', self::NAME );
		}
	}
}
