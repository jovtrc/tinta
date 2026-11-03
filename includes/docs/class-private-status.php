<?php
/**
 * Keeps every page private.
 *
 * @package Tinta
 */

namespace Tinta\Docs;

defined( 'ABSPATH' ) || exit;

/**
 * Every page is `private`, so WordPress itself hides pages from anyone without
 * `read_private_tinta_docs`: logged-out visitors, the REST API, queries, feeds and search.
 */
final class Private_Status {

	/**
	 * Statuses left as they are; any other becomes `private`.
	 */
	private const KEPT_STATUSES = array( 'private', 'trash', 'auto-draft' );

	/**
	 * Hooks the filters.
	 */
	public function register(): void {
		add_filter( 'wp_insert_post_data', array( $this, 'force_private' ) );
		add_filter( 'private_title_format', array( $this, 'drop_title_prefix' ), 10, 2 );
		add_filter( 'wp_untrash_post_status', array( $this, 'restore_as_private' ), 10, 2 );
	}

	/**
	 * Saves pages as `private`, whatever status was asked for.
	 *
	 * @param array<string, mixed> $data Post data about to be saved.
	 * @return array<string, mixed>
	 */
	public function force_private( array $data ): array {
		if ( Post_Type::NAME === $data['post_type'] && ! in_array( $data['post_status'], self::KEPT_STATUSES, true ) ) {
			$data['post_status'] = 'private';
		}

		return $data;
	}

	/**
	 * Drops the "Private:" prefix from page titles.
	 *
	 * @param string   $format Title format, "Private: %s" by default.
	 * @param \WP_Post $post   Post whose title is shown.
	 * @return string
	 */
	public function drop_title_prefix( string $format, \WP_Post $post ): string {
		return Post_Type::NAME === $post->post_type ? '%s' : $format;
	}

	/**
	 * Restores pages from the trash as `private` (core restores to `draft`).
	 *
	 * @param string $status  Status core picked for the restored post.
	 * @param int    $post_id Restored post ID.
	 * @return string
	 */
	public function restore_as_private( string $status, int $post_id ): string {
		return Post_Type::NAME === get_post_type( $post_id ) ? 'private' : $status;
	}
}
