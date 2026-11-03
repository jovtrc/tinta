<?php
/**
 * Cleanup when the plugin is deleted.
 *
 * @package Liber
 */

namespace Liber\Setup;

use Liber\Cache\Cache;
use Liber\Docs\Tree;
use Liber\Rest\User_Prefs_Field;
use Liber\Roles\Roles;
use Liber\Workspace\Settings;

defined( 'ABSPATH' ) || exit;

/**
 * Removes Liber's roles, capabilities, settings, cache and people's
 * preferences from every site.
 *
 * Pages stay: they are the team's content, not plugin settings. People who
 * were Members or Viewers keep that role name, with no capabilities, until
 * Liber comes back.
 */
final class Uninstaller {

	/**
	 * Cleans up the current site, or every site on a network.
	 */
	public static function uninstall(): void {
		if ( ! is_multisite() ) {
			self::uninstall_site();
			return;
		}

		$site_ids = get_sites(
			array(
				'fields' => 'ids',
				'number' => 0,
			)
		);

		foreach ( $site_ids as $site_id ) {
			switch_to_blog( $site_id ); // phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.switch_to_blog_switch_to_blog -- Only roles and options change; no other site's hooks are needed.
			self::uninstall_site();
			restore_current_blog();
		}
	}

	/**
	 * Cleans up the current site.
	 */
	private static function uninstall_site(): void {
		global $wpdb;

		if ( in_array( get_option( 'default_role' ), array( Roles::MEMBER, Roles::VIEWER ), true ) ) {
			update_option( 'default_role', 'subscriber' );
		}

		Roles::uninstall();
		( new Cache() )->delete( Tree::CACHE_KEY );
		delete_option( Tree::GENERATION_OPTION );
		delete_option( Settings::OPTION );
		delete_option( Installer::VERSION_OPTION );
		delete_metadata( 'user', 0, $wpdb->get_blog_prefix() . User_Prefs_Field::NAME, '', true );
	}
}
