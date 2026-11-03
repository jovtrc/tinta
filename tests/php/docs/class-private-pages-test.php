<?php
/**
 * Tests: pages stay private, and only workspace roles read them.
 *
 * @package Liber
 */

namespace Liber\Tests\Docs;

use Liber\Roles\Roles;
use WP_REST_Request;
use WP_REST_Response;
use WP_UnitTestCase;

/**
 * Pages through the REST API and core functions, for every kind of user.
 *
 * @covers \Liber\Docs\Private_Status
 * @covers \Liber\Docs\Post_Type
 * @covers \Liber\Roles\Roles
 */
final class Private_Pages_Test extends WP_UnitTestCase {

	/**
	 * A page titled "Handbook".
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
				'post_type'   => 'liber_doc',
				'post_status' => 'private',
				'post_title'  => 'Handbook',
			)
		);
	}

	/**
	 * Members create pages as private, whatever status they ask for.
	 *
	 * @dataProvider asked_statuses
	 *
	 * @param string|null $status Status sent, or none.
	 */
	public function test_members_create_private_pages( ?string $status ): void {
		$this->sign_in( Roles::MEMBER );

		$body = array_filter(
			array(
				'title'  => 'Roadmap',
				'status' => $status,
			)
		);

		$response = $this->request( 'POST', '/wp/v2/liber-docs', $body );

		$this->assertSame( 201, $response->get_status() );
		$this->assertSame( 'private', $response->get_data()['status'] );
	}

	/**
	 * Statuses a client may send.
	 *
	 * @return array<string, array{string|null}>
	 */
	public function asked_statuses(): array {
		return array(
			'none'    => array( null ),
			'draft'   => array( 'draft' ),
			'publish' => array( 'publish' ),
			'private' => array( 'private' ),
		);
	}

	/**
	 * Logged-out visitors can't read a page.
	 */
	public function test_visitors_cannot_read_pages(): void {
		$response = $this->request( 'GET', '/wp/v2/liber-docs/' . $this->page_id );

		$this->assertSame( 401, $response->get_status() );
	}

	/**
	 * Logged-out visitors get an empty list.
	 */
	public function test_visitors_get_no_pages_in_lists(): void {
		$response = $this->request( 'GET', '/wp/v2/liber-docs' );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array(), $response->get_data() );
	}

	/**
	 * Workspace roles read pages.
	 *
	 * @dataProvider workspace_roles
	 *
	 * @param string $role Role name.
	 */
	public function test_workspace_roles_read_pages( string $role ): void {
		$this->sign_in( $role );

		$response = $this->request( 'GET', '/wp/v2/liber-docs/' . $this->page_id );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'Handbook', $response->get_data()['title']['rendered'] );
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
	 * Other roles can't read pages, even ones that read private posts.
	 *
	 * @dataProvider other_roles
	 *
	 * @param string $role Role name.
	 */
	public function test_other_roles_cannot_read_pages( string $role ): void {
		$this->sign_in( $role );

		$response = $this->request( 'GET', '/wp/v2/liber-docs/' . $this->page_id );

		$this->assertSame( 403, $response->get_status() );
	}

	/**
	 * Core roles with no workspace access.
	 *
	 * @return array<string, array{string}>
	 */
	public function other_roles(): array {
		return array(
			'editor'      => array( 'editor' ),
			'author'      => array( 'author' ),
			'contributor' => array( 'contributor' ),
			'subscriber'  => array( 'subscriber' ),
		);
	}

	/**
	 * Viewers can't create pages.
	 */
	public function test_viewers_cannot_create_pages(): void {
		$this->sign_in( Roles::VIEWER );

		$response = $this->request( 'POST', '/wp/v2/liber-docs', array( 'title' => 'Roadmap' ) );

		$this->assertSame( 403, $response->get_status() );
	}

	/**
	 * A page restored from the trash is private again.
	 */
	public function test_restored_pages_are_private(): void {
		wp_trash_post( $this->page_id );
		wp_untrash_post( $this->page_id );

		$this->assertSame( 'private', get_post_status( $this->page_id ) );
	}

	/**
	 * Titles show without "Private:".
	 */
	public function test_titles_have_no_private_prefix(): void {
		$this->assertSame( 'Handbook', get_the_title( $this->page_id ) );
	}

	/**
	 * Signs in a new user with the given role.
	 *
	 * @param string $role Role name.
	 */
	private function sign_in( string $role ): void {
		wp_set_current_user( self::factory()->user->create( array( 'role' => $role ) ) );
	}

	/**
	 * Dispatches a REST request.
	 *
	 * @param string               $method HTTP method.
	 * @param string               $route  Route.
	 * @param array<string, mixed> $params Body parameters.
	 * @return WP_REST_Response
	 */
	private function request( string $method, string $route, array $params = array() ): WP_REST_Response {
		$request = new WP_REST_Request( $method, $route );
		$request->set_body_params( $params );

		return rest_get_server()->dispatch( $request );
	}
}
