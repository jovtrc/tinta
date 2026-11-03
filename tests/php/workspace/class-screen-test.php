<?php
/**
 * Tests for Screen.
 *
 * @package Liber
 */

namespace Liber\Tests\Workspace;

use Liber\Workspace\Screen;
use WP_UnitTestCase;

/**
 * Core's edit links for pages lead into the workspace.
 *
 * @covers \Liber\Workspace\Screen
 */
final class Screen_Test extends WP_UnitTestCase {

	/**
	 * Signs in an administrator, who can edit everything.
	 */
	public function set_up(): void {
		parent::set_up();

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
	}

	/**
	 * A page's edit link opens it in the workspace.
	 */
	public function test_page_edit_links_open_the_workspace(): void {
		$page_id = self::factory()->post->create(
			array(
				'post_type'   => 'liber_doc',
				'post_status' => 'private',
			)
		);

		$this->assertSame( admin_url( 'admin.php?page=liber&doc=' . $page_id ), get_edit_post_link( $page_id, 'raw' ) );
		$this->assertSame( admin_url( 'admin.php?page=liber&#038;doc=' . $page_id ), get_edit_post_link( $page_id ) );
	}

	/**
	 * Core's page list, new-page and edit screens lead to the workspace; take-over and other posts don't.
	 */
	public function test_core_page_screens_redirect_to_the_workspace(): void {
		$page_id = self::factory()->post->create(
			array(
				'post_type'   => 'liber_doc',
				'post_status' => 'private',
			)
		);
		$post_id = self::factory()->post->create();

		$this->assertSame( Screen::url(), Screen::core_screen_redirect( 'edit.php', array( 'post_type' => 'liber_doc' ) ) );
		$this->assertSame( Screen::url(), Screen::core_screen_redirect( 'post-new.php', array( 'post_type' => 'liber_doc' ) ) );
		$this->assertSame(
			Screen::url( $page_id ),
			Screen::core_screen_redirect(
				'post.php',
				array(
					'post'   => (string) $page_id,
					'action' => 'edit',
				)
			)
		);

		$take_over = array(
			'post'          => (string) $page_id,
			'action'        => 'edit',
			'get-post-lock' => '1',
		);
		$this->assertNull( Screen::core_screen_redirect( 'post.php', $take_over ) );
		$this->assertNull(
			Screen::core_screen_redirect(
				'post.php',
				array(
					'post'   => (string) $post_id,
					'action' => 'edit',
				)
			)
		);
		$this->assertNull( Screen::core_screen_redirect( 'edit.php', array() ) );
	}

	/**
	 * Page previews open the workspace.
	 */
	public function test_page_previews_open_the_workspace(): void {
		$page_id = self::factory()->post->create(
			array(
				'post_type'   => 'liber_doc',
				'post_status' => 'private',
			)
		);

		$this->assertSame( Screen::url( $page_id ), get_preview_post_link( $page_id ) );
	}

	/**
	 * Other posts keep core's edit link.
	 */
	public function test_other_edit_links_are_unchanged(): void {
		$post_id = self::factory()->post->create();

		$this->assertSame( admin_url( 'post.php?post=' . $post_id . '&action=edit' ), get_edit_post_link( $post_id, 'raw' ) );
	}
}
