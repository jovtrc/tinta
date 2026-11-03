<?php
/**
 * Unit tests for Private_Status.
 *
 * @package Liber
 */

namespace Liber\Tests\Unit\Docs;

use Liber\Docs\Private_Status;
use Liber\Tests\Unit\Fixture;
use PHPUnit\Framework\Attributes\Before;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use WP_Post;

/**
 * Pages are saved, titled and restored as private; other posts are left alone.
 */
#[CoversClass( Private_Status::class )]
final class Private_Status_Test extends TestCase {

	/**
	 * Subject under test.
	 *
	 * @var Private_Status
	 */
	private Private_Status $private_status;

	/**
	 * Fresh subject and stub state.
	 */
	#[Before]
	public function create_subject(): void {
		Fixture::reset();
		$this->private_status = new Private_Status();
	}

	/**
	 * Status asked for, and the status saved.
	 *
	 * @return array<string, array{string, string}>
	 */
	public static function page_statuses(): array {
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
	 * Any status becomes private, except trash and auto-drafts.
	 *
	 * @param string $asked Status asked for.
	 * @param string $saved Expected saved status.
	 */
	#[DataProvider( 'page_statuses' )]
	public function test_pages_are_saved_as_private( string $asked, string $saved ): void {
		$data = $this->private_status->force_private(
			array(
				'post_type'   => 'liber_doc',
				'post_status' => $asked,
			)
		);

		$this->assertSame( $saved, $data['post_status'] );
	}

	/**
	 * Other post types keep the status they asked for.
	 */
	public function test_other_post_types_keep_their_status(): void {
		$data = $this->private_status->force_private(
			array(
				'post_type'   => 'post',
				'post_status' => 'publish',
			)
		);

		$this->assertSame( 'publish', $data['post_status'] );
	}

	/**
	 * Page titles show without "Private:".
	 */
	public function test_page_titles_have_no_private_prefix(): void {
		$page = new WP_Post( array( 'post_type' => 'liber_doc' ) );

		$this->assertSame( '%s', $this->private_status->drop_title_prefix( 'Private: %s', $page ) );
	}

	/**
	 * Other titles keep core's prefix.
	 */
	public function test_other_titles_keep_the_prefix(): void {
		$post = new WP_Post( array( 'post_type' => 'post' ) );

		$this->assertSame( 'Private: %s', $this->private_status->drop_title_prefix( 'Private: %s', $post ) );
	}

	/**
	 * Pages come back from the trash as private.
	 */
	public function test_pages_are_restored_as_private(): void {
		Fixture::$post_types[7] = 'liber_doc';

		$this->assertSame( 'private', $this->private_status->restore_as_private( 'draft', 7 ) );
	}

	/**
	 * Other posts come back with core's status.
	 */
	public function test_other_posts_are_restored_with_core_status(): void {
		Fixture::$post_types[8] = 'post';

		$this->assertSame( 'draft', $this->private_status->restore_as_private( 'draft', 8 ) );
	}
}
