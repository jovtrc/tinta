<?php
/**
 * Tinta's blocks.
 *
 * @package Tinta
 */

namespace Tinta\Blocks;

defined( 'ABSPATH' ) || exit;

/**
 * Registers every block built to `build/blocks/`, from the manifest the build writes.
 */
final class Registry {

	/**
	 * Hooks the registration.
	 */
	public function register(): void {
		add_action( 'init', array( $this, 'register_blocks' ) );
	}

	/**
	 * Registers the blocks.
	 */
	public function register_blocks(): void {
		$build = plugin_dir_path( TINTA_FILE ) . 'build';

		if ( is_readable( "{$build}/blocks-manifest.php" ) ) {
			wp_register_block_types_from_metadata_collection( "{$build}/blocks", "{$build}/blocks-manifest.php" );
		}
	}
}
