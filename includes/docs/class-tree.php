<?php
/**
 * The page tree.
 *
 * @package Tinta
 */

namespace Tinta\Docs;

use Tinta\Cache\Cache;
use WP_Post;

defined( 'ABSPATH' ) || exit;

/**
 * Every page's id, parent, order, title and icon, cached as one entry.
 * Any change to those fields clears the cache and bumps the tree generation.
 */
final class Tree {

	public const CACHE_KEY = 'tinta_tree';

	public const GENERATION_OPTION = 'tinta_tree_generation';

	/**
	 * Post fields the tree shows.
	 */
	private const TREE_FIELDS = array( 'post_title', 'post_parent', 'menu_order', 'post_status' );

	/**
	 * Sets the cache the tree is stored in.
	 *
	 * @param Cache $cache Shared cache.
	 */
	public function __construct( private Cache $cache ) {}

	/**
	 * Hooks cache invalidation.
	 */
	public function register(): void {
		add_action( 'wp_insert_post', array( $this, 'on_insert' ), 10, 3 );
		add_action( 'post_updated', array( $this, 'on_update' ), 10, 3 );
		add_action( 'deleted_post', array( $this, 'on_delete' ), 10, 2 );
		add_action( 'added_post_meta', array( $this, 'on_meta_change' ), 10, 3 );
		add_action( 'updated_post_meta', array( $this, 'on_meta_change' ), 10, 3 );
		add_action( 'deleted_post_meta', array( $this, 'on_meta_change' ), 10, 3 );
	}

	/**
	 * Private pages in tree order.
	 *
	 * @return list<array{id: int, parent: int, order: int, title: string, icon: string}>
	 */
	public function pages(): array {
		$pages = $this->cache->get( self::CACHE_KEY );

		if ( ! is_array( $pages ) ) {
			$pages = $this->query_pages();
			$this->cache->set( self::CACHE_KEY, $pages );
		}

		return $pages;
	}

	/**
	 * Number bumped on every tree change, so clients know when to refetch.
	 */
	public function generation(): int {
		return (int) get_option( self::GENERATION_OPTION, 0 );
	}

	/**
	 * Number of levels a page's subtree spans, 1 for a page without subpages.
	 *
	 * @param int $page_id Page ID; 0 counts as a page without subpages.
	 */
	public function height( int $page_id ): int {
		return $page_id ? self::height_in( $page_id, array_column( $this->pages(), 'parent', 'id' ), array() ) : 1;
	}

	/**
	 * Height of a subtree, stopping at pages already counted.
	 *
	 * @param int              $page_id Page ID.
	 * @param array<int, int>  $parents Each page's parent, by ID.
	 * @param array<int, true> $seen    Pages already counted.
	 */
	private static function height_in( int $page_id, array $parents, array $seen ): int {
		$height           = 1;
		$seen[ $page_id ] = true;

		foreach ( $parents as $id => $parent ) {
			if ( $parent === $page_id && ! isset( $seen[ $id ] ) ) {
				$height = max( $height, 1 + self::height_in( $id, $parents, $seen ) );
			}
		}

		return $height;
	}

	/**
	 * The first top-level page, if any.
	 */
	public function first_page_id(): int {
		foreach ( $this->pages() as $page ) {
			if ( 0 === $page['parent'] ) {
				return $page['id'];
			}
		}

		return 0;
	}

	/**
	 * Clears the cached tree and bumps the generation.
	 */
	public function flush(): void {
		$this->cache->delete( self::CACHE_KEY );
		update_option( self::GENERATION_OPTION, $this->generation() + 1, true );
	}

	/**
	 * Flushes when a page is created.
	 *
	 * @param int     $post_id Post ID.
	 * @param WP_Post $post    Post.
	 * @param bool    $update  Whether this is an update.
	 */
	public function on_insert( int $post_id, WP_Post $post, bool $update ): void {
		if ( ! $update && Post_Type::NAME === $post->post_type ) {
			$this->flush();
		}
	}

	/**
	 * Flushes when a page's title, parent, order or status changes. Content-only saves don't.
	 *
	 * @param int     $post_id Post ID.
	 * @param WP_Post $after   Post after the update.
	 * @param WP_Post $before  Post before the update.
	 */
	public function on_update( int $post_id, WP_Post $after, WP_Post $before ): void {
		if ( Post_Type::NAME !== $after->post_type ) {
			return;
		}

		foreach ( self::TREE_FIELDS as $field ) {
			if ( $after->$field !== $before->$field ) {
				$this->flush();
				return;
			}
		}
	}

	/**
	 * Flushes when a page is deleted.
	 *
	 * @param int     $post_id Post ID.
	 * @param WP_Post $post    Deleted post.
	 */
	public function on_delete( int $post_id, WP_Post $post ): void {
		if ( Post_Type::NAME === $post->post_type ) {
			$this->flush();
		}
	}

	/**
	 * Flushes when a page icon changes.
	 *
	 * @param int|int[] $meta_id  Meta ID, or IDs when deleting.
	 * @param int       $post_id  Post ID.
	 * @param string    $meta_key Meta key.
	 */
	public function on_meta_change( int|array $meta_id, int $post_id, string $meta_key ): void {
		if ( Post_Type::ICON_META === $meta_key ) {
			$this->flush();
		}
	}

	/**
	 * Reads the tree in one query: titles and icons, without page content.
	 *
	 * @return list<array{id: int, parent: int, order: int, title: string, icon: string}>
	 */
	private function query_pages(): array {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Cached by pages(); WP_Query would load every page's content.
		$rows = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT p.ID, p.post_parent, p.menu_order, p.post_title, m.meta_value AS icon
				FROM {$wpdb->posts} p
				LEFT JOIN {$wpdb->postmeta} m ON m.post_id = p.ID AND m.meta_key = %s
				WHERE p.post_type = %s AND p.post_status = 'private'
				ORDER BY p.menu_order, p.post_title, p.ID",
				Post_Type::ICON_META,
				Post_Type::NAME
			)
		);

		return array_map(
			static fn( object $row ): array => array(
				'id'     => (int) $row->ID,
				'parent' => (int) $row->post_parent,
				'order'  => (int) $row->menu_order,
				'title'  => (string) $row->post_title,
				'icon'   => (string) $row->icon,
			),
			$rows
		);
	}
}
