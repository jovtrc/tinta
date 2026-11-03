<?php
/**
 * Tests that core's Notes work on pages.
 *
 * @package Tinta
 */

namespace Tinta\Tests\Docs;

use Tinta\Roles\Roles;
use WP_REST_Request;
use WP_REST_Response;
use WP_UnitTestCase;

/**
 * Members write and read notes on pages through core's comments API; Viewers can't.
 *
 * @covers \Tinta\Docs\Post_Type
 * @covers \Tinta\Docs\Notes_Access
 */
final class Notes_Test extends WP_UnitTestCase {

	/**
	 * A page.
	 *
	 * @var int
	 */
	private int $page_id;

	/**
	 * Creates the page.
	 */
	public function set_up(): void {
		parent::set_up();

		$this->page_id = self::factory()->post->create(
			array(
				'post_type'   => 'tinta_doc',
				'post_status' => 'private',
			)
		);
	}

	/**
	 * Members add notes and read the page's notes.
	 */
	public function test_members_add_and_read_notes(): void {
		wp_set_current_user( self::factory()->user->create( array( 'role' => Roles::MEMBER ) ) );

		$created = $this->request(
			'POST',
			array(
				'post'    => $this->page_id,
				'content' => 'Can we add the VPN steps?',
				'status'  => 'hold',
				'type'    => 'note',
			)
		);
		$this->assertSame( 201, $created->get_status() );

		$listed = $this->request(
			'GET',
			array(
				'post'   => $this->page_id,
				'type'   => 'note',
				'status' => 'all',
			)
		);
		$this->assertSame( array( $created->get_data()['id'] ), array_column( $listed->get_data(), 'id' ) );
		$this->assertFalse( current_user_can( 'edit_posts' ) );
	}

	/**
	 * Viewers can't read or add notes (core requires edit rights).
	 */
	public function test_viewers_cannot_use_notes(): void {
		wp_set_current_user( self::factory()->user->create( array( 'role' => Roles::VIEWER ) ) );

		$listed  = $this->request(
			'GET',
			array(
				'post'   => $this->page_id,
				'type'   => 'note',
				'status' => 'all',
			)
		);
		$created = $this->request(
			'POST',
			array(
				'post'    => $this->page_id,
				'content' => 'Hello',
				'type'    => 'note',
			)
		);

		$this->assertGreaterThanOrEqual( 400, $listed->get_status() );
		$this->assertGreaterThanOrEqual( 400, $created->get_status() );
	}

	/**
	 * Sends a request to the comments route.
	 *
	 * @param string               $method HTTP method.
	 * @param array<string, mixed> $params Parameters.
	 */
	private function request( string $method, array $params ): WP_REST_Response {
		$request = new WP_REST_Request( $method, '/wp/v2/comments' );
		if ( 'GET' === $method ) {
			$request->set_query_params( $params );
		} else {
			$request->set_body_params( $params );
		}

		return rest_get_server()->dispatch( $request );
	}
}
