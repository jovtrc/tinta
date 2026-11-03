<?php
/**
 * The workspace admin screen.
 *
 * @package Liber
 */

namespace Liber\Workspace;

use Liber\Docs\Post_Type;
use Liber\Docs\Tree;
use WP_Block_Editor_Context;
use WP_Post;

defined( 'ABSPATH' ) || exit;

/**
 * One admin screen with the page tree and the block editor (`admin.php?page=liber&doc=ID`).
 * Opening another page swaps the editor in place, without a reload.
 */
final class Screen {

	public const SLUG = 'liber';

	private const HANDLE = 'liber-workspace';

	/**
	 * Sets the tree used to pick the first page.
	 *
	 * @param Tree $tree Page tree.
	 */
	public function __construct( private Tree $tree ) {}

	/**
	 * Hooks the menu item, edit and preview links, and redirects from core's page screens.
	 */
	public function register(): void {
		add_action( 'admin_menu', array( $this, 'add_menu_page' ) );
		add_filter( 'get_edit_post_link', array( $this, 'edit_link' ), 10, 3 );
		add_filter( 'preview_post_link', array( $this, 'preview_link' ), 10, 2 );

		foreach ( array( 'edit.php', 'post.php', 'post-new.php' ) as $core_screen ) {
			add_action( "load-{$core_screen}", array( $this, 'leave_core_screen' ) );
		}
	}

	/**
	 * URL of the workspace, opened on a page.
	 *
	 * @param int $page_id Page ID, or 0 for the first page.
	 */
	public static function url( int $page_id = 0 ): string {
		$url = admin_url( 'admin.php?page=' . self::SLUG );

		return $page_id ? add_query_arg( 'doc', $page_id, $url ) : $url;
	}

	/**
	 * Adds the "Workspace" menu item.
	 */
	public function add_menu_page(): void {
		$hook = add_menu_page(
			__( 'Workspace', 'liber' ),
			__( 'Workspace', 'liber' ),
			'liber_access',
			self::SLUG,
			array( $this, 'render' ),
			'dashicons-book-alt',
			3
		);

		add_action( "load-{$hook}", array( $this, 'load' ) );
	}

	/**
	 * Marks the screen as a block editor, like core's post editor.
	 */
	public function load(): void {
		get_current_screen()?->is_block_editor( true );
		wp_set_up_cross_origin_isolation();

		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue' ) );
		add_filter( 'admin_body_class', array( $this, 'body_class' ) );
	}

