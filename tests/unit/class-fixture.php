<?php
/**
 * State behind the WordPress stubs.
 *
 * @package Liber
 */

namespace Liber\Tests\Unit;

/**
 * What the stubbed WordPress functions return. Reset before each test.
 */
final class Fixture {

	/**
	 * Post type of each post ID, for get_post_type().
	 *
	 * @var array<int, string>
	 */
	public static array $post_types = array();

	/**
	 * Clears all state.
	 */
	public static function reset(): void {
		self::$post_types = array();
	}
}
