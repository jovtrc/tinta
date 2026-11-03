<?php
/**
 * Tests for Tree.
 *
 * @package Liber
 */

namespace Liber\Tests\Docs;

use Liber\Cache\Cache;
use Liber\Docs\Tree;
use WP_UnitTestCase;

/**
 * The tree lists private pages, is cached, and clears only when the tree changes.
 *
 * @covers \Liber\Docs\Tree
 * @covers \Liber\Cache\Cache
 */
final class Tree_Test extends WP_UnitTestCase {

	/**
	 * Reads the tree the plugin keeps up to date.
	 *
	 * @var Tree
	 */
	private Tree $tree;

	/**
	 * Creates the reader.
	 */
	public function set_up(): void {
		parent::set_up();

		$this->tree = new Tree( new Cache() );
	}

	/**
	 * Pages come in tree order with their icons; trashed pages are left out.
	 */
	public function test_lists_private_pages_in_order(): void {
		$second = $this->create_page( 'Roadmap', array( 'menu_order' => 1 ) );
		$first  = $this->create_page( 'Handbook' );
		$child  = $this->create_page( 'Onboarding', array( 'post_parent' => $first ) );
		$this->create_page( 'Old notes', array( 'post_status' => 'trash' ) );
		update_post_meta( $first, '_liber_icon', '📘' );

		$this->assertSame(
			array(
				$this->entry( $first, 0, 0, 'Handbook', '📘' ),
				$this->entry( $child, $first, 0, 'Onboarding', '' ),
				$this->entry( $second, 0, 1, 'Roadmap', '' ),
			),
			$this->tree->pages()
		);
		$this->assertSame( $first, $this->tree->first_page_id() );
	}

	/**
	 * The cached tree is served until a tree change clears it.
	 */
	public function test_serves_the_cached_tree_until_the_tree_changes(): void {
		global $wpdb;

		$page_id = $this->create_page( 'Handbook' );
		$this->tree->pages();

		$wpdb->update( $wpdb->posts, array( 'post_title' => 'Changed behind the cache' ), array( 'ID' => $page_id ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery -- Bypasses hooks on purpose.
		$this->assertSame( 'Handbook', $this->tree->pages()[0]['title'] );

		wp_update_post(
			array(
				'ID'         => $page_id,
				'post_title' => 'Team handbook',
			)
		);
		$this->assertSame( 'Team handbook', $this->tree->pages()[0]['title'] );
	}

	/**
	 * Tree changes bump the generation.
	 */
	public function test_tree_changes_bump_the_generation(): void {
		$page_id = $this->create_page( 'Handbook' );

		$this->assert_generation_bumps( fn() => $this->create_page( 'Roadmap' ) );
		$this->assert_generation_bumps(
			fn() => wp_update_post(
				array(
					'ID'         => $page_id,
					'menu_order' => 3,
				)
			)
		);
		$this->assert_generation_bumps( fn() => update_post_meta( $page_id, '_liber_icon', '🚀' ) );
		$this->assert_generation_bumps( fn() => wp_trash_post( $page_id ) );
		$this->assert_generation_bumps( fn() => wp_delete_post( $page_id, true ) );
	}

	/**
	 * Saving only the content leaves the tree alone.
	 */
	public function test_content_saves_keep_the_generation(): void {
		$page_id    = $this->create_page( 'Handbook' );
		$generation = $this->tree->generation();

		wp_update_post(
			array(
				'ID'           => $page_id,
				'post_content' => '<!-- wp:paragraph --><p>Hello</p><!-- /wp:paragraph -->',
			)
		);

		$this->assertSame( $generation, $this->tree->generation() );
	}

	/**
	 * Asserts that a change bumps the tree generation.
	 *
	 * @param callable $change Change to run.
	 */
	private function assert_generation_bumps( callable $change ): void {
		$before = $this->tree->generation();
		$change();
		$this->assertGreaterThan( $before, $this->tree->generation() );
	}

	/**
	 * Creates a private page.
	 *
	 * @param string               $title Title.
	 * @param array<string, mixed> $args  Extra post fields.
	 */
	private function create_page( string $title, array $args = array() ): int {
		return self::factory()->post->create(
			array_merge(
				array(
					'post_type'   => 'liber_doc',
					'post_status' => 'private',
					'post_title'  => $title,
				),
				$args
			)
		);
	}

	/**
	 * A tree entry.
	 *
	 * @param int    $id        Page ID.
	 * @param int    $parent_id Parent ID.
	 * @param int    $order     Sibling order.
	 * @param string $title     Title.
	 * @param string $icon      Emoji.
	 * @return array{id: int, parent: int, order: int, title: string, icon: string}
	 */
	private function entry( int $id, int $parent_id, int $order, string $title, string $icon ): array {
		return array(
			'id'     => $id,
			'parent' => $parent_id,
			'order'  => $order,
			'title'  => $title,
			'icon'   => $icon,
		);
	}
}
