<?php
/**
 * Test bootstrap: WordPress's own test suite, inside wp-env (pnpm test:php).
 *
 * @package Tinta
 */

// phpcs:disable WordPressVIPMinimum.Files.IncludingFile.UsingVariable -- WP_TESTS_DIR comes from wp-env.

$tinta_tests_dir = getenv( 'WP_TESTS_DIR' );
$tinta_tests_dir = $tinta_tests_dir ? $tinta_tests_dir : '/wordpress-phpunit';

require_once $tinta_tests_dir . '/includes/functions.php';

tests_add_filter(
	'muplugins_loaded',
	static function () {
		require dirname( __DIR__, 2 ) . '/tinta.php';
	}
);

require $tinta_tests_dir . '/includes/bootstrap.php';
