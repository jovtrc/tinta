<?php
/**
 * Workspace roles and capabilities.
 *
 * @package Tinta
 */

namespace Tinta\Roles;

defined( 'ABSPATH' ) || exit;

/**
 * Member and Viewer roles, plus Tinta's capabilities for administrators.
 */
final class Roles {

	public const MEMBER = 'tinta_member';
	public const VIEWER = 'tinta_viewer';

	/**
	 * Enter the workspace and read every page.
	 */
	private const READ_CAPS = array(
		'tinta_access',
		'read_private_tinta_docs',
	);

	/**
	 * Create, edit and trash any page. WordPress needs `publish_*` to set any status, `private` included.
	 */
	private const WRITE_CAPS = array(
		'edit_tinta_docs',
		'edit_others_tinta_docs',
		'edit_private_tinta_docs',
		'edit_published_tinta_docs',
		'publish_tinta_docs',
		'delete_tinta_docs',
		'delete_others_tinta_docs',
		'delete_private_tinta_docs',
		'delete_published_tinta_docs',
	);

	/**
	 * Workspace settings.
	 */
	private const ADMIN_CAPS = array(
		'tinta_manage',
	);

	/**
	 * Adds the roles and grants administrators every Tinta capability.
	 *
	 * Adding caps one by one also updates roles created by an older version.
	 */
	public static function install(): void {
		$grants = array(
			self::VIEWER    => array_merge( array( 'read' ), self::READ_CAPS ),
			self::MEMBER    => array_merge( array( 'read', 'upload_files' ), self::READ_CAPS, self::WRITE_CAPS ),
			'administrator' => array_merge( self::READ_CAPS, self::WRITE_CAPS, self::ADMIN_CAPS ),
		);

		// phpcs:disable WordPressVIPMinimum.Functions.RestrictedFunctions.custom_role_add_role -- wpcom_vip_add_role() exists only on VIP.
		add_role( self::VIEWER, 'Viewer' );
		add_role( self::MEMBER, 'Member' );
		// phpcs:enable

		foreach ( $grants as $role_name => $caps ) {
			$role = get_role( $role_name );
			foreach ( $caps as $cap ) {
				$role?->add_cap( $cap );
			}
		}
	}

	/**
	 * Removes the roles and Tinta's capabilities from administrators.
	 */
	public static function uninstall(): void {
		remove_role( self::VIEWER );
		remove_role( self::MEMBER );

		$admin = get_role( 'administrator' );
		foreach ( array_merge( self::READ_CAPS, self::WRITE_CAPS, self::ADMIN_CAPS ) as $cap ) {
			$admin?->remove_cap( $cap );
		}
	}
}
