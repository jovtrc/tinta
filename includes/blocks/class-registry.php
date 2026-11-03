<?php
/**
 * Liber's blocks.
 *
 * @package Liber
 */

namespace Liber\Blocks;

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
		$build = plugin_dir_path( LIBER_FILE ) . 'build';

		if ( is_readable( "{$build}/blocks-manifest.php" ) ) {
			wp_register_block_types_from_metadata_collection( "{$build}/blocks", "{$build}/blocks-manifest.php" );
		}
	}
}
