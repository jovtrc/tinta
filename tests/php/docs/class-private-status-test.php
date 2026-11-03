<?php
/**
 * Tests for Private_Status.
 *
 * @package Tinta
 */

namespace Tinta\Tests\Docs;

use Tinta\Docs\Private_Status;
use WP_UnitTestCase;

/**
 * Pages are saved and titled as private; other posts are left alone.
 *
 * @covers \Tinta\Docs\Private_Status
 */
final class Private_Status_Test extends WP_UnitTestCase {

	/**
	 * Any status becomes private, except trash and auto-drafts.
	 *
	 * @dataProvider page_statuses
	 *
	 * @param string $asked Status asked for.
	 * @param string $saved Expected saved status.
	 */
	public function test_pages_are_saved_as_private( string $asked, string $saved ): void {
		$data = ( new Private_Status() )->force_private(
			array(
				'post_type'   => 'tinta_doc',
				'post_status' => $asked,
			)
		);

		$this->assertSame( $saved, $data['post_status'] );
	}

	/**
	 * Status asked for, and the status saved.
	 *
	 * @return array<string, array{string, string}>
	 */
	public function page_statuses(): array {
		return array(
			'draft'      => array( 'draft', 'private' ),
			'publish'    => array( 'publish', 'private' ),
			'pending'    => array( 'pending', 'private' ),
			'future'     => array( 'future', 'private' ),
			'private'    => array( 'private', 'private' ),
			'trash'      => array( 'trash', 'trash' ),
			'auto-draft' => array( 'auto-draft', 'auto-draft' ),
		);
	}

	/**
	 * Other post types keep their status.
	 */
	public function test_other_post_types_keep_their_status(): void {
		$post_id = self::factory()->post->create( array( 'post_status' => 'publish' ) );

		$this->assertSame( 'publish', get_post_status( $post_id ) );
	}

	/**
	 * Other titles keep core's "Private:" prefix.
	 */
	public function test_other_titles_keep_the_prefix(): void {
		$post_id = self::factory()->post->create(
			array(
				'post_status' => 'private',
				'post_title'  => 'Salaries',
			)
		);

		$this->assertSame( 'Private: Salaries', get_the_title( $post_id ) );
	}

	/**
	 * Other posts come back from the trash with core's status.
	 */
	public function test_other_posts_are_restored_with_core_status(): void {
		$post_id = self::factory()->post->create( array( 'post_status' => 'publish' ) );

		wp_trash_post( $post_id );
		wp_untrash_post( $post_id );

		$this->assertSame( 'draft', get_post_status( $post_id ) );
	}
}
