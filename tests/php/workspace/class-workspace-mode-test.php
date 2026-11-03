<?php
/**
 * Tests for Settings, Mode and Private_Site.
 *
 * @package Tinta
 */

namespace Tinta\Tests\Workspace;

use Tinta\Roles\Roles;
use Tinta\Workspace\Mode;
use Tinta\Workspace\Screen;
use Tinta\Workspace\Settings;
use WP_REST_Request;
use WP_UnitTestCase;

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Applies core filters, as core does.

/**
 * Settings save through core's settings API; workspace mode keeps people in the
 * workspace and makes the site private; off, nothing changes.
 *
 * @covers \Tinta\Workspace\Settings
 * @covers \Tinta\Workspace\Mode
 * @covers \Tinta\Workspace\Private_Site
 */
final class Workspace_Mode_Test extends WP_UnitTestCase {

	/**
	 * Administrators change settings through wp/v2/settings; partial updates keep the rest.
	 */
	public function test_saves_settings_through_core(): void {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );

		$this->update_settings( array( 'tinta_settings' => array( 'revisions' => 25 ) ) );
		$this->update_settings(
			array(
				'tinta_settings' => array( 'workspace_mode' => true ),
				'default_role'   => Roles::MEMBER,
			)
		);

		$this->update_settings( array( 'tinta_settings' => array( 'setup_done' => true ) ) );

		$this->assertSame(
			array(
				'workspace_mode' => true,
				'revisions'      => 25,
				'setup_done'     => true,
			),
			get_option( 'tinta_settings' )
		);
		$this->assertSame( is_multisite() ? 'subscriber' : Roles::MEMBER, get_option( 'default_role' ) );
		$this->assertSame( 25, wp_revisions_to_keep( get_post( self::factory()->post->create( array( 'post_type' => 'tinta_doc' ) ) ) ) );
	}

	/**
	 * New people can't be made Administrators or Editors through Tinta, as in
	 * core's own setting.
	 */
	public function test_default_role_leaves_out_administrators(): void {
		$this->skipWithMultisite();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );

		$request = new WP_REST_Request( 'POST', '/wp/v2/settings' );
		$request->set_body_params( array( 'default_role' => 'administrator' ) );

		$this->assertSame( 400, rest_get_server()->dispatch( $request )->get_status() );
		$this->assertSame( 'subscriber', get_option( 'default_role' ) );
	}

	/**
	 * Networks keep the default role out of site settings, as core does.
	 */
	public function test_default_role_is_not_a_site_setting_on_networks(): void {
		$this->skipWithoutMultisite();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );

		$data = rest_get_server()->dispatch( new WP_REST_Request( 'GET', '/wp/v2/settings' ) )->get_data();

		$this->assertArrayNotHasKey( 'default_role', $data );
	}

	/**
	 * Open registration is spotted, so the workspace can warn about it.
	 */
	public function test_knows_when_anyone_can_sign_up(): void {
		$this->assertFalse( Settings::is_registration_open() );

		if ( is_multisite() ) {
			update_site_option( 'registration', 'user' );
		} else {
			update_option( 'users_can_register', 1 );
		}

		$this->assertTrue( Settings::is_registration_open() );
	}

	/**
	 * Members and Viewers are kept in the workspace; administrators aren't.
	 */
	public function test_keeps_members_in_the_workspace(): void {
		$this->assertSame( Screen::url(), Mode::redirect_for( 'index.php', array(), true ) );
		$this->assertSame( Screen::url(), Mode::redirect_for( 'edit.php', array(), true ) );
		$this->assertNull( Mode::redirect_for( 'profile.php', array(), true ) );
		$this->assertNull( Mode::redirect_for( 'admin.php', array( 'page' => 'tinta' ), true ) );
		$this->assertNull( Mode::redirect_for( 'post.php', array( 'get-post-lock' => '1' ), true ) );
		$this->assertNull( Mode::redirect_for( 'index.php', array(), false ) );
	}

	/**
	 * Workspace users land in the workspace after login, while workspace mode is
	 * on (the default).
	 */
	public function test_logins_land_in_the_workspace(): void {
		$member = get_user_by( 'id', self::factory()->user->create( array( 'role' => Roles::MEMBER ) ) );

		$this->assertSame( Screen::url(), apply_filters( 'login_redirect', admin_url(), '', $member ) );
		$this->assertSame( home_url( '/x' ), apply_filters( 'login_redirect', home_url( '/x' ), home_url( '/x' ), $member ) );

		update_option( 'tinta_settings', array( 'workspace_mode' => false ) );

		$this->assertSame( admin_url(), apply_filters( 'login_redirect', admin_url(), '', $member ) );
	}

	/**
	 * The REST API asks visitors to log in and sitemaps go away, while workspace
	 * mode is on (the default).
	 */
	public function test_makes_the_site_private(): void {
		wp_set_current_user( 0 );

		$this->assertWPError( apply_filters( 'rest_authentication_errors', null ) );
		$this->assertFalse( apply_filters( 'wp_sitemaps_enabled', true ) );

		update_option( 'tinta_settings', array( 'workspace_mode' => false ) );

		$this->assertNotWPError( apply_filters( 'rest_authentication_errors', null ) );
		$this->assertTrue( apply_filters( 'wp_sitemaps_enabled', true ) );
	}

	/**
	 * Saves settings through the REST API.
	 *
	 * @param array<string, mixed> $settings Settings to send.
	 */
	private function update_settings( array $settings ): void {
		$request = new WP_REST_Request( 'POST', '/wp/v2/settings' );
		$request->set_body_params( $settings );

		$this->assertSame( 200, rest_get_server()->dispatch( $request )->get_status() );
	}
}
