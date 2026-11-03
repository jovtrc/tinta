<?php
/**
 * REST route for moving pages.
 *
 * @package Liber
 */

namespace Liber\Rest;

use Liber\Docs\Mover;
use Liber\Docs\Post_Type;
use WP_Error;
use WP_REST_Controller;
use WP_REST_Server;

defined( 'ABSPATH' ) || exit;

/**
 * `POST liber/v1/docs/{id}/move`: a new parent and a position among its children.
 */
final class Move_Controller extends WP_REST_Controller {

	/**
	 * Sets the route and the mover.
	 *
	 * @param Mover $mover Moves pages.
	 */
	public function __construct( private Mover $mover ) {
		$this->namespace = 'liber/v1';
		$this->rest_base = 'docs/(?P<id>[\d]+)/move';
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
						'description' => __( 'Page ID.', 'liber' ),
						'type'        => 'integer',
					),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
					'args'                => array(
						'parent'   => array(
							'description' => __( 'New parent page ID, or 0 for the top level.', 'liber' ),
							'type'        => 'integer',
							'minimum'     => 0,
							'required'    => true,
						),
						'position' => array(
							'description' => __( 'Position among the new siblings, from 0.', 'liber' ),
							'type'        => 'integer',
							'minimum'     => 0,
							'required'    => true,
						),
					),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * The user must be able to edit the page and the new parent.
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return true|WP_Error
	 */
	public function create_item_permissions_check( $request ) {
		$page_id   = (int) $request['id'];
		$parent_id = (int) $request['parent'];

		if ( Post_Type::NAME !== get_post_type( $page_id ) ) {
			return new WP_Error( 'rest_post_invalid_id', __( 'Invalid page ID.', 'liber' ), array( 'status' => 404 ) );
		}

		$can_move = current_user_can( 'edit_post', $page_id )
			&& ( $parent_id ? current_user_can( 'edit_post', $parent_id ) : current_user_can( 'edit_liber_docs' ) );

		if ( ! $can_move ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Sorry, you are not allowed to move this page there.', 'liber' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Moves the page.
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function create_item( $request ) {
		$page_id = (int) $request['id'];
		$moved   = $this->mover->move( $page_id, (int) $request['parent'], (int) $request['position'] );

		if ( is_wp_error( $moved ) ) {
			return $moved;
		}

		return rest_ensure_response(
			array(
				'id'     => $page_id,
				'parent' => (int) wp_get_post_parent_id( $page_id ),
				'order'  => (int) get_post_field( 'menu_order', $page_id ),
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
				'title'      => 'liber-moved-page',
				'type'       => 'object',
				'properties' => array(
					'id'     => array( 'type' => 'integer' ),
					'parent' => array( 'type' => 'integer' ),
					'order'  => array( 'type' => 'integer' ),
				),
			);
		}

		return $this->add_additional_fields_schema( $this->schema );
	}
}
