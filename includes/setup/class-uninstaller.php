<?php
/**
 * Cleanup when the plugin is deleted.
 *
 * @package Liber
 */

namespace Liber\Setup;

use Liber\Roles\Roles;

defined( 'ABSPATH' ) || exit;

/**
 * Removes Liber's roles, capabilities and options from every site.
 *
 * Pages stay: they are the team's content, not plugin settings.
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
		Roles::uninstall();
		delete_option( Installer::VERSION_OPTION );
	}
}
