<?php
/**
 * REST route for the page tree.
 *
 * @package Tinta
 */

namespace Tinta\Rest;

use Tinta\Docs\Tree;
use WP_Error;
use WP_REST_Controller;
use WP_REST_Server;

defined( 'ABSPATH' ) || exit;

/**
 * `GET tinta/v1/tree`: every page's skeleton and the tree generation.
 */
final class Tree_Controller extends WP_REST_Controller {

	/**
	 * Sets the route and the tree it serves.
	 *
	 * @param Tree $tree Page tree.
	 */
	public function __construct( private Tree $tree ) {
		$this->namespace = 'tinta/v1';
		$this->rest_base = 'tree';
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
	 * Only workspace users read the tree.
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return true|WP_Error
	 */
	public function get_items_permissions_check( $request ) {
		if ( current_user_can( 'tinta_access' ) ) {
			return true;
		}

		return new WP_Error(
			'rest_forbidden',
			__( 'Sorry, you are not allowed to see this workspace.', 'tinta' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}

	/**
	 * Returns the tree.
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function get_items( $request ) {
		return rest_ensure_response(
			array(
				'generation' => $this->tree->generation(),
				'pages'      => $this->tree->pages(),
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
				'title'      => 'tinta-tree',
				'type'       => 'object',
				'properties' => array(
					'generation' => array(
						'description' => __( 'Bumped on every tree change.', 'tinta' ),
						'type'        => 'integer',
						'readonly'    => true,
					),
					'pages'      => array(
						'description' => __( 'Private pages in tree order.', 'tinta' ),
						'type'        => 'array',
						'readonly'    => true,
						'items'       => array(
							'type'       => 'object',
							'properties' => array(
								'id'     => array( 'type' => 'integer' ),
								'parent' => array( 'type' => 'integer' ),
								'order'  => array( 'type' => 'integer' ),
								'title'  => array( 'type' => 'string' ),
								'icon'   => array( 'type' => 'string' ),
							),
						),
					),
				),
			);
		}

		return $this->add_additional_fields_schema( $this->schema );
	}
}
