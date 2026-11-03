<?php
/**
 * Shared cache.
 *
 * @package Tinta
 */

namespace Tinta\Cache;

defined( 'ABSPATH' ) || exit;

/**
 * Stores values in the persistent object cache, or in transients when the site has none.
 */
final class Cache {

	private const GROUP = 'tinta';

	/**
	 * Returns a cached value, or null on a miss.
	 *
	 * @param string $key Cache key.
	 * @return mixed
	 */
	public function get( string $key ): mixed {
		if ( wp_using_ext_object_cache() ) {
			$found = false;
			$value = wp_cache_get( $key, self::GROUP, false, $found );

			return $found ? $value : null;
		}

		$stored = get_transient( $key );

		return is_array( $stored ) ? $stored['value'] : null;
	}

	/**
	 * Stores a value. Expiry is only a safety net: writes delete what they change.
	 *
	 * @param string $key   Cache key.
	 * @param mixed  $value Value to store.
	 */
	public function set( string $key, mixed $value ): void {
		if ( wp_using_ext_object_cache() ) {
			wp_cache_set( $key, $value, self::GROUP, DAY_IN_SECONDS );
			return;
		}

		set_transient( $key, array( 'value' => $value ), DAY_IN_SECONDS );
	}

	/**
	 * Deletes a value.
	 *
	 * @param string $key Cache key.
	 */
	public function delete( string $key ): void {
		if ( wp_using_ext_object_cache() ) {
			wp_cache_delete( $key, self::GROUP );
			return;
		}

		delete_transient( $key );
	}
}
