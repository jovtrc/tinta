<?php
/**
 * Tests for Subtree_Trash.
 *
 * @package Liber
 */

namespace Liber\Tests\Docs;

use Liber\Roles\Roles;
use WP_UnitTestCase;

/**
 * Pages go to the trash, come back and get deleted with their subpages.
 *
 * @covers \Liber\Docs\Subtree_Trash
 */
final class Subtree_Trash_Test extends WP_UnitTestCase {

	/**
	 * Handbook > Onboarding > Local setup.
	 *
	 * @var array{handbook: int, onboarding: int, setup: int}
	 */
	private array $pages;

	/**
	 * Signs in an administrator and builds a three-level subtree.
	 */
	public function set_up(): void {
		parent::set_up();

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );

		$handbook    = $this->create_page();
		$onboarding  = $this->create_page( $handbook );
		$this->pages = array(
			'handbook'   => $handbook,
			'onboarding' => $onboarding,
			'setup'      => $this->create_page( $onboarding ),
		);
	}

	/**
	 * Trashing a page trashes every subpage, marked with the page trashed.
	 */
	public function test_trashing_a_page_trashes_its_subtree(): void {
		wp_trash_post( $this->pages['handbook'] );

		foreach ( $this->pages as $page_id ) {
			$this->assertSame( 'trash', get_post_status( $page_id ) );
		}
		$this->assertSame( (string) $this->pages['handbook'], get_post_meta( $this->pages['setup'], '_liber_trashed_with', true ) );
	}

	/**
	 * Restoring the page brings the subtree back in place, as private.
	 */
	public function test_restoring_a_page_restores_its_subtree(): void {
		wp_trash_post( $this->pages['handbook'] );
		wp_untrash_post( $this->pages['handbook'] );

		foreach ( $this->pages as $page_id ) {
			$this->assertSame( 'private', get_post_status( $page_id ) );
			$this->assertSame( '', get_post_meta( $page_id, '_liber_trashed_with', true ) );
		}
		$this->assertSame( $this->pages['onboarding'], wp_get_post_parent_id( $this->pages['setup'] ) );
	}

	/**
	 * A subpage trashed on its own before stays in the trash.
	 */
	public function test_subpages_trashed_earlier_stay_in_the_trash(): void {
		wp_trash_post( $this->pages['setup'] );
		wp_trash_post( $this->pages['handbook'] );
		wp_untrash_post( $this->pages['handbook'] );

		$this->assertSame( 'private', get_post_status( $this->pages['onboarding'] ) );
		$this->assertSame( 'trash', get_post_status( $this->pages['setup'] ) );
	}

	/**
	 * A subpage restored on its own, while its parent stays in the trash, goes to the top level.
	 */
	public function test_restoring_a_subpage_alone_moves_it_to_the_top(): void {
		wp_trash_post( $this->pages['handbook'] );
		wp_untrash_post( $this->pages['onboarding'] );

		$this->assertSame( 'private', get_post_status( $this->pages['onboarding'] ) );
		$this->assertSame( 0, wp_get_post_parent_id( $this->pages['onboarding'] ) );
	}

	/**
	 * Deleting a trashed page deletes the subpages trashed with it.
	 */
	public function test_deleting_a_page_deletes_its_subtree(): void {
		wp_trash_post( $this->pages['handbook'] );
		wp_delete_post( $this->pages['handbook'], true );

		foreach ( $this->pages as $page_id ) {
			$this->assertNull( get_post( $page_id ) );
		}
	}

	/**
	 * Members trash pages but can't delete them for good; requests without a user can.
	 */
	public function test_only_administrators_delete_for_good(): void {
		wp_set_current_user( self::factory()->user->create( array( 'role' => Roles::MEMBER ) ) );
		wp_trash_post( $this->pages['setup'] );

		$this->assertFalse( wp_delete_post( $this->pages['setup'], true ) );
		$this->assertSame( 'trash', get_post_status( $this->pages['setup'] ) );

		wp_set_current_user( 0 );

		$this->assertNotFalse( wp_delete_post( $this->pages['setup'], true ) );
	}

	/**
	 * A plugin that stops one subpage from going to the trash doesn't keep
	 * trashing going forever; that subpage just stays.
	 */
	public function test_a_vetoed_subpage_stays_without_looping(): void {
		$veto = fn( $trash, \WP_Post $post ) => $post->ID === $this->pages['onboarding'] ? false : $trash;
		add_filter( 'pre_trash_post', $veto, 10, 2 );

		wp_trash_post( $this->pages['handbook'] );

		remove_filter( 'pre_trash_post', $veto );
		$this->assertSame( 'trash', get_post_status( $this->pages['handbook'] ) );
		$this->assertSame( 'private', get_post_status( $this->pages['onboarding'] ) );
	}

	/**
	 * Creates a private page.
	 *
	 * @param int $parent_id Parent page ID.
	 */
	private function create_page( int $parent_id = 0 ): int {
		return self::factory()->post->create(
			array(
				'post_type'   => 'liber_doc',
				'post_status' => 'private',
				'post_parent' => $parent_id,
			)
		);
	}
}
