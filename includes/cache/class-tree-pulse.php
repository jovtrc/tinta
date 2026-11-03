<?php
/**
 * Tree freshness over Heartbeat.
 *
 * @package Liber
 */

namespace Liber\Cache;

use Liber\Docs\Tree;
use Liber\Workspace\Screen;

defined( 'ABSPATH' ) || exit;

/**
 * Sends the tree generation on every Heartbeat tick, so open workspaces refetch
 * the tree only after someone changed it.
 */
final class Tree_Pulse {

	private const INTERVAL = 15;

	/**
	 * Sets the tree whose generation is sent.
	 *
	 * @param Tree $tree Page tree.
	 */
	public function __construct( private Tree $tree ) {}

	/**
	 * Hooks Heartbeat.
	 */
	public function register(): void {
		add_filter( 'heartbeat_received', array( $this, 'send_generation' ), 10, 2 );
		add_filter( 'heartbeat_settings', array( $this, 'set_interval' ) );
	}

	/**
	 * Adds the tree generation when the workspace asks for it.
	 *
	 * @param array<string, mixed> $response Heartbeat response.
	 * @param array<string, mixed> $data     Data the browser sent.
	 * @return array<string, mixed>
	 */
	public function send_generation( array $response, array $data ): array {
		if ( isset( $data['liber_tree'] ) && current_user_can( 'liber_access' ) ) {
			$response['liber_tree'] = $this->tree->generation();
		}

		return $response;
	}

	/**
	 * Ticks every 15 seconds on the workspace screen (WordPress slows it down in background tabs).
	 * Screens without admin screen functions, like the login page, are left alone.
	 *
	 * @param array<string, mixed> $settings Heartbeat settings.
	 * @return array<string, mixed>
	 */
	public function set_interval( array $settings ): array {
		$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;

		if ( 'toplevel_page_' . Screen::SLUG === $screen?->id ) {
			$settings['interval'] = self::INTERVAL;
		}

		return $settings;
	}
}
