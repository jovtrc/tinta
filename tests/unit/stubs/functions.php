<?php
/**
 * Stand-ins for the WordPress functions unit tests need, backed by Fixture.
 *
 * @package Liber
 */

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals -- Stand-ins for WordPress core functions.

use Liber\Tests\Unit\Fixture;

/**
 * Post type of a post ID registered in Fixture.
 *
 * @param int $post Post ID.
 * @return string|false
 */
function get_post_type( $post = null ) {
	return Fixture::$post_types[ $post ] ?? false;
}
