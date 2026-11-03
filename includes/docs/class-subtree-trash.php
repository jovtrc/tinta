<?php
/**
 * Trash for whole subtrees.
 *
 * @package Liber
 */

namespace Liber\Docs;

use WP_Post;

defined( 'ABSPATH' ) || exit;

/**
 * Trashing a page trashes its subpages; restoring it brings them back; deleting
 * it deletes them. Only administrators delete pages for good (core still empties
 * the trash after 30 days).
 */
final class Subtree_Trash {

	public const TRASHED_WITH_META = '_liber_trashed_with';

	private const BATCH = 100;

	/**
	 * Hooks trash, restore and delete.
	 */
	public function register(): void {
		add_action( 'trashed_post', array( $this, 'trash_subpages' ) );
		add_action( 'untrashed_post', array( $this, 'restore_subpages' ) );
		add_action( 'before_delete_post', array( $this, 'delete_subpages' ), 10, 2 );
		add_filter( 'pre_delete_post', array( $this, 'allow_delete' ), 10, 2 );
	}

	/**
	 * Trashes the subpages of a trashed page, marked with the page the user trashed.
	 *
	 * @param int $post_id Trashed post ID.
	 */
	public function trash_subpages( int $post_id ): void {
		if ( Post_Type::NAME !== get_post_type( $post_id ) ) {
			return;
		}

		$root_id = (int) get_post_meta( $post_id, self::TRASHED_WITH_META, true );
		$root_id = $root_id ? $root_id : $post_id;

		$done = array();

		do {
			$children = array_diff(
				$this->query_ids(
					array(
						'post_parent' => $post_id,
						'post_status' => 'private',
					)
				),
				$done
			);

			foreach ( $children as $child_id ) {
				update_post_meta( $child_id, self::TRASHED_WITH_META, $root_id );
				wp_trash_post( $child_id );
				$done[] = $child_id;
			}
		} while ( $children );
	}

	/**
	 * Restores the subpages trashed along with a page, which restores theirs in turn.
	 * Subpages trashed on their own earlier stay in the trash. A page whose parent
	 * is gone or still in the trash goes back to the top level.
	 *
	 * @param int $post_id Restored post ID.
	 */
	public function restore_subpages( int $post_id ): void {
		if ( Post_Type::NAME !== get_post_type( $post_id ) ) {
			return;
		}

		delete_post_meta( $post_id, self::TRASHED_WITH_META );
		$this->move_to_top_if_orphaned( $post_id );

		$done = array();

		do {
			$subpages = array_diff( $this->trashed_subpages( $post_id ), $done );

			foreach ( $subpages as $subpage_id ) {
				wp_untrash_post( $subpage_id );
				$done[] = $subpage_id;
			}
		} while ( $subpages );
	}

	/**
	 * Deletes the subpages trashed along with a page deleted for good, before core
	 * would move them up a level.
	 *
	 * @param int     $post_id Post ID.
	 * @param WP_Post $post    Post being deleted.
	 */
	public function delete_subpages( int $post_id, WP_Post $post ): void {
		if ( Post_Type::NAME !== $post->post_type ) {
			return;
		}

		$done = array();

		do {
			$subpages = array_diff( $this->trashed_subpages( $post_id ), $done );

			foreach ( $subpages as $subpage_id ) {
				wp_delete_post( $subpage_id, true );
				$done[] = $subpage_id;
			}
		} while ( $subpages );
	}

	/**
	 * Lets only administrators delete pages for good. Requests without a user
	 * (core's daily trash emptying, WP-CLI) may delete.
	 *
	 * @param bool|null $delete Short-circuit value; null to go on.
	 * @param WP_Post   $post   Post being deleted.
	 * @return bool|null
	 */
	public function allow_delete( ?bool $delete, WP_Post $post ): ?bool {
		$is_refused = Post_Type::NAME === $post->post_type
			&& is_user_logged_in()
			&& ! current_user_can( 'liber_manage' );

		return $is_refused ? false : $delete;
	}

	/**
	 * Moves a restored page to the top level when its parent isn't a private page.
	 *
	 * @param int $post_id Restored page ID.
	 */
	private function move_to_top_if_orphaned( int $post_id ): void {
		$parent_id = (int) wp_get_post_parent_id( $post_id );

		if ( $parent_id && 'private' !== get_post_status( $parent_id ) ) {
			wp_update_post(
				array(
					'ID'          => $post_id,
					'post_parent' => 0,
				)
			);
		}
	}

	/**
	 * Children of a page that were trashed along with an ancestor.
	 *
	 * @param int $post_id Page ID.
	 * @return int[]
	 */
	private function trashed_subpages( int $post_id ): array {
		return $this->query_ids(
			array(
				'post_parent' => $post_id,
				'post_status' => 'trash',
				'meta_key'    => self::TRASHED_WITH_META, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- Narrowed by post_parent; restore and delete only.
			)
		);
	}

	/**
	 * Up to 100 page IDs matching the query.
	 *
	 * @param array<string, mixed> $query Extra WP_Query arguments.
	 * @return int[]
	 */
	private function query_ids( array $query ): array {
		// phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.get_posts_get_posts -- suppress_filters is false below.
		return get_posts(
			array_merge(
				array(
					'post_type'        => Post_Type::NAME,
					'fields'           => 'ids',
					'posts_per_page'   => self::BATCH,
					'no_found_rows'    => true,
					'orderby'          => 'ID',
					'order'            => 'ASC',
					'suppress_filters' => false,
				),
				$query
			)
		);
	}
}
