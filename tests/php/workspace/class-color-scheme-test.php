<?php
/**
 * Tests for Color_Scheme.
 *
 * @package Tinta
 */

namespace Tinta\Tests\Workspace;

use Tinta\Workspace\Color_Scheme;
use Tinta\Workspace\Settings;
use WP_UnitTestCase;

/**
 * Tinta Light is offered to everyone, and given to people who join in
 * workspace mode.
 *
 * @covers \Tinta\Workspace\Color_Scheme
 */
final class Color_Scheme_Test extends WP_UnitTestCase {

	/**
	 * The scheme is registered with its stylesheet.
	 */
	public function test_registers_tinta_light(): void {
		global $_wp_admin_css_colors;

		( new Color_Scheme() )->add_scheme();

		$this->assertArrayHasKey( Color_Scheme::NAME, $_wp_admin_css_colors );
		$this->assertStringEndsWith( 'build/admin-colors/tinta-light.css', $_wp_admin_css_colors[ Color_Scheme::NAME ]->url );
	}

	/**
	 * People who join in workspace mode get Tinta Light.
	 */
	public function test_new_people_get_it_in_workspace_mode(): void {
		update_option( Settings::OPTION, array( 'workspace_mode' => true ) );

		$user_id = self::factory()->user->create();

		$this->assertSame( Color_Scheme::NAME, get_user_option( 'admin_color', $user_id ) );
	}

	/**
	 * Without workspace mode, new people keep core's default.
	 */
	public function test_new_people_keep_the_default_otherwise(): void {
		$user_id = self::factory()->user->create();

		$this->assertNotSame( Color_Scheme::NAME, get_user_option( 'admin_color', $user_id ) );
	}
}
