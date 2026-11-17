<?php
/**
 * Profile fields on core's users endpoint.
 *
 * @package Tinta
 */

namespace Tinta\Rest;

use WP_Error;
use WP_User;

defined( 'ABSPATH' ) || exit;

/**
 * What Settings → Profile needs from `wp/v2/users/me` beyond core's own
 * fields: the admin color scheme (core's `admin_color` user meta) and email
 * changes that wait for core's confirmation email, as on the profile screen.
 */
final class Profile_Fields {

	public const EMAIL_CHANGE = 'tinta_email_change';

	/**
	 * Hooks the registrations.
	 */
	public function register(): void {
		add_action( 'init', array( $this, 'register_color_scheme' ) );
		add_action( 'rest_api_init', array( $this, 'register_email_change' ) );
	}

	/**
	 * Shows core's `admin_color` user meta in REST, to people who may edit
	 * that user, cleaned as core's profile screen cleans it.
	 */
	public function register_color_scheme(): void {
		register_meta(
			'user',
			'admin_color',
			array(
				'type'              => 'string',
				'single'            => true,
				'sanitize_callback' => 'sanitize_key',
				'auth_callback'     => static fn( $allowed, $key, $user_id ) => current_user_can( 'edit_user', $user_id ),
				'show_in_rest'      => array(
					'schema' => array( 'context' => array( 'edit' ) ),
				),
			)
		);
	}

	/**
	 * Registers the `tinta_email_change` field: the address waiting for
	 * confirmation, for your own account.
	 */
	public function register_email_change(): void {
		register_rest_field(
			'user',
			self::EMAIL_CHANGE,
			array(
				'get_callback'    => array( $this, 'get_email_change' ),
				'update_callback' => array( $this, 'update_email_change' ),
				'schema'          => array(
					'description' => __( 'The new email address waiting for confirmation (your own account only). An empty value cancels the change.', 'tinta' ),
					'type'        => array( 'string', 'null' ),
					'context'     => array( 'edit' ),
				),
			)
		);
	}

	/**
	 * The new address waiting for confirmation, when the user is you.
	 *
	 * @param array<string, mixed> $user User as REST prepares it.
	 */
	public function get_email_change( array $user ): ?string {
		if ( get_current_user_id() !== $user['id'] ) {
			return null;
		}

		$pending = get_user_meta( $user['id'], '_new_email', true );

		return is_array( $pending ) && ! empty( $pending['newemail'] ) ? (string) $pending['newemail'] : null;
	}

	/**
	 * Sends core's confirmation email for a new address, or cancels the
	 * change waiting for confirmation when the value is empty or unchanged.
	 *
	 * @param mixed   $value New email address.
	 * @param WP_User $user  User being updated.
	 * @return true|WP_Error
	 */
	public function update_email_change( $value, WP_User $user ) {
		if ( get_current_user_id() !== $user->ID ) {
			return new WP_Error( 'tinta_email_change_forbidden', __( 'You can only change your own email address.', 'tinta' ), array( 'status' => 403 ) );
		}

		$email = sanitize_email( is_string( $value ) ? $value : '' );

		if ( '' === $email || $email === $user->user_email ) {
			delete_user_meta( $user->ID, '_new_email' );
			return true;
		}

		return $this->send_confirmation( $user->ID, $email );
	}

	/**
	 * Runs core's `send_confirmation_on_profile_email()`, which reads the new
	 * address from `$_POST` and reports problems in the `$errors` global.
	 *
	 * @param int    $user_id User changing their address.
	 * @param string $email   New address.
	 * @return true|WP_Error
	 */
	private function send_confirmation( int $user_id, string $email ) {
		global $errors;

		$errors         = new WP_Error(); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- Core's function reports through this global.
		$_POST['email'] = $email; // phpcs:ignore WordPress.Security.NonceVerification.Missing -- Core's function reads the address from $_POST; the REST request is already authenticated.

		send_confirmation_on_profile_email( $user_id );

		unset( $_POST['email'] ); // phpcs:ignore WordPress.Security.NonceVerification.Missing -- Undoes the line above.

		if ( $errors->has_errors() ) {
			return new WP_Error( 'tinta_email_change_invalid', wp_strip_all_tags( $errors->get_error_message() ), array( 'status' => 400 ) );
		}

		return true;
	}
}
