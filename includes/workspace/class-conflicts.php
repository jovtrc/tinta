<?php
/**
 * Plugins known to get in the workspace's way.
 *
 * @package Tinta
 */

namespace Tinta\Workspace;

defined( 'ABSPATH' ) || exit;

/**
 * A short list, updated each release, that the setup wizard checks against
 * the active plugins. Tinta only points them out; it never deactivates them.
 */
final class Conflicts {

	/**
	 * Active plugins on the list, with why each one matters.
	 *
	 * @return array<int, array{name: string, reason: string}>
	 */
	public static function active(): array {
		$active = array_merge(
			(array) get_option( 'active_plugins', array() ),
			array_keys( (array) get_site_option( 'active_sitewide_plugins', array() ) )
		);

		return array_values(
			array_filter(
				self::known(),
				static fn( array $plugin, string $file ): bool => in_array( $file, $active, true ),
				ARRAY_FILTER_USE_BOTH
			)
		);
	}

	/**
	 * The list, keyed by plugin file.
	 *
	 * @return array<string, array{name: string, reason: string}>
	 */
	private static function known(): array {
		$editor   = __( 'Turns off the block editor, which Tinta’s pages are written in.', 'tinta' );
		$rest     = __( 'Blocks the REST API, which the workspace uses to load and save pages.', 'tinta' );
		$redirect = __( 'Redirects people after they log in, which can skip the workspace when workspace mode is on.', 'tinta' );

		return array(
			'classic-editor/classic-editor.php'           => array(
				'name'   => 'Classic Editor',
				'reason' => $editor,
			),
			'disable-gutenberg/disable-gutenberg.php'     => array(
				'name'   => 'Disable Gutenberg',
				'reason' => $editor,
			),
			'disable-json-api/disable-json-api.php'       => array(
				'name'   => 'Disable REST API',
				'reason' => $rest,
			),
			'disable-wp-rest-api/disable-wp-rest-api.php' => array(
				'name'   => 'Disable WP REST API',
				'reason' => $rest,
			),
			'peters-login-redirect/wplogin_redirect.php'  => array(
				'name'   => 'LoginWP',
				'reason' => $redirect,
			),
		);
	}
}
