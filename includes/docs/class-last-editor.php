<?php
/**
 * Who last edited a page.
 *
 * @package Tinta
 */

namespace Tinta\Docs;

use WP_Post;

defined( 'ABSPATH' ) || exit;

/**
 * Records the last editor (title, content or icon changes; not moves) in core's
 * `_edit_last` meta, which only wp-admin's classic screens set, and exposes it
 * as the `last_editor` REST field.
 */
final class Last_Editor {

	public const FIELD = 'last_editor';

	/**
	 * Hooks the recording and the REST field.
	 */
	public function register(): void {
		add_action( 'post_updated', array( $this, 'record' ), 10, 3 );
		add_action( 'added_post_meta', array( $this, 'record_icon' ), 10, 3 );
		add_action( 'updated_post_meta', array( $this, 'record_icon' ), 10, 3 );
		add_action( 'rest_api_init', array( $this, 'register_field' ) );
	}

	/**
	 * Records the current user when a page's title or content changes.
	 *
	 * @param int     $post_id Post ID.
	 * @param WP_Post $after   Post after the update.
	 * @param WP_Post $before  Post before the update.
	 */
	public function record( int $post_id, WP_Post $after, WP_Post $before ): void {
		$is_edit = $after->post_content !== $before->post_content || $after->post_title !== $before->post_title;

		if ( Post_Type::NAME === $after->post_type && $is_edit ) {
			$this->save( $post_id );
		}
	}

	/**
	 * Records the current user when a page's icon changes.
	 *
	 * @param int    $meta_id  Meta ID.
	 * @param int    $post_id  Post ID.
	 * @param string $meta_key Meta key.
	 */
	public function record_icon( int $meta_id, int $post_id, string $meta_key ): void {
		if ( Post_Type::ICON_META === $meta_key ) {
			$this->save( $post_id );
		}
	}

	/**
	 * Saves the current user as the last editor, when there is one.
	 *
	 * @param int $post_id Page ID.
	 */
	private function save( int $post_id ): void {
		if ( get_current_user_id() ) {
			update_post_meta( $post_id, '_edit_last', get_current_user_id() );
		}
	}

	/**
	 * Registers `last_editor` on pages.
	 */
	public function register_field(): void {
		register_rest_field(
			Post_Type::NAME,
			self::FIELD,
			array(
				'get_callback' => array( $this, 'get_field' ),
				'schema'       => array(
					'description' => __( 'Who last edited the page: the author until someone edits it.', 'tinta' ),
					'type'        => array( 'object', 'null' ),
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
					'properties'  => array(
						'id'     => array( 'type' => 'integer' ),
						'name'   => array( 'type' => 'string' ),
						'avatar' => array(
							'type'   => 'string',
							'format' => 'uri',
						),
					),
				),
			)
		);
	}

	/**
	 * The last editor's ID, display name and avatar.
	 *
	 * @param array<string, mixed> $post Page as prepared for the response.
	 * @return array{id: int, name: string, avatar: string}|null
	 */
	public function get_field( array $post ): ?array {
		$user_id = (int) get_post_meta( $post['id'], '_edit_last', true );
		$user    = get_userdata( $user_id ? $user_id : (int) get_post_field( 'post_author', $post['id'] ) );

		return $user ? array(
			'id'     => $user->ID,
			'name'   => $user->display_name,
			'avatar' => (string) get_avatar_url( $user->ID, array( 'size' => 40 ) ),
		) : null;
	}
}
