<?php
/**
 * Tests for Restore_Controller.
 *
 * @package Tinta
 */

namespace Tinta\Tests\Rest;

use Tinta\Roles\Roles;
use WP_REST_Request;
use WP_REST_Response;
use WP_UnitTestCase;

/**
 * `POST tinta/v1/docs/{id}/restore` brings a trashed page back.
 *
 * @covers \Tinta\Rest\Restore_Controller
 */
final class Restore_Controller_Test extends WP_UnitTestCase {

	/**
	 * A trashed page.
	 *
	 * @var int
	 */
	private int $page_id;

	/**
	 * Creates and trashes the page.
	 */
	public function set_up(): void {
		parent::set_up();

		$this->page_id = self::factory()->post->create(
			array(
				'post_type'   => 'tinta_doc',
				'post_status' => 'private',
			)
		);
		wp_trash_post( $this->page_id );
	}

	/**
	 * Members restore pages as private.
	 */
	public function test_members_restore_pages(): void {
		wp_set_current_user( self::factory()->user->create( array( 'role' => Roles::MEMBER ) ) );

		$response = $this->restore();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'private', $response->get_data()['status'] );
	}

	/**
	 * Viewers can't restore.
	 */
	public function test_viewers_are_refused(): void {
		wp_set_current_user( self::factory()->user->create( array( 'role' => Roles::VIEWER ) ) );

		$this->assertSame( 403, $this->restore()->get_status() );
	}

	/**
	 * Pages not in the trash aren't found.
	 */
	public function test_pages_outside_the_trash_are_not_found(): void {
		wp_set_current_user( self::factory()->user->create( array( 'role' => Roles::MEMBER ) ) );
		wp_untrash_post( $this->page_id );

		$this->assertSame( 404, $this->restore()->get_status() );
	}

	/**
	 * Sends the restore request.
	 */
	private function restore(): WP_REST_Response {
		return rest_get_server()->dispatch( new WP_REST_Request( 'POST', "/tinta/v1/docs/{$this->page_id}/restore" ) );
	}
}
