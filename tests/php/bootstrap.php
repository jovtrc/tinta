<?php
/**
 * Test bootstrap: WordPress's own test suite, inside wp-env (pnpm test:php).
 *
 * @package Liber
 */

// phpcs:disable WordPressVIPMinimum.Files.IncludingFile.UsingVariable -- WP_TESTS_DIR comes from wp-env.

$liber_tests_dir = getenv( 'WP_TESTS_DIR' );
$liber_tests_dir = $liber_tests_dir ? $liber_tests_dir : '/wordpress-phpunit';

require_once $liber_tests_dir . '/includes/functions.php';

tests_add_filter(
	'muplugins_loaded',
	static function () {
		require dirname( __DIR__, 2 ) . '/liber.php';
	}
);

require $liber_tests_dir . '/includes/bootstrap.php';
