<?php
/**
 * Tests for Last_Editor.
 *
 * @package Liber
 */

namespace Liber\Tests\Docs;

use Liber\Roles\Roles;
use WP_REST_Request;
use WP_UnitTestCase;

/**
 * `last_editor` names the author, then whoever last changed the title or content.
 *
 * @covers \Liber\Docs\Last_Editor
 */
final class Last_Editor_Test extends WP_UnitTestCase {

	/**
	 * The author is the last editor until someone changes the title, content or icon; order doesn't count.
	 */
	public function test_names_who_last_edited_the_page(): void {
		$maria   = $this->member( 'Maria' );
		$ana     = $this->member( 'Ana' );
		$page_id = self::factory()->post->create(
			array(
				'post_type'   => 'liber_doc',
				'post_status' => 'private',
				'post_author' => $maria,
			)
		);
		wp_set_current_user( $ana );

		$this->assertSame( 'Maria', $this->last_editor( $page_id )['name'] );

		wp_update_post(
			array(
				'ID'         => $page_id,
				'menu_order' => 3,
			)
		);
		$this->assertSame( 'Maria', $this->last_editor( $page_id )['name'] );

		wp_update_post(
			array(
				'ID'         => $page_id,
				'post_title' => 'Handbook',
			)
		);
		$this->assertSame( 'Ana', $this->last_editor( $page_id )['name'] );

		wp_set_current_user( $maria );
		update_post_meta( $page_id, '_liber_icon', '🚀' );
		$this->assertSame( 'Maria', $this->last_editor( $page_id )['name'] );
	}

	/**
	 * Creates a member with a display name.
	 *
	 * @param string $name Display name.
	 */
	private function member( string $name ): int {
		return self::factory()->user->create(
			array(
				'role'         => Roles::MEMBER,
				'display_name' => $name,
			)
		);
	}

	/**
	 * Reads the field through the REST API.
	 *
	 * @param int $page_id Page ID.
	 * @return array{id: int, name: string}
	 */
	private function last_editor( int $page_id ): array {
		$response = rest_get_server()->dispatch( new WP_REST_Request( 'GET', "/wp/v2/liber-docs/{$page_id}" ) );

		return $response->get_data()['last_editor'];
	}
}
