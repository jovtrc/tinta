<?php
/**
 * Tests for User_Prefs_Field.
 *
 * @package Tinta
 */

namespace Tinta\Tests\Rest;

use Tinta\Roles\Roles;
use WP_REST_Request;
use WP_REST_Response;
use WP_UnitTestCase;

/**
 * Users keep their own workspace preferences, per site.
 *
 * @covers \Tinta\Rest\User_Prefs_Field
 */
final class User_Prefs_Field_Test extends WP_UnitTestCase {

	/**
	 * Signed-in viewer.
	 *
	 * @var int
	 */
	private int $user_id;

	/**
	 * Signs in a viewer: preferences need no editing rights.
	 */
	public function set_up(): void {
		parent::set_up();

		$this->user_id = self::factory()->user->create( array( 'role' => Roles::VIEWER ) );
		wp_set_current_user( $this->user_id );
	}

	/**
	 * Lists sent are saved, the others kept; values are cleaned.
	 */
	public function test_saves_the_lists_sent(): void {
		$this->update( array( 'pinned' => array( 4, 7 ) ) );
		$this->update( array( 'recent' => array( 9, 9, 8, 0 ) ) );

		$prefs = $this->request( 'GET', '/wp/v2/users/me' )->get_data()['tinta_prefs'];

		$this->assertSame( array( 4, 7 ), $prefs['pinned'] );
		$this->assertSame( array( 9, 8 ), $prefs['recent'] );
		$this->assertSame( array(), $prefs['emojis'] );
	}

	/**
	 * Nobody reads or changes someone else's preferences.
	 */
	public function test_other_users_preferences_stay_private(): void {
		$this->update( array( 'pinned' => array( 4 ) ) );
		$admin = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin );

		$read = $this->request( 'GET', "/wp/v2/users/{$this->user_id}" )->get_data();
		$this->assertNull( $read['tinta_prefs'] ?? null );

		$write = $this->request( 'POST', "/wp/v2/users/{$this->user_id}", array( 'tinta_prefs' => array( 'pinned' => array( 1 ) ) ) );
		$this->assertSame( 403, $write->get_status() );
	}

	/**
	 * Each site of a network keeps its own preferences.
	 */
	public function test_each_site_keeps_its_own(): void {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Multisite only.' );
		}

		$this->update( array( 'pinned' => array( 4 ) ) );
		switch_to_blog( self::factory()->blog->create() ); // phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.switch_to_blog_switch_to_blog -- Reads another site's option.

		$this->assertSame( array(), \Tinta\Rest\User_Prefs_Field::read( $this->user_id )['pinned'] );

		restore_current_blog();
	}

	/**
	 * Updates the current user's preferences.
	 *
	 * @param array<string, int[]> $prefs Lists to save.
	 */
	private function update( array $prefs ): void {
		$response = $this->request( 'POST', '/wp/v2/users/me', array( 'tinta_prefs' => $prefs ) );

		$this->assertSame( 200, $response->get_status() );
	}

	/**
	 * Dispatches a REST request in the edit context.
	 *
	 * @param string               $method HTTP method.
	 * @param string               $route  Route.
	 * @param array<string, mixed> $body   Body parameters.
	 */
	private function request( string $method, string $route, array $body = array() ): WP_REST_Response {
		$request = new WP_REST_Request( $method, $route );
		$request->set_query_params( array( 'context' => 'edit' ) );
		$request->set_body_params( $body );

		return rest_get_server()->dispatch( $request );
	}
}
