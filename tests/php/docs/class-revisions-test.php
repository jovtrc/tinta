<?php
/**
 * Tests for Revisions.
 *
 * @package Liber
 */

namespace Liber\Tests\Docs;

use Liber\Roles\Roles;
use WP_UnitTestCase;

/**
 * Continuous saves make one revision per author every few minutes.
 *
 * @covers \Liber\Docs\Revisions
 */
final class Revisions_Test extends WP_UnitTestCase {

	/**
	 * Page being edited.
	 *
	 * @var int
	 */
	private int $page_id;

	/**
	 * Signs in a member and creates a page with its first revision.
	 */
	public function set_up(): void {
		parent::set_up();

		wp_set_current_user( self::factory()->user->create( array( 'role' => Roles::MEMBER ) ) );
		$this->page_id = self::factory()->post->create(
			array(
				'post_type'   => 'liber_doc',
				'post_status' => 'private',
				'post_author' => get_current_user_id(),
			)
		);
		$this->edit( 'First draft' );
	}

	/**
	 * Saves within the interval don't add revisions.
	 */
	public function test_saves_by_the_same_author_share_a_revision(): void {
		$this->edit( 'Second draft' );
		$this->edit( 'Third draft' );

		$this->assertCount( 1, wp_get_post_revisions( $this->page_id ) );
	}

	/**
	 * A save after the interval adds a revision.
	 */
	public function test_saves_after_the_interval_add_a_revision(): void {
		$this->age_latest_revision( 11 * MINUTE_IN_SECONDS );

		$this->edit( 'Next day' );

		$this->assertCount( 2, wp_get_post_revisions( $this->page_id ) );
	}

	/**
	 * Another author's save adds a revision right away.
	 */
	public function test_another_author_adds_a_revision(): void {
		wp_set_current_user( self::factory()->user->create( array( 'role' => Roles::MEMBER ) ) );

		$this->edit( 'Reviewed' );

		$this->assertCount( 2, wp_get_post_revisions( $this->page_id ) );
	}

	/**
	 * Pages keep 10 revisions.
	 */
	public function test_pages_keep_ten_revisions(): void {
		$this->assertSame( 10, wp_revisions_to_keep( get_post( $this->page_id ) ) );
	}

	/**
	 * Updates the page content.
	 *
	 * @param string $text Paragraph text.
	 */
	private function edit( string $text ): void {
		wp_update_post(
			array(
				'ID'           => $this->page_id,
				'post_content' => "<!-- wp:paragraph --><p>{$text}</p><!-- /wp:paragraph -->",
			)
		);
	}

	/**
	 * Moves the latest revision back in time.
	 *
	 * @param int $seconds Age in seconds.
	 */
	private function age_latest_revision( int $seconds ): void {
		global $wpdb;

		$revision = current( wp_get_post_revisions( $this->page_id ) );
		$date     = gmdate( 'Y-m-d H:i:s', time() - $seconds );

		$wpdb->update( $wpdb->posts, array( 'post_date_gmt' => $date ), array( 'ID' => $revision->ID ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery -- Test setup.
		clean_post_cache( $revision->ID );
	}
}
