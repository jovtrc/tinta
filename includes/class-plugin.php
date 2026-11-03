<?php
/**
 * Plugin bootstrap.
 *
 * @package Liber
 */

namespace Liber;

defined( 'ABSPATH' ) || exit;

/**
 * Wires every module to WordPress.
 */
final class Plugin {

	/**
	 * Registers the hooks of every module.
	 */
	public static function boot(): void {
		( new Setup\Installer() )->register();
		( new Docs\Post_Type() )->register();
	}
}
