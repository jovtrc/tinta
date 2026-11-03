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
						),
					),
				),
			)
		);

		register_setting(
			'general',
			'default_role',
			array(
				'type'         => 'string',
				'default'      => 'subscriber',
				'show_in_rest' => array(
					'schema' => array( 'enum' => array_keys( wp_roles()->roles ) ),
				),
			)
		);
	}

	/**
	 * Current settings, every key present.
	 *
	 * @return array{workspace_mode: bool, revisions: int}
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
	 * @return array{workspace_mode: bool, revisions: int}
	 */
	public function sanitize( $value ): array {
		$settings = array_merge( self::get(), is_array( $value ) ? $value : array() );

		return array(
			'workspace_mode' => (bool) $settings['workspace_mode'],
			'revisions'      => max( 0, min( 100, (int) $settings['revisions'] ) ),
		);
	}
}
