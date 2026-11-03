<?php
/**
 * Workspace preferences per user.
 *
 * @package Tinta
 */

namespace Tinta\Rest;

use WP_Error;
use WP_User;

defined( 'ABSPATH' ) || exit;

/**
 * The `tinta_prefs` field on users: pinned and recent pages, expanded tree
 * branches and recently used emoji. One user option per site, so each site
 * of a network keeps its own. Users read and change only their own.
 */
final class User_Prefs_Field {

	public const NAME = 'tinta_prefs';

	/**
	 * Most items each list keeps.
	 */
	private const LIMITS = array(
		'pinned'   => 50,
		'recent'   => 5,
		'expanded' => 500,
		'emojis'   => 16,
	);

	/**
	 * Hooks the field registration.
	 */
	public function register(): void {
		add_action( 'rest_api_init', array( $this, 'register_field' ) );
	}

	/**
	 * Registers the field.
	 */
	public function register_field(): void {
		$ids = static fn( int $max ): array => array(
			'type'     => 'array',
			'items'    => array( 'type' => 'integer' ),
			'maxItems' => $max,
		);

		register_rest_field(
			'user',
			self::NAME,
			array(
				'get_callback'    => array( $this, 'get_prefs' ),
				'update_callback' => array( $this, 'update_prefs' ),
				'schema'          => array(
					'description'          => __( 'Workspace preferences on this site.', 'tinta' ),
					'type'                 => 'object',
					'context'              => array( 'edit' ),
					'additionalProperties' => false,
					'properties'           => array(
						'pinned'   => $ids( self::LIMITS['pinned'] ),
						'recent'   => $ids( self::LIMITS['recent'] ),
						'expanded' => $ids( self::LIMITS['expanded'] ),
						'emojis'   => array(
							'type'     => 'array',
							'items'    => array(
								'type'      => 'string',
								'maxLength' => 16,
							),
							'maxItems' => self::LIMITS['emojis'],
						),
					),
				),
			)
		);
	}

	/**
	 * The current user's own preferences; nobody else's.
	 *
	 * @param array<string, mixed> $user User as prepared for the response.
	 * @return array<string, array<int, int|string>>|null
	 */
	public function get_prefs( array $user ): ?array {
		return get_current_user_id() === (int) $user['id'] ? self::read( (int) $user['id'] ) : null;
	}

	/**
	 * Saves the lists sent; the others stay as they are.
	 *
	 * @param mixed   $value Lists to save.
	 * @param WP_User $user  User being updated.
	 * @return true|WP_Error
	 */
	public function update_prefs( $value, WP_User $user ) {
		if ( get_current_user_id() !== $user->ID ) {
			return new WP_Error( 'rest_forbidden', __( 'Sorry, you can only change your own preferences.', 'tinta' ), array( 'status' => 403 ) );
		}

		$prefs = array_merge( self::read( $user->ID ), array_intersect_key( (array) $value, self::LIMITS ) );
		update_user_option( $user->ID, self::NAME, self::clean( $prefs ) );

		return true;
	}

	/**
	 * A user's preferences on the current site, every list present.
	 *
	 * @param int $user_id User ID.
	 * @return array<string, array<int, int|string>>
	 */
	public static function read( int $user_id ): array {
		$stored = get_user_option( self::NAME, $user_id );

		return self::clean( is_array( $stored ) ? $stored : array() );
	}

	/**
	 * Keeps known lists, unique values, within their limits.
	 *
	 * @param array<string, mixed> $prefs Raw preferences.
	 * @return array<string, array<int, int|string>>
	 */
	private static function clean( array $prefs ): array {
		$clean = array();

		foreach ( self::LIMITS as $list => $limit ) {
			$values         = array_values( (array) ( $prefs[ $list ] ?? array() ) );
			$values         = 'emojis' === $list ? array_map( 'sanitize_text_field', $values ) : array_filter( array_map( 'absint', $values ) );
			$clean[ $list ] = array_slice( array_values( array_unique( $values ) ), 0, $limit );
		}

		return $clean;
	}
}
