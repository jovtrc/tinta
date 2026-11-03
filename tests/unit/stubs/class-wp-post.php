<?php
/**
 * Stand-in for WP_Post.
 *
 * @package Liber
 */

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals -- Stand-in for a WordPress core class.

/**
 * A post with only the properties tests set.
 */
final class WP_Post {

	/**
	 * Post type.
	 *
	 * @var string
	 */
	public string $post_type = 'post';

	/**
	 * Sets the given properties.
	 *
	 * @param array<string, mixed> $props Property values.
	 */
	public function __construct( array $props = array() ) {
		foreach ( $props as $name => $value ) {
			$this->$name = $value;
		}
	}
}
