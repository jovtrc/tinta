<?php
/**
 * REST route for the workspace's people.
 *
 * @package Tinta
 */

namespace Tinta\Rest;

use Tinta\Roles\Roles;
use WP_Error;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

defined( 'ABSPATH' ) || exit;

/**
 * `GET tinta/v1/people`: who can edit pages, for @mentions in notes. Core's
 * user list only shows people without `list_users` the authors of published
 * posts, and every page is private.
 *
 * `POST tinta/v1/people`: invites someone as a Member or Viewer, the way
 * core's Users → Add New does, which core's REST route can't (it sends no
 * email, and multisite site admins can't create users through it): a new
 * account with core's new-user email on a single site, core's signup and
 * activation email on multisite.
 */
final class People_Controller extends WP_REST_Controller {

	private const MAX = 200;

	/**
	 * Sets the route.
	 */
	public function __construct() {
		$this->namespace = 'tinta/v1';
		$this->rest_base = 'people';
	}

	/**
	 * Hooks route registration.
	 */
	public function register(): void {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
		add_action( 'wpmu_activate_user', array( $this, 'name_activated_user' ), 10, 3 );
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
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
					'args'                => array(
						'name'  => array(
							'type'              => 'string',
							'required'          => true,
							'minLength'         => 1,
							'sanitize_callback' => 'sanitize_text_field',
						),
						'email' => array(
							'type'     => 'string',
							'format'   => 'email',
							'required' => true,
						),
						'role'  => array(
							'type'     => 'string',
							'enum'     => array( Roles::MEMBER, Roles::VIEWER ),
							'required' => true,
						),
					),
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
		if ( current_user_can( 'edit_tinta_docs' ) ) {
			return true;
		}

		return new WP_Error(
			'rest_forbidden',
			__( 'Sorry, you are not allowed to see who is in this workspace.', 'tinta' ),
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
	 * Workspace administrators who may add users to the site invite people;
	 * core's `create_users` check covers multisite's "add new users" switch.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return true|WP_Error
	 */
	public function create_item_permissions_check( $request ) {
		if ( current_user_can( 'tinta_manage' ) && current_user_can( 'create_users' ) ) {
			return true;
		}

		return new WP_Error(
			'rest_forbidden',
			__( 'Sorry, you are not allowed to invite people.', 'tinta' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}

	/**
	 * Invites someone: a new account and core's new-user email, or core's
	 * signup on multisite. Someone who already has an account is added from
	 * core's Users screen instead.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function create_item( $request ) {
		$email = (string) $request['email'];

		if ( email_exists( $email ) ) {
			return new WP_Error(
				'tinta_person_exists',
				__( 'Someone already has an account with this email. Add them or change their role in WP Admin → Users.', 'tinta' ),
				array( 'status' => 409 )
			);
		}

		$login = $this->login_for( $email );

		return is_multisite() ? $this->sign_up( $login, $request ) : $this->add_user( $login, $request );
	}

	/**
	 * Gives someone who joined through a Tinta invite on multisite the name
	 * they were invited with.
	 *
	 * @param int                  $user_id  New user.
	 * @param string               $password Their password.
	 * @param array<string, mixed> $meta     Signup meta.
	 */
	public function name_activated_user( int $user_id, string $password, array $meta ): void {
		if ( ! empty( $meta['tinta_name'] ) ) {
			wp_update_user(
				array(
					'ID'           => $user_id,
					'display_name' => (string) $meta['tinta_name'],
					'nickname'     => (string) $meta['tinta_name'],
				)
			);
		}
	}

	/**
	 * Single site: creates the account and sends core's new-user email, with
	 * a link to set a password.
	 *
	 * @param string          $login   Login name.
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	private function add_user( string $login, WP_REST_Request $request ) {
		$user_id = wp_insert_user(
			array(
				'user_login'   => $login,
				'user_email'   => (string) $request['email'],
				'user_pass'    => wp_generate_password( 24 ),
				'display_name' => (string) $request['name'],
				'nickname'     => (string) $request['name'],
				'role'         => (string) $request['role'],
			)
		);

		if ( is_wp_error( $user_id ) ) {
			$user_id->add_data( array( 'status' => 400 ) );
			return $user_id;
		}

		wp_new_user_notification( $user_id, null, 'user' );

		return new WP_REST_Response( array( 'status' => 'added' ), 201 );
	}

	/**
	 * Multisite: core's signup, which emails an activation link; activating
	 * adds the person to this site with the role.
	 *
	 * @param string          $login   Login name.
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	private function sign_up( string $login, WP_REST_Request $request ) {
		$result = wpmu_validate_user_signup( $login, (string) $request['email'] );

		if ( $result['errors']->has_errors() ) {
			return new WP_Error( 'tinta_invite_invalid', $result['errors']->get_error_message(), array( 'status' => 400 ) );
		}

		wpmu_signup_user(
			$login,
			(string) $request['email'],
			array(
				'add_to_blog' => get_current_blog_id(),
				'new_role'    => (string) $request['role'],
				'tinta_name'  => (string) $request['name'],
			)
		);

		return new WP_REST_Response( array( 'status' => 'pending' ), 201 );
	}

	/**
	 * A free login name from the email's first part: lowercase letters and
	 * numbers, four or more (multisite's rule), with a number added if taken.
	 *
	 * @param string $email Email.
	 */
	private function login_for( string $email ): string {
		$base   = (string) preg_replace( '/[^a-z0-9]/', '', strtolower( (string) strstr( $email, '@', true ) ) );
		$base   = '' === $base ? 'member' : $base;
		$login  = $base;
		$number = 2;

		while ( $number < 100 && ! $this->is_login_free( $login, $email ) ) {
			$login = $base . $number;
			++$number;
		}

		return $login;
	}

	/**
	 * Whether a login name can be used: long enough, valid and not taken
	 * (signups waiting for activation included on multisite).
	 *
	 * @param string $login Login name.
	 * @param string $email Email.
	 */
	private function is_login_free( string $login, string $email ): bool {
		if ( strlen( $login ) < 4 || username_exists( $login ) || ! validate_username( $login ) ) {
			return false;
		}

		if ( ! is_multisite() ) {
			return true;
		}

		return ! wpmu_validate_user_signup( $login, $email )['errors']->get_error_messages( 'user_name' );
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
				'title'      => 'tinta-person',
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
				static fn( array $role ): bool => ! empty( $role['capabilities']['edit_tinta_docs'] )
			)
		);
	}
}
