<?php
/**
 * The page post type.
 *
 * @package Liber
 */

namespace Liber\Docs;

defined( 'ABSPATH' ) || exit;

/**
 * Registers `liber_doc`, the workspace page, and its icon meta.
 */
final class Post_Type {

	public const NAME = 'liber_doc';

	public const ICON_META = '_liber_icon';

	/**
	 * Hooks the registration.
	 */
	public function register(): void {
		add_action( 'init', array( $this, 'register_post_type' ) );
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
