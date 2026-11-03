<?php
/**
 * Per-site install and upgrades.
 *
 * @package Tinta
 */

namespace Tinta\Setup;

use Tinta\Roles\Roles;

defined( 'ABSPATH' ) || exit;

/**
 * Sets a site up when its stored version differs from the plugin's.
 *
 * Checking on every request covers activation, network activation, sites
 * created later on a network, and upgrades.
 */
final class Installer {

	public const VERSION_OPTION = 'tinta_version';

	/**
	 * Hooks the version check.
	 */
	public function register(): void {
		add_action( 'init', array( $this, 'maybe_install' ), 1 );
	}

	/**
	 * Installs when this site runs an older version, or none.
	 */
	public function maybe_install(): void {
		if ( TINTA_VERSION !== get_option( self::VERSION_OPTION ) ) {
			self::install();
		}
	}

	/**
	 * Adds roles and capabilities, then records the version.
	 */
	public static function install(): void {
		Roles::install();
		update_option( self::VERSION_OPTION, TINTA_VERSION, true );
	}
}
