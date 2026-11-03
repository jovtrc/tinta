<?php
/**
 * Tests for People_Controller.
 *
 * @package Tinta
 */

namespace Tinta\Tests\Rest;

use Tinta\Roles\Roles;
use WP_REST_Request;
use WP_UnitTestCase;

/**
 * Editors see who else can edit pages; nobody else sees the list.
 *
 * @covers \Tinta\Rest\People_Controller
 */
final class People_Controller_Test extends WP_UnitTestCase {

	/**
	 * Members see members and administrators, not viewers or other roles.
	 */
	public function test_lists_people_who_can_edit_pages(): void {
		$maria = $this->user( Roles::MEMBER, 'Maria' );
		$this->user( Roles::VIEWER, 'Vera' );
		$this->user( 'editor', 'Eddie' );
		wp_set_current_user( $maria );

		$response = rest_get_server()->dispatch( new WP_REST_Request( 'GET', '/tinta/v1/people' ) );
		$names    = array_column( $response->get_data(), 'name' );

		$this->assertContains( 'Maria', $names );
		$this->assertNotContains( 'Vera', $names );
		$this->assertNotContains( 'Eddie', $names );
	}

	/**
	 * Viewers can't read notes, so they don't get the list.
	 */
	public function test_viewers_are_refused(): void {
		wp_set_current_user( $this->user( Roles::VIEWER, 'Vera' ) );

		$response = rest_get_server()->dispatch( new WP_REST_Request( 'GET', '/tinta/v1/people' ) );

		$this->assertSame( 403, $response->get_status() );
	}

	/**
	 * Creates a user.
	 *
	 * @param string $role Role.
	 * @param string $name Display name.
	 */
	private function user( string $role, string $name ): int {
		return self::factory()->user->create(
			array(
				'role'         => $role,
				'display_name' => $name,
			)
		);
	}
}
