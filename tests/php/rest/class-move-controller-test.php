<?php
/**
 * Tests for Move_Controller and Mover.
 *
 * @package Liber
 */

namespace Liber\Tests\Rest;

use Liber\Cache\Cache;
use Liber\Docs\Tree;
use Liber\Roles\Roles;
use WP_REST_Request;
use WP_REST_Response;
use WP_UnitTestCase;

/**
 * Pages move between parents and positions; cycles and too-deep moves are refused.
 *
 * @covers \Liber\Rest\Move_Controller
 * @covers \Liber\Docs\Mover
 */
final class Move_Controller_Test extends WP_UnitTestCase {

	/**
	 * Reads the tree.
	 *
	 * @var Tree
	 */
	private Tree $tree;

	/**
	 * Signs in a member.
	 */
	public function set_up(): void {
		parent::set_up();

		$this->tree = new Tree( new Cache() );
		wp_set_current_user( self::factory()->user->create( array( 'role' => Roles::MEMBER ) ) );
	}

	/**
	 * Siblings are renumbered around the moved page.
	 */
	public function test_reorders_siblings(): void {
		$a = $this->create_page( 'A', 0, 0 );
		$b = $this->create_page( 'B', 0, 1 );
		$c = $this->create_page( 'C', 0, 2 );

		$this->assertSame( 200, $this->move( $c, 0, 0 )->get_status() );

		$this->assertSame( array( $c, $a, $b ), array_column( $this->tree->pages(), 'id' ) );
	}

	/**
	 * A page moves under another page, keeping its subpages and its modified date.
	 */
	public function test_moves_under_another_page(): void {
		$handbook   = $this->create_page( 'Handbook' );
		$onboarding = $this->create_page( 'Onboarding' );
		$setup      = $this->create_page( 'Local setup', $onboarding );
		$modified   = get_post_field( 'post_modified_gmt', $onboarding );

		$response = $this->move( $onboarding, $handbook, 0 );

		$this->assertSame( $handbook, $response->get_data()['parent'] );
		$this->assertSame( $handbook, wp_get_post_parent_id( $onboarding ) );
		$this->assertSame( $onboarding, wp_get_post_parent_id( $setup ) );
		$this->assertSame( $modified, get_post_field( 'post_modified_gmt', $onboarding ) );
	}

	/**
	 * A page can't move inside its own subtree.
	 */
	public function test_refuses_cycles(): void {
		$handbook   = $this->create_page( 'Handbook' );
		$onboarding = $this->create_page( 'Onboarding', $handbook );

		$this->assertSame( 'liber_move_cycle', $this->move( $handbook, $onboarding, 0 )->get_data()['code'] );
	}

	/**
	 * A subtree can't go past level 5.
	 */
	public function test_refuses_moves_past_the_deepest_level(): void {
		$parent_id = 0;
		for ( $level = 1; $level <= 4; $level++ ) {
			$parent_id = $this->create_page( "Level {$level}", $parent_id );
		}
		$branch = $this->create_page( 'Branch' );
		$this->create_page( 'Leaf', $branch );

		$this->assertSame( 'liber_too_deep', $this->move( $branch, $parent_id, 0 )->get_data()['code'] );
	}

	/**
	 * Viewers can't move pages.
	 */
	public function test_viewers_are_refused(): void {
		$page_id = $this->create_page( 'Handbook' );
		wp_set_current_user( self::factory()->user->create( array( 'role' => Roles::VIEWER ) ) );

		$this->assertSame( 403, $this->move( $page_id, 0, 0 )->get_status() );
	}

	/**
	 * Creates a private page.
	 *
	 * @param string $title     Title.
	 * @param int    $parent_id Parent page ID.
	 * @param int    $order     Sibling order.
	 */
	private function create_page( string $title, int $parent_id = 0, int $order = 0 ): int {
		return self::factory()->post->create(
			array(
				'post_type'   => 'liber_doc',
				'post_status' => 'private',
				'post_title'  => $title,
				'post_parent' => $parent_id,
				'menu_order'  => $order,
			)
		);
	}

	/**
	 * Sends a move request.
	 *
	 * @param int $page_id   Page ID.
	 * @param int $parent_id New parent.
	 * @param int $position  Position among the new siblings.
	 */
	private function move( int $page_id, int $parent_id, int $position ): WP_REST_Response {
		$request = new WP_REST_Request( 'POST', "/liber/v1/docs/{$page_id}/move" );
		$request->set_body_params(
			array(
				'parent'   => $parent_id,
				'position' => $position,
			)
		);

		return rest_get_server()->dispatch( $request );
	}
}
