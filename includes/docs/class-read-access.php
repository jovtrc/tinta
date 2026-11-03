<?php
/**
 * Reading a page takes a Liber role.
 *
 * @package Liber
 */

namespace Liber\Docs;

defined( 'ABSPATH' ) || exit;

/**
 * Core lets authors read their own private posts with just `read`. For pages
 * that would let people keep reading what they wrote after losing their Liber
 * role, or read a page someone made them the author of, and get its note
 * emails. Reading a page, or one of its revisions, also takes
 * `read_private_liber_docs`.
 */
final class Read_Access {

	/**
	 * Hooks the capability check.
	 */
	public function register(): void {
		add_filter( 'map_meta_cap', array( $this, 'require_role' ), 10, 4 );
	}

	/**
	 * Adds `read_private_liber_docs` to reading a page.
	 *
	 * @param string[] $caps    Capabilities core requires.
	 * @param string   $cap     Capability checked.
	 * @param int      $user_id User ID.
	 * @param mixed[]  $args    The post ID, first.
	 * @return string[]
	 */
	public function require_role( array $caps, string $cap, int $user_id, array $args ): array {
		if ( ! in_array( $cap, array( 'read_post', 'read_page' ), true ) || empty( $args[0] ) ) {
			return $caps;
		}

		$post = get_post( (int) $args[0] );

		if ( $post && 'revision' === $post->post_type ) {
			$post = get_post( $post->post_parent );
		}

		if ( $post && Post_Type::NAME === $post->post_type ) {
			$caps[] = 'read_private_liber_docs';
		}

		return $caps;
	}
}
