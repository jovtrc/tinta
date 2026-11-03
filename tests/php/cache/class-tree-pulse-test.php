<?php
/**
 * Tests for Tree_Pulse.
 *
 * @package Tinta
 */

namespace Tinta\Tests\Cache;

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Applies core's Heartbeat filter, as Heartbeat does.

use Tinta\Roles\Roles;
use WP_UnitTestCase;

/**
 * Heartbeat carries the tree generation to workspace users who ask for it.
 *
 * @covers \Tinta\Cache\Tree_Pulse
 */
final class Tree_Pulse_Test extends WP_UnitTestCase {

	/**
	 * Workspace users get the current generation.
	 */
	public function test_sends_the_generation_to_workspace_users(): void {
		wp_set_current_user( self::factory()->user->create( array( 'role' => Roles::VIEWER ) ) );
		update_option( 'tinta_tree_generation', 7 );

		$response = apply_filters( 'heartbeat_received', array(), array( 'tinta_tree' => 3 ), 'toplevel_page_tinta' );

		$this->assertSame( 7, $response['tinta_tree'] );
	}

	/**
	 * Heartbeat ticks every 15 seconds on the workspace screen only.
	 */
	public function test_ticks_faster_on_the_workspace_screen(): void {
		set_current_screen( 'toplevel_page_tinta' );
		$this->assertSame( 15, apply_filters( 'heartbeat_settings', array() )['interval'] );

		set_current_screen( 'dashboard' );
		$this->assertArrayNotHasKey( 'interval', apply_filters( 'heartbeat_settings', array() ) );
	}

	/**
	 * Nothing is added unless the workspace asks, or for users outside it.
	 */
	public function test_sends_nothing_otherwise(): void {
		wp_set_current_user( self::factory()->user->create( array( 'role' => Roles::VIEWER ) ) );
		$this->assertArrayNotHasKey( 'tinta_tree', apply_filters( 'heartbeat_received', array(), array(), 'dashboard' ) );

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'subscriber' ) ) );
		$this->assertArrayNotHasKey( 'tinta_tree', apply_filters( 'heartbeat_received', array(), array( 'tinta_tree' => 3 ), 'dashboard' ) );
	}
}
