<?php
/**
 * Tests for Tree_Controller.
 *
 * @package Liber
 */

namespace Liber\Tests\Rest;

use Liber\Roles\Roles;
use WP_REST_Request;
use WP_UnitTestCase;

/**
 * `GET liber/v1/tree` serves workspace users only.
 *
 * @covers \Liber\Rest\Tree_Controller
 */
final class Tree_Controller_Test extends WP_UnitTestCase {

	/**
	 * Creates a page.
	 */
	public function set_up(): void {
		parent::set_up();

		self::factory()->post->create(
			array(
				'post_type'   => 'liber_doc',
				'post_status' => 'private',
				'post_title'  => 'Handbook',
			)
		);
	}

	/**
	 * Workspace roles get the tree.
	 *
	 * @dataProvider workspace_roles
	 *
	 * @param string $role Role name.
	 */
	public function test_workspace_roles_get_the_tree( string $role ): void {
		wp_set_current_user( self::factory()->user->create( array( 'role' => $role ) ) );

		$response = rest_get_server()->dispatch( new WP_REST_Request( 'GET', '/liber/v1/tree' ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'Handbook', $response->get_data()['pages'][0]['title'] );
		$this->assertIsInt( $response->get_data()['generation'] );
	}

	/**
	 * Roles that belong to the workspace.
	 *
	 * @return array<string, array{string}>
	 */
	public function workspace_roles(): array {
		return array(
			'administrator' => array( 'administrator' ),
			'member'        => array( Roles::MEMBER ),
			'viewer'        => array( Roles::VIEWER ),
		);
	}

	/**
	 * Visitors and other roles are refused.
	 *
	 * @dataProvider refused_users
	 *
	 * @param string $role   Role name, or empty for a visitor.
	 * @param int    $status Expected status.
	 */
	public function test_others_are_refused( string $role, int $status ): void {
		wp_set_current_user( $role ? self::factory()->user->create( array( 'role' => $role ) ) : 0 );

		$response = rest_get_server()->dispatch( new WP_REST_Request( 'GET', '/liber/v1/tree' ) );

		$this->assertSame( $status, $response->get_status() );
	}

	/**
	 * Users without workspace access, and the status they get.
	 *
	 * @return array<string, array{string, int}>
	 */
	public function refused_users(): array {
		return array(
			'visitor'    => array( '', 401 ),
			'editor'     => array( 'editor', 403 ),
			'subscriber' => array( 'subscriber', 403 ),
		);
	}
}
