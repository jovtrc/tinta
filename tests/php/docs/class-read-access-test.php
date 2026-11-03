<?php
/**
 * Tests for Read_Access.
 *
 * @package Liber
 */

namespace Liber\Tests\Docs;

use Liber\Roles\Roles;
use WP_UnitTestCase;

/**
 * Only Liber roles read pages, authors included.
 *
 * @covers \Liber\Docs\Read_Access
 */
final class Read_Access_Test extends WP_UnitTestCase {

	/**
	 * Someone who wrote a page and then lost their Liber role can't read it.
	 */
	public function test_authors_need_a_liber_role(): void {
		$author = self::factory()->user->create( array( 'role' => Roles::MEMBER ) );
		$page   = self::factory()->post->create(
			array(
				'post_type'   => 'liber_doc',
				'post_status' => 'private',
				'post_author' => $author,
			)
		);

		$this->assertTrue( user_can( $author, 'read_post', $page ) );

		( new \WP_User( $author ) )->set_role( 'author' );

		$this->assertFalse( user_can( $author, 'read_post', $page ) );
	}

	/**
	 * Being made a page's author doesn't let someone without a Liber role read it.
	 */
	public function test_authorship_alone_does_not_grant_reading(): void {
		$outsider = self::factory()->user->create( array( 'role' => 'subscriber' ) );
		$page     = self::factory()->post->create(
			array(
				'post_type'   => 'liber_doc',
				'post_status' => 'private',
				'post_author' => $outsider,
			)
		);
		$revision = wp_save_post_revision( $page );

		$this->assertFalse( user_can( $outsider, 'read_post', $page ) );
		if ( $revision ) {
			$this->assertFalse( user_can( $outsider, 'read_post', $revision ) );
		}
	}

	/**
	 * Viewers read every page; other posts are untouched.
	 */
	public function test_viewers_read_pages_and_other_posts_are_unchanged(): void {
		$viewer  = self::factory()->user->create( array( 'role' => Roles::VIEWER ) );
		$author  = self::factory()->user->create( array( 'role' => 'author' ) );
		$page    = self::factory()->post->create(
			array(
				'post_type'   => 'liber_doc',
				'post_status' => 'private',
			)
		);
		$private = self::factory()->post->create(
			array(
				'post_status' => 'private',
				'post_author' => $author,
			)
		);

		$this->assertTrue( user_can( $viewer, 'read_post', $page ) );
		$this->assertTrue( user_can( $author, 'read_post', $private ) );
	}
}
