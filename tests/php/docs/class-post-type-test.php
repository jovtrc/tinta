<?php
/**
 * Tests for Post_Type.
 *
 * @package Liber
 */

namespace Liber\Tests\Docs;

use WP_REST_Request;
use WP_REST_Response;
use WP_UnitTestCase;

/**
 * Pages nest up to 5 levels, under other pages only.
 *
 * @covers \Liber\Docs\Post_Type
 */
final class Post_Type_Test extends WP_UnitTestCase {

	/**
	 * Signs in an administrator.
	 */
	public function set_up(): void {
		parent::set_up();

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
	}

	/**
	 * A fifth level is allowed; a sixth isn't.
	 */
	public function test_pages_nest_up_to_five_levels(): void {
		$parent_id = 0;
		for ( $level = 1; $level <= 4; $level++ ) {
			$parent_id = $this->create_page( $parent_id );
		}

		$fifth = $this->create_through_rest( $parent_id );
		$this->assertSame( 201, $fifth->get_status() );

		$sixth = $this->create_through_rest( $fifth->get_data()['id'] );
		$this->assertSame( 400, $sixth->get_status() );
		$this->assertSame( 'liber_too_deep', $sixth->get_data()['code'] );
	}

	/**
	 * A page can't go under another post type.
	 */
	public function test_parents_must_be_pages(): void {
		$response = $this->create_through_rest( self::factory()->post->create() );

		$this->assertSame( 'liber_invalid_parent', $response->get_data()['code'] );
	}

	/**
	 * Creates a private page.
	 *
	 * @param int $parent_id Parent page ID.
	 */
	private function create_page( int $parent_id ): int {
		return self::factory()->post->create(
			array(
				'post_type'   => 'liber_doc',
				'post_status' => 'private',
				'post_parent' => $parent_id,
			)
		);
	}

	/**
	 * Creates a page under a parent through the REST API.
	 *
	 * @param int $parent_id Parent ID.
	 */
	private function create_through_rest( int $parent_id ): WP_REST_Response {
		$request = new WP_REST_Request( 'POST', '/wp/v2/liber-docs' );
		$request->set_body_params(
			array(
				'title'  => 'Nested',
				'status' => 'private',
				'parent' => $parent_id,
			)
		);

		return rest_get_server()->dispatch( $request );
	}
}
