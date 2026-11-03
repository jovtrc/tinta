<?php
/**
 * Unit test bootstrap: no WordPress, no database. WordPress is the stubs in stubs/.
 *
 * @package Liber
 */

define( 'ABSPATH', __DIR__ . '/no-wordpress/' ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedConstantFound -- WordPress core constant.

require dirname( __DIR__, 2 ) . '/vendor/autoload.php';
require dirname( __DIR__, 2 ) . '/includes/autoload.php';
require __DIR__ . '/stubs/class-wp-post.php';
require __DIR__ . '/stubs/functions.php';
