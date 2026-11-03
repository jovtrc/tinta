<?php
/**
 * Tests for cleanup on uninstall.
 *
 * @package Liber
 */

namespace Liber\Tests\Setup;

use Liber\Cache\Cache;
use Liber\Docs\Tree;
use Liber\Rest\User_Prefs_Field;
use Liber\Roles\Roles;
use Liber\Setup\Installer;
use Liber\Setup\Uninstaller;
use Liber\Workspace\Settings;
use WP_UnitTestCase;

/**
 * Deleting the plugin cleans up after it, but keeps the pages.
 *
 * @covers \Liber\Setup\Uninstaller
 */
final class Uninstaller_Test extends WP_UnitTestCase {

	/**
	 * Restores roles from the rolled-back database.
	 */
	public function tear_down(): void {
		parent::tear_down();
		wp_cache_flush();
		wp_roles()->for_site();
	}

	/**
	 * Roles, admin capabilities, options, the cached tree and preferences go.
	 */
	public function test_removes_roles_settings_cache_and_preferences(): void {
		$member = self::factory()->user->create( array( 'role' => Roles::MEMBER ) );
		update_user_option( $member, User_Prefs_Field::NAME, array( 'pinned' => array( 1 ) ) );
		update_option( Settings::OPTION, array( 'workspace_mode' => true ) );
		update_option( Tree::GENERATION_OPTION, 3 );
		( new Cache() )->set( Tree::CACHE_KEY, array() );

		Uninstaller::uninstall();

		$this->assertNull( get_role( Roles::MEMBER ) );
		$this->assertNull( get_role( Roles::VIEWER ) );
		$this->assertFalse( get_role( 'administrator' )->has_cap( 'liber_access' ) );
		$this->assertNull( get_option( Settings::OPTION, null ) );
		$this->assertFalse( get_option( Tree::GENERATION_OPTION ) );
		$this->assertFalse( get_option( Installer::VERSION_OPTION ) );
		$this->assertNull( ( new Cache() )->get( Tree::CACHE_KEY ) );
		$this->assertFalse( get_user_option( User_Prefs_Field::NAME, $member ) );
	}

	/**
	 * Pages are the team's content and stay.
	 */
	public function test_keeps_pages(): void {
		$page = self::factory()->post->create(
			array(
				'post_type'   => 'liber_doc',
				'post_status' => 'private',
			)
		);

		Uninstaller::uninstall();

		$this->assertSame( 'private', get_post_status( $page ) );
	}

	/**
	 * A default role Liber added falls back to Subscriber.
	 */
	public function test_new_people_join_as_subscribers_again(): void {
		update_option( 'default_role', Roles::MEMBER );

		Uninstaller::uninstall();

		$this->assertSame( 'subscriber', get_option( 'default_role' ) );
	}

	/**
	 * Any other default role stays.
	 */
	public function test_leaves_other_default_roles_alone(): void {
		update_option( 'default_role', 'author' );

		Uninstaller::uninstall();

		$this->assertSame( 'author', get_option( 'default_role' ) );
	}

	/**
	 * Every site of a network is cleaned.
	 */
	public function test_cleans_every_site_of_a_network(): void {
		$this->skipWithoutMultisite();

		$site = self::factory()->blog->create();
		switch_to_blog( $site ); // phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.switch_to_blog_switch_to_blog -- Writes another site's option.
		update_option( Settings::OPTION, array( 'workspace_mode' => true ) );
		restore_current_blog();

		Uninstaller::uninstall();

		switch_to_blog( $site ); // phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.switch_to_blog_switch_to_blog -- Reads another site's option.
		$this->assertNull( get_option( Settings::OPTION, null ) );
		restore_current_blog();
	}
}
