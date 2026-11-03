<?php
/**
 * The page post type.
 *
 * @package Liber
 */

namespace Liber\Docs;

use WP_Error;

defined( 'ABSPATH' ) || exit;

/**
 * Registers `liber_doc`, the workspace page, and its icon meta; pages nest up to 5 levels.
 */
final class Post_Type {

	public const NAME = 'liber_doc';

	public const ICON_META = '_liber_icon';

	public const MAX_DEPTH = 5;

	/**
	 * Hooks the registration and the parent check.
	 */
	public function register(): void {
		add_action( 'init', array( $this, 'register_post_type' ) );
		add_filter( 'rest_pre_insert_' . self::NAME, array( $this, 'check_parent' ) );
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
	 * Refuses a parent that isn't a page, or one at the deepest level.
	 *
	 * @param \stdClass|WP_Error $prepared_post Page about to be saved through REST.
	 * @return \stdClass|WP_Error
	 */
	public function check_parent( $prepared_post ) {
		$parent_id = is_wp_error( $prepared_post ) ? 0 : (int) ( $prepared_post->post_parent ?? 0 );

		if ( ! $parent_id ) {
			return $prepared_post;
		}

		if ( self::NAME !== get_post_type( $parent_id ) ) {
			return new WP_Error( 'liber_invalid_parent', __( 'A page can only go under another page.', 'liber' ), array( 'status' => 400 ) );
		}

		if ( self::level( $parent_id ) >= self::MAX_DEPTH ) {
			return new WP_Error(
				'liber_too_deep',
				/* translators: %d: maximum number of levels. */
				sprintf( __( 'Pages can be nested up to %d levels.', 'liber' ), self::MAX_DEPTH ),
				array( 'status' => 400 )
			);
		}

		return $prepared_post;
	}

	/**
	 * Registers the post type and its meta.
	 */
	public function register_post_type(): void {
		// phpcs:ignore WordPress.NamingConventions.ValidPostTypeSlug.NotStringLiteral -- self::NAME is "liber_doc", a valid slug.
		register_post_type(
			self::NAME,
			array(
				'labels'           => array(
					'name'          => __( 'Pages', 'liber' ),
					'singular_name' => __( 'Page', 'liber' ),
				),
				'public'           => false,
				'show_ui'          => true,
				'show_in_menu'     => false,
				'show_in_rest'     => true,
				'rest_base'        => 'liber-docs',
				'hierarchical'     => true,
				'capability_type'  => array( 'liber_doc', 'liber_docs' ),
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
