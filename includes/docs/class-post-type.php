<?php
/**
 * The page post type.
 *
 * @package Tinta
 */

namespace Tinta\Docs;

use WP_Error;

defined( 'ABSPATH' ) || exit;

/**
 * Registers `tinta_doc`, the workspace page, and its icon meta. Pages nest up
 * to 5 levels, under other pages in the tree only, never inside themselves:
 * REST says why it refuses a parent, and other writes keep the current one.
 */
final class Post_Type {

	public const NAME = 'tinta_doc';

	public const ICON_META = '_tinta_icon';

	public const MAX_DEPTH = 5;

	/**
	 * Sets the tree that subtree heights come from.
	 *
	 * @param Tree $tree Page tree.
	 */
	public function __construct( private Tree $tree ) {}

	/**
	 * Hooks the registration and the parent checks.
	 */
	public function register(): void {
		add_action( 'init', array( $this, 'register_post_type' ) );
		add_filter( 'rest_pre_insert_' . self::NAME, array( $this, 'check_parent' ) );
		add_filter( 'wp_insert_post_parent', array( $this, 'keep_valid_parent' ), 10, 3 );
	}

	/**
	 * Level of a page: 1 at the top.
	 *
	 * @param int $page_id Page ID.
	 */
	public static function level( int $page_id ): int {
		return count( get_post_ancestors( $page_id ) ) + 1;
	}

	/**
	 * Refuses a parent the page can't go under, with the reason.
	 *
	 * @param \stdClass|WP_Error $prepared_post Page about to be saved through REST.
	 * @return \stdClass|WP_Error
	 */
	public function check_parent( $prepared_post ) {
		$parent_id = is_wp_error( $prepared_post ) ? 0 : (int) ( $prepared_post->post_parent ?? 0 );

		if ( ! $parent_id ) {
			return $prepared_post;
		}

		return $this->parent_error( (int) ( $prepared_post->ID ?? 0 ), $parent_id ) ?? $prepared_post;
	}

	/**
	 * Keeps the current parent when any other write asks for one the page can't go under.
	 *
	 * @param int                  $parent_id   Parent asked for.
	 * @param int                  $post_id     Post ID; 0 for a new post.
	 * @param array<string, mixed> $new_postarr Post being saved.
	 */
	public function keep_valid_parent( int $parent_id, int $post_id, array $new_postarr ): int {
		if ( ! $parent_id || self::NAME !== ( $new_postarr['post_type'] ?? '' ) || ! $this->parent_error( $post_id, $parent_id ) ) {
			return $parent_id;
		}

		return $post_id ? (int) wp_get_post_parent_id( $post_id ) : 0;
	}

	/**
	 * Why a page can't go under a parent: the parent isn't a page in the tree,
	 * the page would be inside itself, or it would sit past the deepest level.
	 *
	 * @param int $page_id   Page ID; 0 for a new page.
	 * @param int $parent_id Parent ID.
	 */
	private function parent_error( int $page_id, int $parent_id ): ?WP_Error {
		if ( self::NAME !== get_post_type( $parent_id ) || 'private' !== get_post_status( $parent_id ) ) {
			return new WP_Error( 'tinta_invalid_parent', __( 'A page can only go under another page.', 'tinta' ), array( 'status' => 400 ) );
		}

		if ( $page_id && ( $page_id === $parent_id || in_array( $page_id, get_post_ancestors( $parent_id ), true ) ) ) {
			return new WP_Error( 'tinta_move_cycle', __( 'A page can’t go inside itself.', 'tinta' ), array( 'status' => 400 ) );
		}

		if ( self::level( $parent_id ) + $this->tree->height( $page_id ) > self::MAX_DEPTH ) {
			return new WP_Error(
				'tinta_too_deep',
				/* translators: %d: maximum number of levels. */
				sprintf( __( 'Pages can be nested up to %d levels.', 'tinta' ), self::MAX_DEPTH ),
				array( 'status' => 400 )
			);
		}

		return null;
	}

	/**
	 * Registers the post type and its meta.
	 */
	public function register_post_type(): void {
		// phpcs:ignore WordPress.NamingConventions.ValidPostTypeSlug.NotStringLiteral -- self::NAME is "tinta_doc", a valid slug.
		register_post_type(
			self::NAME,
			array(
				'labels'           => array(
					'name'          => __( 'Pages', 'tinta' ),
					'singular_name' => __( 'Page', 'tinta' ),
				),
				'public'           => false,
				'show_ui'          => true,
				'show_in_menu'     => false,
				'show_in_rest'     => true,
				'rest_base'        => 'tinta-docs',
				'hierarchical'     => true,
				'capability_type'  => array( 'tinta_doc', 'tinta_docs' ),
				'map_meta_cap'     => true,
				'supports'         => array(
					'title',
					'editor' => array( 'notes' => true ),
					'revisions',
					'author',
					'custom-fields',
					'page-attributes',
				),
				'rewrite'          => false,
				'query_var'        => false,
				'delete_with_user' => false,
			)
		);

		register_post_meta(
			self::NAME,
			self::ICON_META,
			array(
				'type'              => 'string',
				'single'            => true,
				'default'           => '',
				'show_in_rest'      => true,
				'sanitize_callback' => 'sanitize_text_field',
				'auth_callback'     => static fn( $allowed, $meta_key, $post_id ) => current_user_can( 'edit_post', $post_id ),
			)
		);
	}
}
