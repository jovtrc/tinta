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
	 * On a single site, an invite creates the account with the role and sends
	 * core's new-user email; the login comes from the email.
	 */
	public function test_invites_someone_on_a_single_site(): void {
		if ( is_multisite() ) {
			$this->markTestSkipped( 'Single site only.' );
		}
		wp_set_current_user( $this->user( 'administrator', 'Admin' ) );
		$mailed = $this->record_mails();

		$response = $this->invite( 'Maria Souza', 'maria.souza@example.com', Roles::MEMBER );
		$maria    = get_user_by( 'email', 'maria.souza@example.com' );

		$this->assertSame( 201, $response->get_status() );
		$this->assertSame( array( Roles::MEMBER ), $maria->roles );
		$this->assertSame( 'Maria Souza', $maria->display_name );
		$this->assertSame( 'mariasouza', $maria->user_login );
		$this->assertContains( 'maria.souza@example.com', $mailed->getArrayCopy() );
	}

	/**
	 * Short or taken logins get a number.
	 */
	public function test_logins_get_a_number_when_needed(): void {
		if ( is_multisite() ) {
			$this->markTestSkipped( 'Single site only.' );
		}
		wp_set_current_user( $this->user( 'administrator', 'Admin' ) );

		$this->invite( 'Ana', 'ana@example.com', Roles::VIEWER );
		$this->invite( 'Ana Lima', 'ana@example.org', Roles::VIEWER );

		$this->assertSame( 'ana2', get_user_by( 'email', 'ana@example.com' )->user_login );
		$this->assertSame( 'ana3', get_user_by( 'email', 'ana@example.org' )->user_login );
	}

	/**
	 * On multisite, an invite is core's signup: the person joins this site
	 * with the role and the name when they activate.
	 */
	public function test_invites_through_signup_on_multisite(): void {
		global $wpdb;

		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Multisite only.' );
		}
		wp_set_current_user( $this->user( 'administrator', 'Admin' ) );
		grant_super_admin( get_current_user_id() );

		$response = $this->invite( 'Maria Souza', 'maria@example.com', Roles::MEMBER );

		$this->assertSame( 201, $response->get_status() );
		$this->assertFalse( get_user_by( 'email', 'maria@example.com' ) );

		$key    = $wpdb->get_var( $wpdb->prepare( "SELECT activation_key FROM {$wpdb->signups} WHERE user_email = %s", 'maria@example.com' ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
		$result = wpmu_activate_signup( (string) $key );
		$maria  = get_userdata( $result['user_id'] );

		$this->assertTrue( is_user_member_of_blog( $maria->ID ) );
		$this->assertSame( array( Roles::MEMBER ), $maria->roles );
		$this->assertSame( 'Maria Souza', $maria->display_name );
	}

	/**
	 * Site admins on a network that doesn't let them add users can't invite.
	 */
	public function test_follows_the_networks_add_users_switch(): void {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Multisite only.' );
		}
		update_site_option( 'add_new_users', 0 );
		wp_set_current_user( $this->user( 'administrator', 'Admin' ) );

		$this->assertSame( 403, $this->invite( 'Maria', 'maria@example.com', Roles::MEMBER )->get_status() );
	}

	/**
	 * Someone with an account is added from core's Users screen instead.
	 */
	public function test_refuses_an_email_in_use(): void {
		self::factory()->user->create( array( 'user_email' => 'bruno@example.com' ) );
		wp_set_current_user( $this->user( 'administrator', 'Admin' ) );
		grant_super_admin( get_current_user_id() );

		$response = $this->invite( 'Bruno', 'bruno@example.com', Roles::MEMBER );

		$this->assertSame( 409, $response->get_status() );
		$this->assertSame( 'tinta_person_exists', $response->get_data()['code'] );
	}

	/**
	 * Invites give Tinta's roles only, and only administrators send them.
	 */
	public function test_only_admins_invite_members_and_viewers(): void {
		wp_set_current_user( $this->user( 'administrator', 'Admin' ) );
		grant_super_admin( get_current_user_id() );
		$this->assertSame( 400, $this->invite( 'Eve', 'eve@example.com', 'administrator' )->get_status() );

		wp_set_current_user( $this->user( Roles::MEMBER, 'Maria' ) );
		$this->assertSame( 403, $this->invite( 'Eve', 'eve@example.com', Roles::VIEWER )->get_status() );
	}

	/**
	 * Sends an invite.
	 *
	 * @param string $name  Name.
	 * @param string $email Email.
	 * @param string $role  Role.
	 */
	private function invite( string $name, string $email, string $role ): \WP_REST_Response {
		$request = new WP_REST_Request( 'POST', '/tinta/v1/people' );
		$request->set_body_params(
			array(
				'name'  => $name,
				'email' => $email,
				'role'  => $role,
			)
		);

		return rest_get_server()->dispatch( $request );
	}

	/**
	 * Records who mails go to.
	 *
	 * @return \ArrayObject<int, string>
	 */
	private function record_mails(): \ArrayObject {
		$mailed = new \ArrayObject();
		add_filter(
			'wp_mail',
			static function ( array $mail ) use ( $mailed ): array {
				$mailed[] = (string) $mail['to'];
				return $mail;
			}
		);

		return $mailed;
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
