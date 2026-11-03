<?php
/**
 * REST route for restoring pages from the trash.
 *
 * @package Tinta
 */

namespace Tinta\Rest;

use Tinta\Docs\Post_Type;
use WP_Error;
use WP_REST_Controller;
use WP_REST_Server;

defined( 'ABSPATH' ) || exit;

/**
 * `POST tinta/v1/docs/{id}/restore`: core's `wp_untrash_post()`, which a status
 * update through `wp/v2` skips, so the page comes back with its subpages.
 */
final class Restore_Controller extends WP_REST_Controller {

	/**
	 * Sets the route.
	 */
	public function __construct() {
		$this->namespace = 'tinta/v1';
		$this->rest_base = 'docs/(?P<id>[\d]+)/restore';
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
				'args'   => array(
					'id' => array(
						'description' => __( 'Page ID.', 'tinta' ),
						'type'        => 'integer',
					),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Only trashed pages, by users who may trash them.
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return true|WP_Error
	 */
	public function create_item_permissions_check( $request ) {
		$page_id = (int) $request['id'];

		if ( Post_Type::NAME !== get_post_type( $page_id ) || 'trash' !== get_post_status( $page_id ) ) {
			return new WP_Error( 'rest_post_invalid_id', __( 'No page with this ID is in the trash.', 'tinta' ), array( 'status' => 404 ) );
		}

		if ( ! current_user_can( 'delete_post', $page_id ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Sorry, you are not allowed to restore this page.', 'tinta' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Restores the page.
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function create_item( $request ) {
		$page_id = (int) $request['id'];

		if ( ! wp_untrash_post( $page_id ) ) {
			return new WP_Error( 'tinta_restore_failed', __( 'The page could not be restored.', 'tinta' ), array( 'status' => 500 ) );
		}

		return rest_ensure_response(
			array(
				'id'     => $page_id,
				'status' => get_post_status( $page_id ),
				'parent' => (int) wp_get_post_parent_id( $page_id ),
			)
		);
	}

	/**
	 * Response schema.
	 *
	 * @return array<string, mixed>
	 */
	public function get_item_schema() {
		if ( ! $this->schema ) {
			$this->schema = array(
				'$schema'    => 'http://json-schema.org/draft-04/schema#',
				'title'      => 'tinta-restored-page',
				'type'       => 'object',
				'properties' => array(
					'id'     => array( 'type' => 'integer' ),
					'status' => array( 'type' => 'string' ),
					'parent' => array( 'type' => 'integer' ),
				),
			);
		}

		return $this->add_additional_fields_schema( $this->schema );
	}
}