	/**
	 * Loads the editor, its settings and the workspace app.
	 */
	public function enqueue(): void {
		$page    = $this->opened_page();
		$context = new WP_Block_Editor_Context(
			array(
				'name' => 'liber/workspace',
				'post' => $page,
			)
		);

		block_editor_rest_api_preload( $this->preload_paths( $page ), $context );

		wp_enqueue_script( 'heartbeat' );
		wp_enqueue_media();
		wp_add_inline_script(
			'wp-blocks',
			sprintf( 'wp.blocks.setCategories( %s );', wp_json_encode( get_block_categories( $context ) ) ),
			'after'
		);

		do_action( 'enqueue_block_editor_assets' ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Core hook, fired like core's editor does.

		$asset = require plugin_dir_path( LIBER_FILE ) . 'build/workspace.asset.php';

		wp_enqueue_script( self::HANDLE, plugins_url( 'build/workspace.js', LIBER_FILE ), $asset['dependencies'], $asset['version'], true );
		wp_enqueue_style( self::HANDLE, plugins_url( 'build/workspace.css', LIBER_FILE ), array( 'wp-components', 'wp-block-editor', 'wp-editor', 'wp-format-library', 'wp-commands', 'wp-block-library' ), $asset['version'] );
		wp_set_script_translations( self::HANDLE, 'liber' );
		wp_add_inline_script(
			self::HANDLE,
			'window.liberWorkspace = ' . wp_json_encode( $this->app_data( $page, $context ) ) . ';',
			'before'
		);
	}

	/**
	 * Prints the app's mount point. The `block-editor` class keeps core's editor CSS from hiding it.
	 */
	public function render(): void {
		echo '<div id="liber-workspace" class="liber-workspace block-editor"></div>';
	}

	/**
	 * Adds a body class for the workspace layout.
	 *
	 * @param string $classes Admin body classes.
	 */
	public function body_class( string $classes ): string {
		return $classes . ' liber-workspace-screen';
	}

	/**
	 * Points page edit links at the workspace.
	 *
	 * @param string|null $link    Edit link.
	 * @param int         $post_id Post ID.
	 * @param string      $context "display" to escape the link for HTML.
	 */
	public function edit_link( ?string $link, int $post_id, string $context ): ?string {
		if ( Post_Type::NAME !== get_post_type( $post_id ) ) {
			return $link;
		}

		$url = self::url( $post_id );

		return 'display' === $context ? esc_url( $url ) : $url;
	}

	/**
	 * Points page previews (like the lock dialog's) at the workspace: pages have no public URL.
	 *
	 * @param string  $link Preview link.
	 * @param WP_Post $post Previewed post.
	 */
	public function preview_link( string $link, WP_Post $post ): string {
		return Post_Type::NAME === $post->post_type ? self::url( $post->ID ) : $link;
	}

	/**
	 * Sends core's page list and page editor to the workspace.
	 */
	public function leave_core_screen(): void {
		global $pagenow;

		$url = self::core_screen_redirect( (string) $pagenow, wp_unslash( $_GET ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only navigation.

		if ( $url ) {
			wp_safe_redirect( $url );
			exit;
		}
	}

	/**
	 * Where a core screen for pages should go instead, if anywhere.
	 * Core's lock take-over (`post.php?get-post-lock=1`) stays: core redirects back here after it.
	 *
	 * @param string               $core_screen Core admin file, like "post.php".
	 * @param array<string, mixed> $query       Query arguments.
	 */
	public static function core_screen_redirect( string $core_screen, array $query ): ?string {
		if ( 'post.php' === $core_screen ) {
			$page_id = absint( $query['post'] ?? 0 );
			$is_edit = 'edit' === ( $query['action'] ?? '' ) && empty( $query['get-post-lock'] );

			return $is_edit && Post_Type::NAME === get_post_type( $page_id ) ? self::url( $page_id ) : null;
		}

		return Post_Type::NAME === ( $query['post_type'] ?? '' ) ? self::url() : null;
	}

	/**
	 * The page in `?doc=`, if the user may read it; otherwise the first page.
	 */
	private function opened_page(): ?WP_Post {
		$page_id = isset( $_GET['doc'] ) ? absint( $_GET['doc'] ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only navigation.
		$page    = $page_id ? get_post( $page_id ) : null;

		if ( $page && Post_Type::NAME === $page->post_type && current_user_can( 'read_post', $page->ID ) ) {
			return $page;
		}

		return get_post( $this->tree->first_page_id() );
	}

	/**
	 * REST responses the app needs first, printed into the page.
	 *
	 * @param WP_Post|null $page Opened page.
	 * @return array<int, string|string[]>
	 */
	private function preload_paths( ?WP_Post $page ): array {
		$paths = array(
			'/wp/v2/types?context=view',
			'/wp/v2/types/' . Post_Type::NAME . '?context=edit',
			'/wp/v2/users/me',
			'/liber/v1/tree',
		);

		if ( $page ) {
			$paths[] = '/wp/v2/liber-docs/' . $page->ID . '?context=edit';
			$paths[] = array( '/wp/v2/liber-docs/' . $page->ID, 'OPTIONS' );
		}

		return $paths;
	}

	/**
	 * Data the app reads from `window.liberWorkspace`.
	 *
	 * @param WP_Post|null            $page    Opened page.
	 * @param WP_Block_Editor_Context $context Editor context.
	 * @return array<string, mixed>
	 */
	private function app_data( ?WP_Post $page, WP_Block_Editor_Context $context ): array {
		return array(
			'pageId'    => $page ? $page->ID : 0,
			'url'       => self::url(),
			'siteName'  => get_bloginfo( 'name' ),
			'canCreate' => current_user_can( 'edit_liber_docs' ),
			'canManage' => current_user_can( 'liber_manage' ),
			'settings'  => get_block_editor_settings(
				array(
					'titlePlaceholder' => __( 'Untitled', 'liber' ),
					'bodyPlaceholder'  => __( 'Type / for commands', 'liber' ),
					'autosaveInterval' => AUTOSAVE_INTERVAL,
				),
				$context
			),
		);
	}
}
