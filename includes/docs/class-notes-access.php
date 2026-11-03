<?php
/**
 * Notes for page editors.
 *
 * @package Tinta
 */

namespace Tinta\Docs;

use WP_REST_Request;

defined( 'ABSPATH' ) || exit;

/**
 * Lets people who can edit a page list its notes. Core's comments route also
 * asks for `edit_posts` to filter by note type and status, which Members don't
 * have (they don't write blog posts), so Tinta grants it for that one request.
 */
final class Notes_Access {

	/**
	 * Hooks around REST callbacks.
	 */
	public function register(): void {
		add_filter( 'rest_request_before_callbacks', array( $this, 'open' ), 10, 3 );
		add_filter( 'rest_request_after_callbacks', array( $this, 'close' ) );
	}

	/**
	 * Grants `edit_posts` while a request lists notes of pages the user can edit.
	 *
	 * @param mixed           $response Response so far.
	 * @param array<mixed>    $handler  Route handler.
	 * @param WP_REST_Request $request  Request.
	 * @return mixed
	 */
	public function open( $response, array $handler, WP_REST_Request $request ) {
		if ( $this->lists_page_notes( $request ) ) {
			add_filter( 'user_has_cap', array( $this, 'grant' ), 10, 4 );
		}

		return $response;
	}

	/**
	 * Takes the grant back once the request is answered.
	 *
	 * @param mixed $response Response.
	 * @return mixed
	 */
	public function close( $response ) {
		remove_filter( 'user_has_cap', array( $this, 'grant' ) );

		return $response;
	}

	/**
	 * Adds `edit_posts` for the person making the request, nobody else.
	 *
	 * @param array<string, bool> $caps The user's capabilities.
	 * @param string[]            $cap  Capabilities checked.
	 * @param mixed[]             $args Capability, user ID, and more.
	 * @param \WP_User            $user User checked.
	 * @return array<string, bool>
	 */
	public function grant( array $caps, array $cap, array $args, \WP_User $user ): array {
		if ( get_current_user_id() === $user->ID ) {
			$caps['edit_posts'] = true;
		}

		return $caps;
	}

	/**
	 * Whether the request lists notes, only of pages the user can edit.
	 *
	 * @param WP_REST_Request $request Request.
	 */
	private function lists_page_notes( WP_REST_Request $request ): bool {
		if ( 'GET' !== $request->get_method() || '/wp/v2/comments' !== $request->get_route() || 'note' !== $request['type'] || empty( $request['post'] ) ) {
			return false;
		}

		foreach ( (array) $request['post'] as $post_id ) {
			if ( Post_Type::NAME !== get_post_type( (int) $post_id ) || ! current_user_can( 'edit_post', (int) $post_id ) ) {
				return false;
			}
		}

		return true;
	}
}
