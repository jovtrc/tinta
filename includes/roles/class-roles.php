<?php
/**
 * Workspace roles and capabilities.
 *
 * @package Liber
 */

namespace Liber\Roles;

defined( 'ABSPATH' ) || exit;

/**
 * Member and Viewer roles, plus Liber's capabilities for administrators.
 */
final class Roles {

	public const MEMBER = 'liber_member';
	public const VIEWER = 'liber_viewer';

	/**
	 * Enter the workspace and read every page.
	 */
	private const READ_CAPS = array(
		'liber_access',
		'read_private_liber_docs',
	);

	/**
	 * Create, edit and trash any page. WordPress needs `publish_*` to set any status, `private` included.
	 */
	private const WRITE_CAPS = array(
		'edit_liber_docs',
		'edit_others_liber_docs',
		'edit_private_liber_docs',
		'edit_published_liber_docs',
		'publish_liber_docs',
		'delete_liber_docs',
		'delete_others_liber_docs',
		'delete_private_liber_docs',
		'delete_published_liber_docs',
	);

	/**
	 * Workspace settings.
	 */
	private const ADMIN_CAPS = array(
		'liber_manage',
	);

	/**
	 * Adds the roles and grants administrators every Liber capability.
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
	 * Removes the roles and Liber's capabilities from administrators.
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
