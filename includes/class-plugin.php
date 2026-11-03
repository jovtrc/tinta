<?php
/**
 * Plugin bootstrap.
 *
 * @package Tinta
 */

namespace Tinta;

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
		( new Setup\Setup_Redirect() )->register();
		( new Docs\Post_Type( $tree ) )->register();
		( new Docs\Private_Status() )->register();
		( new Docs\Revisions() )->register();
		( new Docs\Subtree_Trash() )->register();
		( new Docs\Last_Editor() )->register();
		( new Docs\Notes_Access() )->register();
		( new Docs\Read_Access() )->register();
		( new Docs\Other_Roles() )->register();
		$tree->register();
		( new Cache\Tree_Pulse( $tree ) )->register();
		( new Rest\Tree_Controller( $tree ) )->register();
		( new Rest\Lock_Controller() )->register();
		( new Rest\Restore_Controller() )->register();
		( new Rest\Move_Controller( new Docs\Mover( $tree ) ) )->register();
		( new Rest\User_Prefs_Field() )->register();
		( new Rest\People_Controller() )->register();
		( new Workspace\Screen( $tree ) )->register();
		( new Workspace\Settings() )->register();
		( new Workspace\Mode() )->register();
		( new Workspace\Private_Site() )->register();
		( new Workspace\Color_Scheme() )->register();
		( new Blocks\Registry() )->register();
		( new Blocks\Allowlist() )->register();
	}
}
