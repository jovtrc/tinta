<?php
/**
 * Moving pages in the tree.
 *
 * @package Liber
 */

namespace Liber\Docs;

use WP_Error;

defined( 'ABSPATH' ) || exit;

/**
 * Moves a page under a new parent, at a position among its siblings, and
 * renumbers the siblings in one go. Only `post_parent` and `menu_order`
 * change: moving a page isn't an edit, so its modified date stays.
 */
final class Mover {

	/**
	 * Sets the tree the move is checked against.
	 *
	 * @param Tree $tree Page tree.
	 */
	public function __construct( private Tree $tree ) {}

	/**
	 * Moves the page; refuses cycles and moves past the deepest level.
	 *
	 * @param int $page_id   Page to move.
	 * @param int $parent_id New parent, or 0 for the top level.
	 * @param int $position  Position among the new siblings, from 0.
	 * @return true|WP_Error
	 */
	public function move( int $page_id, int $parent_id, int $position ) {
		$pages = array_column( $this->tree->pages(), null, 'id' );

		if ( ! isset( $pages[ $page_id ] ) || ( $parent_id && ! isset( $pages[ $parent_id ] ) ) ) {
			return new WP_Error( 'rest_post_invalid_id', __( 'Invalid page or parent.', 'liber' ), array( 'status' => 404 ) );
		}

		$subtree = $this->subtree( $page_id, $pages );

		if ( in_array( $parent_id, $subtree, true ) || $this->is_inside( $parent_id, $page_id ) ) {
			return new WP_Error( 'liber_move_cycle', __( 'A page can’t go inside itself.', 'liber' ), array( 'status' => 400 ) );
		}

		if ( $this->level( $parent_id, $pages ) + $this->tree->height( $page_id ) > Post_Type::MAX_DEPTH ) {
			return new WP_Error(
				'liber_too_deep',
				/* translators: %d: maximum number of levels. */
				sprintf( __( 'Pages can be nested up to %d levels.', 'liber' ), Post_Type::MAX_DEPTH ),
				array( 'status' => 400 )
			);
		}

		$siblings = array_values(
			array_filter(
				array_keys( $pages ),
				static fn( int $id ): bool => $pages[ $id ]['parent'] === $parent_id && $id !== $page_id
			)
		);
		array_splice( $siblings, max( 0, min( $position, count( $siblings ) ) ), 0, array( $page_id ) );

		$this->save( $page_id, $parent_id, $siblings, $pages );

		return true;
	}

	/**
	 * Writes the new parent and sibling order, then clears caches.
	 *
	 * @param int                                        $page_id   Moved page.
	 * @param int                                        $parent_id New parent.
	 * @param int[]                                      $siblings  New siblings, in order, moved page included.
	 * @param array<int, array{parent: int, order: int}> $pages     Tree pages by ID.
	 */
	private function save( int $page_id, int $parent_id, array $siblings, array $pages ): void {
		global $wpdb;

		foreach ( $siblings as $order => $id ) {
			$fields = $id === $page_id ? array( 'post_parent' => $parent_id ) : array();

			if ( $id === $page_id || $pages[ $id ]['order'] !== $order ) {
				// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Order only; wp_update_post() would bump the modified date. Caches are cleaned below.
				$wpdb->update( $wpdb->posts, $fields + array( 'menu_order' => $order ), array( 'ID' => $id ) );
				clean_post_cache( $id );
			}
		}

		$this->tree->flush();
	}

	/**
	 * Whether a page sits inside another, read fresh rather than from the cached
	 * tree, so two moves at once can't put two pages inside each other.
	 *
	 * @param int $page_id     Page that may be inside.
	 * @param int $ancestor_id Page it may be inside.
	 */
	private function is_inside( int $page_id, int $ancestor_id ): bool {
		if ( ! $page_id ) {
			return false;
		}

		clean_post_cache( $page_id );

		return in_array( $ancestor_id, get_post_ancestors( $page_id ), true );
	}

	/**
	 * A page and all its descendants.
	 *
	 * @param int                            $page_id Page ID.
	 * @param array<int, array{parent: int}> $pages   Tree pages by ID.
	 * @return int[]
	 */
	private function subtree( int $page_id, array $pages ): array {
		$ids   = array();
		$queue = array( $page_id );

		while ( $queue ) {
			$id = array_shift( $queue );

			if ( in_array( $id, $ids, true ) ) {
				continue;
			}

			$ids[] = $id;

			foreach ( $pages as $child_id => $page ) {
				if ( $page['parent'] === $id ) {
					$queue[] = $child_id;
				}
			}
		}

		return $ids;
	}

	/**
	 * Level of a page, 1 at the top; 0 for the top level itself.
	 *
	 * @param int                            $page_id Page ID, or 0.
	 * @param array<int, array{parent: int}> $pages   Tree pages by ID.
	 */
	private function level( int $page_id, array $pages ): int {
		$seen = array();

		for ( $id = $page_id; $id && isset( $pages[ $id ] ) && ! isset( $seen[ $id ] ); $id = $pages[ $id ]['parent'] ) {
			$seen[ $id ] = true;
		}

		return count( $seen );
	}
}
