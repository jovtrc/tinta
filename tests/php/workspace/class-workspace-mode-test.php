<?php
/**
 * Tests for Settings, Mode and Private_Site.
 *
 * @package Liber
 */

namespace Liber\Tests\Workspace;

use Liber\Roles\Roles;
use Liber\Workspace\Mode;
use Liber\Workspace\Screen;
use WP_REST_Request;
use WP_UnitTestCase;

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Applies core filters, as core does.

/**
 * Settings save through core's settings API; workspace mode keeps people in the
 * workspace and makes the site private; off, nothing changes.
 *
 * @covers \Liber\Workspace\Settings
 * @covers \Liber\Workspace\Mode
 * @covers \Liber\Workspace\Private_Site
 */
final class Workspace_Mode_Test extends WP_UnitTestCase {

	/**
	 * Administrators change settings through wp/v2/settings; partial updates keep the rest.
	 */
	public function test_saves_settings_through_core(): void {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );

		$this->update_settings( array( 'liber_settings' => array( 'revisions' => 25 ) ) );
		$this->update_settings(
			array(
				'liber_settings' => array( 'workspace_mode' => true ),
				'default_role'   => Roles::MEMBER,
			)
		);

		$this->assertSame(
			array(
				'workspace_mode' => true,
				'revisions'      => 25,
			),
			get_option( 'liber_settings' )
		);
		$this->assertSame( Roles::MEMBER, get_option( 'default_role' ) );
		$this->assertSame( 25, wp_revisions_to_keep( get_post( self::factory()->post->create( array( 'post_type' => 'liber_doc' ) ) ) ) );
	}

	/**
	 * Members and Viewers are kept in the workspace; administrators aren't.
	 */
	public function test_keeps_members_in_the_workspace(): void {
		$this->assertSame( Screen::url(), Mode::redirect_for( 'index.php', array(), true ) );
		$this->assertSame( Screen::url(), Mode::redirect_for( 'edit.php', array(), true ) );
		$this->assertNull( Mode::redirect_for( 'profile.php', array(), true ) );
		$this->assertNull( Mode::redirect_for( 'admin.php', array( 'page' => 'liber' ), true ) );
		$this->assertNull( Mode::redirect_for( 'post.php', array( 'get-post-lock' => '1' ), true ) );
		$this->assertNull( Mode::redirect_for( 'index.php', array(), false ) );
	}

	/**
	 * Workspace users land in the workspace after login, only with workspace mode on.
	 */
	public function test_logins_land_in_the_workspace(): void {
		$member = get_user_by( 'id', self::factory()->user->create( array( 'role' => Roles::MEMBER ) ) );

		$this->assertSame( admin_url(), apply_filters( 'login_redirect', admin_url(), '', $member ) );

		update_option( 'liber_settings', array( 'workspace_mode' => true ) );

		$this->assertSame( Screen::url(), apply_filters( 'login_redirect', admin_url(), '', $member ) );
		$this->assertSame( home_url( '/x' ), apply_filters( 'login_redirect', home_url( '/x' ), home_url( '/x' ), $member ) );
	}

	/**
	 * The REST API asks visitors to log in and sitemaps go away, only with workspace mode on.
	 */
	public function test_makes_the_site_private(): void {
		wp_set_current_user( 0 );

		$this->assertNotWPError( apply_filters( 'rest_authentication_errors', null ) );
		$this->assertTrue( apply_filters( 'wp_sitemaps_enabled', true ) );

		update_option( 'liber_settings', array( 'workspace_mode' => true ) );

		$this->assertWPError( apply_filters( 'rest_authentication_errors', null ) );
		$this->assertFalse( apply_filters( 'wp_sitemaps_enabled', true ) );
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
