<?php
/**
 * Tests for Profile_Fields.
 *
 * @package Tinta
 */

namespace Tinta\Tests\Rest;

use Tinta\Rest\Profile_Fields;
use Tinta\Roles\Roles;
use WP_REST_Request;
use WP_REST_Response;
use WP_UnitTestCase;

/**
 * People change their color scheme and email from Settings → Profile, through
 * core's users endpoint.
 *
 * @covers \Tinta\Rest\Profile_Fields
 */
final class Profile_Fields_Test extends WP_UnitTestCase {

	/**
	 * Signed-in member.
	 *
	 * @var int
	 */
	private int $user_id;

	/**
	 * Recipients of the mails sent.
	 *
	 * @var string[]
	 */
	private array $mailed = array();

	/**
	 * Signs in a member, registers the color scheme meta (the test case
	 * unregisters meta after each test) and records mails.
	 */
	public function set_up(): void {
		parent::set_up();

		( new Profile_Fields() )->register_color_scheme();
		add_filter( 'wp_mail', array( $this, 'record_mail' ) );

		$this->user_id = self::factory()->user->create(
			array(
				'role'       => Roles::MEMBER,
				'user_email' => 'ana@example.com',
			)
		);
		wp_set_current_user( $this->user_id );
	}

	/**
	 * The color scheme is core's `admin_color` meta, cleaned like core does.
	 */
	public function test_saves_the_color_scheme(): void {
		$this->request( 'POST', '/wp/v2/users/me', array( 'meta' => array( 'admin_color' => 'Mid Night!' ) ) );

		$this->assertSame( 'midnight', get_user_meta( $this->user_id, 'admin_color', true ) );
		$this->assertSame( 'midnight', $this->me()['meta']['admin_color'] );
	}

	/**
	 * Other people don't see someone's color scheme.
	 */
	public function test_color_scheme_stays_private(): void {
		update_user_meta( $this->user_id, 'admin_color', 'ocean' );
		wp_set_current_user( self::factory()->user->create( array( 'role' => Roles::MEMBER ) ) );

		$data = $this->request( 'GET', '/wp/v2/users/' . $this->user_id )->get_data();

		$this->assertArrayNotHasKey( 'admin_color', (array) ( $data['meta'] ?? array() ) );
	}

	/**
	 * A new address waits for core's confirmation email; the old one stays.
	 */
	public function test_new_email_waits_for_confirmation(): void {
		$this->request( 'POST', '/wp/v2/users/me', array( 'tinta_email_change' => 'ana.souza@example.com' ) );

		$this->assertSame( 'ana@example.com', get_userdata( $this->user_id )->user_email );
		$this->assertSame( 'ana.souza@example.com', $this->me()['tinta_email_change'] );
		$this->assertSame( array( 'ana.souza@example.com' ), $this->mailed );
	}

	/**
	 * An empty value cancels the change waiting for confirmation.
	 */
	public function test_empty_value_cancels_the_change(): void {
		$this->request( 'POST', '/wp/v2/users/me', array( 'tinta_email_change' => 'ana.souza@example.com' ) );
		$this->request( 'POST', '/wp/v2/users/me', array( 'tinta_email_change' => '' ) );

		$this->assertNull( $this->me()['tinta_email_change'] );
		$this->assertSame( '', get_user_meta( $this->user_id, '_new_email', true ) );
	}

	/**
	 * An address someone else uses is refused, with core's message.
	 */
	public function test_refuses_an_address_in_use(): void {
		self::factory()->user->create( array( 'user_email' => 'bruno@example.com' ) );

		$response = $this->request( 'POST', '/wp/v2/users/me', array( 'tinta_email_change' => 'bruno@example.com' ) );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'tinta_email_change_invalid', $response->get_data()['code'] );
		$this->assertNull( $this->me()['tinta_email_change'] );
	}

	/**
	 * Nobody starts an email change for someone else, administrators included.
	 */
	public function test_only_changes_your_own_email(): void {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		grant_super_admin( get_current_user_id() );

		$response = $this->request( 'POST', '/wp/v2/users/' . $this->user_id, array( 'tinta_email_change' => 'x@example.com' ) );

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( '', get_user_meta( $this->user_id, '_new_email', true ) );
	}

	/**
	 * Records who a mail goes to.
	 *
	 * @param array<string, mixed> $mail Mail arguments.
	 * @return array<string, mixed>
	 */
	public function record_mail( array $mail ): array {
		$this->mailed[] = (string) $mail['to'];
		return $mail;
	}

	/**
	 * The signed-in user, in the edit context.
	 *
	 * @return array<string, mixed>
	 */
	private function me(): array {
		return $this->request( 'GET', '/wp/v2/users/me', array( 'context' => 'edit' ) )->get_data();
	}

	/**
	 * Sends a REST request.
	 *
	 * @param string               $method HTTP method.
	 * @param string               $route  Route.
	 * @param array<string, mixed> $params Parameters.
	 */
	private function request( string $method, string $route, array $params = array() ): WP_REST_Response {
		$request = new WP_REST_Request( $method, $route );
		if ( 'GET' === $method ) {
			$request->set_query_params( $params );
		} else {
			$request->set_body_params( $params );
		}

		return rest_do_request( $request );
	}
}
