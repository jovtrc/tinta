<?php
/**
 * Class autoloader. Liber has no runtime Composer dependencies, so it maps its
 * own classes: `Liber\Docs\Post_Type` loads `includes/docs/class-post-type.php`.
 *
 * @package Liber
 */

defined( 'ABSPATH' ) || exit;

spl_autoload_register(
	static function ( string $class_name ): void {
		if ( ! str_starts_with( $class_name, 'Liber\\' ) ) {
			return;
		}

		$parts = explode( '\\', strtolower( str_replace( '_', '-', substr( $class_name, 6 ) ) ) );
		$file  = 'class-' . array_pop( $parts ) . '.php';
		$path  = __DIR__ . '/' . ( $parts ? implode( '/', $parts ) . '/' : '' ) . $file;

		if ( is_readable( $path ) ) {
			require $path; // phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.UsingVariable -- Built from a Liber class name, inside includes/.
		}
	}
);
