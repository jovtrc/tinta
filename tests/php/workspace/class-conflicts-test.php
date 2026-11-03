<?php
/**
 * Tests for Conflicts.
 *
 * @package Liber
 */

namespace Liber\Tests\Workspace;

use Liber\Workspace\Conflicts;
use WP_UnitTestCase;

/**
 * The setup wizard lists only the active plugins known to conflict.
 *
 * @covers \Liber\Workspace\Conflicts
 */
final class Conflicts_Test extends WP_UnitTestCase {

	/**
	 * Active plugins on the list are named, with a reason; others aren't.
	 */
	public function test_lists_active_conflicting_plugins(): void {
		update_option( 'active_plugins', array( 'classic-editor/classic-editor.php', 'akismet/akismet.php' ) );

		$conflicts = Conflicts::active();

		$this->assertSame( array( 'Classic Editor' ), wp_list_pluck( $conflicts, 'name' ) );
		$this->assertNotEmpty( $conflicts[0]['reason'] );
	}

	/**
	 * Nothing to report when none of them is active.
	 */
	public function test_is_empty_without_conflicting_plugins(): void {
		update_option( 'active_plugins', array( 'akismet/akismet.php' ) );

		$this->assertSame( array(), Conflicts::active() );
	}
}
