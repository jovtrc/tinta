<?php
/**
 * REST route for page locks.
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
 * `POST tinta/v1/docs/{id}/lock` takes a page's lock, or reports who holds it;
 * `DELETE` releases it. Core's post locks, fed per page to the editor's lock modal.
 */
final class Lock_Controller extends WP_REST_Controller {

	/**
	 * Sets the route.
	 */
	public function __construct() {
		$this->namespace = 'tinta/v1';
		$this->rest_base = 'docs/(?P<id>[\d]+)/lock';
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
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_item' ),
					'permission_callback' => array( $this, 'delete_item_permissions_check' ),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Only users who can edit the page take its lock.
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return true|WP_Error
	 */
	public function create_item_permissions_check( $request ) {
		$page_id = (int) $request['id'];

		if ( Post_Type::NAME !== get_post_type( $page_id ) ) {
			return new WP_Error( 'rest_post_invalid_id', __( 'Invalid page ID.', 'tinta' ), array( 'status' => 404 ) );
		}

		if ( ! current_user_can( 'edit_post', $page_id ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Sorry, you are not allowed to edit this page.', 'tinta' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Same rule as taking the lock.
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return true|WP_Error
	 */
	public function delete_item_permissions_check( $request ) {
		return $this->create_item_permissions_check( $request );
	}

	/**
	 * Takes the lock, unless someone else holds it.
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function create_item( $request ) {
		require_once ABSPATH . 'wp-admin/includes/post.php';

		$page_id = (int) $request['id'];
		$holder  = wp_check_post_lock( $page_id );
		$lock    = $holder ? false : wp_set_post_lock( $page_id );

		return rest_ensure_response(
			array(
				'isLocked'       => (bool) $holder,
				'user'           => $holder ? $this->user_details( $holder ) : null,
				'activePostLock' => $lock ? implode( ':', $lock ) : null,
				'postLockUtils'  => array(
					'nonce'       => wp_create_nonce( 'lock-post_' . $page_id ),
					'unlockNonce' => wp_create_nonce( 'update-post_' . $page_id ),
					'ajaxUrl'     => admin_url( 'admin-ajax.php' ),
				),
			)
		);
	}

	/**
	 * Releases the lock if the current user holds it.
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function delete_item( $request ) {
		$page_id  = (int) $request['id'];
		$lock     = explode( ':', (string) get_post_meta( $page_id, '_edit_lock', true ) );
		$released = isset( $lock[1] ) && get_current_user_id() === (int) $lock[1];

		if ( $released ) {
			delete_post_meta( $page_id, '_edit_lock' );
		}

		return rest_ensure_response( array( 'released' => $released ) );
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
				'title'      => 'tinta-page-lock',
				'type'       => 'object',
				'properties' => array(
					'isLocked'       => array(
						'description' => __( 'Whether someone else holds the lock.', 'tinta' ),
						'type'        => 'boolean',
					),
					'user'           => array(
						'description' => __( 'Who holds the lock.', 'tinta' ),
						'type'        => array( 'object', 'null' ),
					),
					'activePostLock' => array(
						'description' => __( 'The lock taken, as "time:user".', 'tinta' ),
						'type'        => array( 'string', 'null' ),
					),
					'postLockUtils'  => array(
						'description' => __( 'Nonces and URL the editor uses to refresh, take over and release the lock.', 'tinta' ),
						'type'        => 'object',
					),
					'released'       => array(
						'description' => __( 'Whether the lock was released.', 'tinta' ),
						'type'        => 'boolean',
					),
				),
			);
		}

		return $this->add_additional_fields_schema( $this->schema );
	}

	/**
	 * Name and avatar of the lock holder, in the shape the editor expects.
	 *
	 * @param int $user_id Lock holder.
	 * @return array{name: string, avatar: string}
	 */
	private function user_details( int $user_id ): array {
		$user = get_userdata( $user_id );

		return array(
			'name'   => $user ? $user->display_name : '',
			'avatar' => (string) get_avatar_url( $user_id, array( 'size' => 128 ) ),
		);
	}
}
