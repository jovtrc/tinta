<?php
/**
 * Tests for Other_Roles.
 *
 * @package Tinta
 */

namespace Tinta\Tests\Docs;

use Tinta\Roles\Roles;
use WP_Query;
use WP_REST_Request;
use WP_UnitTestCase;

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Applies core filters, as core does.

/**
 * People without a Tinta role don't see pages' files or notes in listings.
 *
 * @covers \Tinta\Docs\Other_Roles
 */
final class Other_Roles_Test extends WP_UnitTestCase {

	/**
	 * A page.
	 *
	 * @var int
	 */
	private int $page;

	/**
	 * Creates a page with a file and a note, and a post with a file.
	 */
	public function set_up(): void {
		parent::set_up();

		$this->page = self::factory()->post->create(
			array(
				'post_type'   => 'tinta_doc',
				'post_status' => 'private',
			)
		);
		self::factory()->attachment->create(
			array(
				'post_parent' => $this->page,
				'post_title'  => 'Page file',
			) 
		);
		self::factory()->attachment->create(
			array(
				'post_parent' => self::factory()->post->create(),
				'post_title'  => 'Post file',
			) 
		);
		self::factory()->comment->create(
			array(
				'comment_post_ID'  => $this->page,
				'comment_type'     => 'note',
				'comment_approved' => '0',
				'comment_content'  => 'The launch date is secret.',
			)
		);
	}

	/**
	 * The media library leaves out pages' files for Authors, not for Members.
	 */
	public function test_media_library_hides_page_files_from_other_roles(): void {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'author' ) ) );
		$this->assertSame( array( 'Post file' ), $this->media_titles() );

		wp_set_current_user( self::factory()->user->create( array( 'role' => Roles::MEMBER ) ) );
		$this->assertEqualsCanonicalizing( array( 'Page file', 'Post file' ), $this->media_titles() );
	}

	/**
	 * Searching notes as an Editor finds nothing, not even a count.
	 */
	public function test_note_searches_ignore_pages_for_other_roles(): void {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		$request = new WP_REST_Request( 'GET', '/wp/v2/comments' );
		$request->set_query_params(
			array(
				'type'     => 'note',
				'status'   => 'all',
				'search'   => 'secret',
				'per_page' => 1,
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( array(), $response->get_data() );
		$this->assertSame( 0, (int) $response->get_headers()['X-WP-Total'] );
	}

	/**
	 * Titles the media modal would list.
	 *
	 * @return string[]
	 */
	private function media_titles(): array {
		$args  = apply_filters(
			'ajax_query_attachments_args',
			array(
				'post_type'   => 'attachment',
				'post_status' => 'inherit',
			)
		);
		$query = new WP_Query( $args );

		return wp_list_pluck( $query->posts, 'post_title' );
	}
}
