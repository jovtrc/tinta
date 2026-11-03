<?php
/**
 * Tests for the block allowlist and the Page link block.
 *
 * @package Liber
 */

namespace Liber\Tests\Blocks;

use Liber\Roles\Roles;
use WP_Block_Editor_Context;
use WP_UnitTestCase;

/**
 * Pages offer a short list of blocks; page links render for who can read them.
 *
 * @covers \Liber\Blocks\Allowlist
 * @covers \Liber\Blocks\Registry
 */
final class Blocks_Test extends WP_UnitTestCase {

	/**
	 * The editor of a page gets the allowlist; other editors keep theirs.
	 */
	public function test_limits_blocks_in_pages_only(): void {
		$page = get_post( $this->create_page( 'Handbook' ) );
		$post = get_post( self::factory()->post->create() );

		$page_blocks = get_allowed_block_types( new WP_Block_Editor_Context( array( 'post' => $page ) ) );
		$post_blocks = get_allowed_block_types( new WP_Block_Editor_Context( array( 'post' => $post ) ) );

		$this->assertContains( 'liber/callout', $page_blocks );
		$this->assertContains( 'core/columns', $page_blocks );
		$this->assertNotContains( 'core/buttons', $page_blocks );
		$this->assertTrue( $post_blocks );
	}

	/**
	 * A page link shows the page's current icon and title, linking to the workspace.
	 */
	public function test_page_links_show_the_current_title_and_icon(): void {
		wp_set_current_user( self::factory()->user->create( array( 'role' => Roles::VIEWER ) ) );
		$page_id = $this->create_page( 'Handbook' );
		update_post_meta( $page_id, '_liber_icon', '📘' );

		$html = $this->render_link( $page_id );

		$this->assertStringContainsString( 'Handbook', $html );
		$this->assertStringContainsString( '📘', $html );
		$this->assertStringContainsString( 'page=liber&#038;doc=' . $page_id, $html );
	}

	/**
	 * Readers without access see "Private page"; trashed pages render nothing.
	 */
	public function test_page_links_hide_what_readers_cannot_open(): void {
		$page_id = $this->create_page( 'Salaries' );
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'subscriber' ) ) );

		$html = $this->render_link( $page_id );
		$this->assertStringContainsString( 'Private page', $html );
		$this->assertStringNotContainsString( 'Salaries', $html );

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		wp_trash_post( $page_id );
		$this->assertSame( '', trim( $this->render_link( $page_id ) ) );
	}

	/**
	 * Creates a private page.
	 *
	 * @param string $title Title.
	 */
	private function create_page( string $title ): int {
		return self::factory()->post->create(
			array(
				'post_type'   => 'liber_doc',
				'post_status' => 'private',
				'post_title'  => $title,
			)
		);
	}

	/**
	 * Renders a Page link block.
	 *
	 * @param int $page_id Linked page.
	 */
	private function render_link( int $page_id ): string {
		return render_block(
			array(
				'blockName'    => 'liber/page-link',
				'attrs'        => array( 'pageId' => $page_id ),
				'innerBlocks'  => array(),
				'innerHTML'    => '',
				'innerContent' => array(),
			)
		);
	}
}
