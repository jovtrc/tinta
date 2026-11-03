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
		$tree = new Docs\Tree( new Cache\Cache() );

		( new Setup\Installer() )->register();
		( new Docs\Post_Type() )->register();
		( new Docs\Private_Status() )->register();
		( new Docs\Revisions() )->register();
		( new Docs\Subtree_Trash() )->register();
		$tree->register();
		( new Cache\Tree_Pulse( $tree ) )->register();
		( new Rest\Tree_Controller( $tree ) )->register();
		( new Rest\Lock_Controller() )->register();
		( new Rest\Restore_Controller() )->register();
		( new Workspace\Screen( $tree ) )->register();
	}
}
