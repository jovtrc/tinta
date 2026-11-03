<?php
/**
 * Workspace settings.
 *
 * @package Liber
 */

namespace Liber\Workspace;

defined( 'ABSPATH' ) || exit;

/**
 * `liber_settings` (workspace mode, revisions kept), registered with core's
 * settings API so admins change it through `wp/v2/settings`. Core's own
 * `default_role` is exposed there too, for "New people join as".
 */
final class Settings {

	public const OPTION = 'liber_settings';

	public const DEFAULTS = array(
		'workspace_mode' => false,
		'revisions'      => 10,
		'setup_done'     => false,
	);

	/**
	 * Hooks the registration.
	 */
	public function register(): void {
		add_action( 'init', array( $this, 'register_settings' ) );
	}

	/**
	 * Registers the settings.
	 */
	public function register_settings(): void {
		register_setting(
			'liber',
			self::OPTION,
			array(
				'type'              => 'object',
				'default'           => self::DEFAULTS,
				'sanitize_callback' => array( $this, 'sanitize' ),
				'show_in_rest'      => array(
					'schema' => array(
						'type'                 => 'object',
						'additionalProperties' => false,
						'properties'           => array(
							'workspace_mode' => array( 'type' => 'boolean' ),
							'revisions'      => array(
								'type'    => 'integer',
								'minimum' => 0,
								'maximum' => 100,
							),
							'setup_done'     => array( 'type' => 'boolean' ),
						),
					),
				),
			)
		);

		// Core only lets single sites change the default role from General settings.
		if ( is_multisite() ) {
			return;
		}

		register_setting(
			'general',
			'default_role',
			array(
				'type'         => 'string',
				'default'      => 'subscriber',
				'show_in_rest' => array(
					'schema' => array( 'enum' => self::default_roles() ),
				),
			)
		);
	}

	/**
	 * Whether anyone can sign up, and so get the default role.
	 */
	public static function is_registration_open(): bool {
		return is_multisite()
			? in_array( get_site_option( 'registration' ), array( 'user', 'all' ), true )
			: (bool) get_option( 'users_can_register' );
	}

	/**
	 * Roles new people can get: core's own choices for this setting, which leave
	 * out Administrator and Editor unless one is already the default.
	 *
	 * @return string[]
	 */
	private static function default_roles(): array {
		/** This filter is documented in wp-admin/options-general.php */
		$excluded = (array) apply_filters( 'default_role_dropdown_excluded_roles', array( 'administrator', 'editor' ) ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Applies core's filter, as core does.
		$current  = get_option( 'default_role' );

		return array_values(
			array_filter(
				array_keys( wp_roles()->roles ),
				static fn( string $role ): bool => $role === $current || ! in_array( $role, $excluded, true )
			)
		);
	}

	/**
	 * Current settings, every key present.
	 *
	 * @return array{workspace_mode: bool, revisions: int, setup_done: bool}
	 */
	public static function get(): array {
		$stored = get_option( self::OPTION, array() );

		return array_merge( self::DEFAULTS, is_array( $stored ) ? $stored : array() );
	}

	/**
	 * Whether workspace mode is on.
	 */
	public static function is_workspace_mode(): bool {
		return (bool) self::get()['workspace_mode'];
	}

	/**
	 * Merges a partial update into the stored settings and normalizes them.
	 *
	 * @param mixed $value Settings sent.
	 * @return array{workspace_mode: bool, revisions: int, setup_done: bool}
	 */
	public function sanitize( $value ): array {
		$settings = array_merge( self::get(), is_array( $value ) ? $value : array() );

		return array(
			'workspace_mode' => (bool) $settings['workspace_mode'],
			'revisions'      => max( 0, min( 100, (int) $settings['revisions'] ) ),
			'setup_done'     => (bool) $settings['setup_done'],
		);
	}
}
