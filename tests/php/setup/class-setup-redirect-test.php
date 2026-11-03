<?php
/**
 * Tests for Setup_Redirect.
 *
 * @package Tinta
 */

namespace Tinta\Tests\Setup;

use RuntimeException;
use Tinta\Setup\Setup_Redirect;
use Tinta\Workspace\Screen;
use Tinta\Workspace\Settings;
use WP_UnitTestCase;

/**
 * Activation takes the administrator who did it to the setup wizard, once.
 *
 * @covers \Tinta\Setup\Setup_Redirect
 */
final class Setup_Redirect_Test extends WP_UnitTestCase {

	/**
	 * The administrator who activates the plugin.
	 *
	 * @var int
	 */
	private int $admin;

	/**
	 * Signs in an administrator and stops redirects before they exit.
	 */
	public function set_up(): void {
		parent::set_up();

		$this->admin = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $this->admin );
		add_filter(
			'wp_redirect',
			static function ( string $location ): never {
				throw new RuntimeException( $location ); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Test-only signal.
			}
		);
	}

	/**
	 * Cleans the bulk activation flag.
	 */
	public function tear_down(): void {
		unset( $_GET['activate-multi'] );
		parent::tear_down();
	}

	/**
	 * Activation remembers who activated the plugin.
	 */
	public function test_activation_remembers_who_did_it(): void {
		Setup_Redirect::flag();

		$this->assertSame( $this->admin, get_transient( Setup_Redirect::FLAG ) );
	}

	/**
	 * Network activation and WP-CLI (no user) don't redirect anyone.
	 */
	public function test_network_activation_and_cli_are_left_alone(): void {
		Setup_Redirect::flag( true );
		$this->assertFalse( get_transient( Setup_Redirect::FLAG ) );

		wp_set_current_user( 0 );
		Setup_Redirect::flag();
		$this->assertFalse( get_transient( Setup_Redirect::FLAG ) );
	}

	/**
	 * The next admin page takes the administrator to the workspace, once.
	 */
	public function test_sends_the_administrator_to_the_wizard_once(): void {
		Setup_Redirect::flag();

		try {
			( new Setup_Redirect() )->maybe_redirect();
			$this->fail( 'No redirect.' );
		} catch ( RuntimeException $redirect ) {
			$this->assertSame( Screen::url(), $redirect->getMessage() );
		}

		$this->assertFalse( get_transient( Setup_Redirect::FLAG ) );
	}

	/**
	 * No redirect when setup is done, for bulk activation, or for someone else.
	 */
	public function test_stays_put_otherwise(): void {
		update_option( Settings::OPTION, array( 'setup_done' => true ) );
		$this->assert_stays();

		delete_option( Settings::OPTION );
		$_GET['activate-multi'] = 'true';
		$this->assert_stays();

		unset( $_GET['activate-multi'] );
		Setup_Redirect::flag();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		( new Setup_Redirect() )->maybe_redirect();
		$this->assertFalse( get_transient( Setup_Redirect::FLAG ) );
	}

	/**
	 * Activates, loads an admin page, and expects no redirect.
	 */
	private function assert_stays(): void {
		Setup_Redirect::flag();
		( new Setup_Redirect() )->maybe_redirect();

		$this->assertFalse( get_transient( Setup_Redirect::FLAG ) );
	}
}
