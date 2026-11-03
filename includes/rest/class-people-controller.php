<?php
/**
 * REST route for the workspace's people.
 *
 * @package Liber
 */

namespace Liber\Rest;

use WP_Error;
use WP_REST_Controller;
use WP_REST_Server;

defined( 'ABSPATH' ) || exit;

/**
 * `GET liber/v1/people`: who can edit pages, for @mentions in notes. Core's
 * user list only shows people without `list_users` the authors of published
 * posts, and every page is private.
 */
final class People_Controller extends WP_REST_Controller {

	private const MAX = 200;

	/**
	 * Sets the route.
	 */
	public function __construct() {
		$this->namespace = 'liber/v1';
		$this->rest_base = 'people';
	}

	/**
	 * Hooks route registration.
	 */
	public function register(): void {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Registers the route.
	 */
	public function register_routes(): void {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Only people who can edit pages (and so read notes) see the list.
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return true|WP_Error
	 */
	public function get_items_permissions_check( $request ) {
		if ( current_user_can( 'edit_liber_docs' ) ) {
			return true;
		}

		return new WP_Error(
			'rest_forbidden',
			__( 'Sorry, you are not allowed to see who is in this workspace.', 'liber' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}

	/**
	 * People whose role can edit pages, by name; nobody when no role can (an
	 * empty role list would match everyone).
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function get_items( $request ) {
		$roles = $this->editing_roles();

		if ( ! $roles ) {
			return rest_ensure_response( array() );
		}

		$users = get_users(
			array(
				'role__in' => $roles,
				'orderby'  => 'display_name',
				'number'   => self::MAX,
				'fields'   => array( 'ID', 'display_name' ),
			)
		);

		return rest_ensure_response(
			array_map(
				static fn( object $user ): array => array(
					'id'     => (int) $user->ID,
					'name'   => (string) $user->display_name,
					'avatar' => (string) get_avatar_url( (int) $user->ID, array( 'size' => 48 ) ),
				),
				$users
			)
		);
	}

	/**
	 * Response schema: a list of people.
	 *
	 * @return array<string, mixed>
	 */
	public function get_item_schema() {
		if ( ! $this->schema ) {
			$this->schema = array(
				'$schema'    => 'http://json-schema.org/draft-04/schema#',
				'title'      => 'liber-person',
				'type'       => 'object',
				'properties' => array(
					'id'     => array( 'type' => 'integer' ),
					'name'   => array( 'type' => 'string' ),
					'avatar' => array(
						'type'   => 'string',
						'format' => 'uri',
					),
				),
			);
		}

		return $this->add_additional_fields_schema( $this->schema );
	}

	/**
	 * Roles on this site that can edit pages.
	 *
	 * @return string[]
	 */
	private function editing_roles(): array {
		return array_keys(
			array_filter(
				wp_roles()->roles,
				static fn( array $role ): bool => ! empty( $role['capabilities']['edit_liber_docs'] )
			)
		);
	}
}
