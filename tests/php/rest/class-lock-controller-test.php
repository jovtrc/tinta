<?php
/**
 * Tests for Lock_Controller.
 *
 * @package Liber
 */

namespace Liber\Tests\Rest;

use Liber\Roles\Roles;
use WP_REST_Request;
use WP_REST_Response;
use WP_UnitTestCase;

/**
 * Editors take a page's lock, see who holds it, and release it.
 *
 * @covers \Liber\Rest\Lock_Controller
 */
final class Lock_Controller_Test extends WP_UnitTestCase {

	/**
	 * A page.
	 *
	 * @var int
	 */
	private int $page_id;

	/**
	 * Creates the page and loads core's lock functions.
	 */
	public function set_up(): void {
		parent::set_up();

		require_once ABSPATH . 'wp-admin/includes/post.php';

		$this->page_id = self::factory()->post->create(
			array(
				'post_type'   => 'liber_doc',
				'post_status' => 'private',
			)
		);
	}

	/**
	 * A free page's lock goes to the member who opens it.
	 */
	public function test_members_take_a_free_lock(): void {
		$member = $this->sign_in( Roles::MEMBER );

		$data = $this->request( 'POST' )->get_data();

		$this->assertFalse( $data['isLocked'] );
		$this->assertStringEndsWith( ':' . $member, $data['activePostLock'] );
		$this->assertFalse( wp_check_post_lock( $this->page_id ) );
		$this->assertArrayHasKey( 'nonce', $data['postLockUtils'] );
	}

	/**
	 * Someone else's lock is reported, not taken.
	 */
	public function test_reports_who_holds_the_lock(): void {
		$maria = self::factory()->user->create(
			array(
				'role'         => Roles::MEMBER,
				'display_name' => 'Maria',
			)
		);
		wp_set_current_user( $maria );
		wp_set_post_lock( $this->page_id );
		$this->sign_in( Roles::MEMBER );

		$data = $this->request( 'POST' )->get_data();

		$this->assertTrue( $data['isLocked'] );
		$this->assertSame( 'Maria', $data['user']['name'] );
		$this->assertNull( $data['activePostLock'] );
	}

	/**
	 * Members release their own lock, not someone else's.
	 */
	public function test_members_release_only_their_own_lock(): void {
		$this->sign_in( Roles::MEMBER );
		$this->request( 'POST' );

		$this->assertTrue( $this->request( 'DELETE' )->get_data()['released'] );
		$this->assertSame( '', get_post_meta( $this->page_id, '_edit_lock', true ) );

		$this->request( 'POST' );
		$this->sign_in( Roles::MEMBER );

		$this->assertFalse( $this->request( 'DELETE' )->get_data()['released'] );
		$this->assertNotSame( '', get_post_meta( $this->page_id, '_edit_lock', true ) );
	}

	/**
	 * Viewers and visitors can't lock pages.
	 */
	public function test_viewers_and_visitors_are_refused(): void {
		$this->assertSame( 401, $this->request( 'POST' )->get_status() );

		$this->sign_in( Roles::VIEWER );

		$this->assertSame( 403, $this->request( 'POST' )->get_status() );
	}

	/**
	 * Other post types aren't pages.
	 */
	public function test_other_posts_are_not_found(): void {
		$this->sign_in( 'administrator' );
		$this->page_id = self::factory()->post->create();

		$this->assertSame( 404, $this->request( 'POST' )->get_status() );
	}

	/**
	 * Signs in a new user with the given role.
	 *
	 * @param string $role Role name.
	 * @return int User ID.
	 */
	private function sign_in( string $role ): int {
		$user_id = self::factory()->user->create( array( 'role' => $role ) );
		wp_set_current_user( $user_id );

		return $user_id;
	}

	/**
	 * Dispatches a request to the page's lock route.
	 *
	 * @param string $method HTTP method.
	 */
	private function request( string $method ): WP_REST_Response {
		return rest_get_server()->dispatch( new WP_REST_Request( $method, "/liber/v1/docs/{$this->page_id}/lock" ) );
	}
}
