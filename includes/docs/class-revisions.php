<?php
/**
 * Page revisions.
 *
 * @package Liber
 */

namespace Liber\Docs;

use WP_Post;

defined( 'ABSPATH' ) || exit;

/**
 * Pages save continuously, so revisions are snapshots: one per author every few
 * minutes, and the last 10 are kept.
 */
final class Revisions {

	public const INTERVAL = 10 * MINUTE_IN_SECONDS;

	public const TO_KEEP = 10;

	/**
	 * Hooks the filters.
	 */
	public function register(): void {
		add_filter( 'wp_save_post_revision_post_has_changed', array( $this, 'throttle' ), 10, 3 );
		add_filter( 'wp_' . Post_Type::NAME . '_revisions_to_keep', array( $this, 'to_keep' ) );
	}

	/**
	 * Skips the revision when the same author saved one in the last few minutes.
	 *
	 * @param bool    $has_changed     Whether the page changed since the latest revision.
	 * @param WP_Post $latest_revision Latest revision.
	 * @param WP_Post $post            Page being saved.
	 */
	public function throttle( bool $has_changed, WP_Post $latest_revision, WP_Post $post ): bool {
		if ( ! $has_changed || Post_Type::NAME !== $post->post_type ) {
			return $has_changed;
		}

		$same_author = get_current_user_id() === (int) $latest_revision->post_author;
		$is_recent   = time() - (int) strtotime( $latest_revision->post_date_gmt . ' UTC' ) < self::INTERVAL;

		return ! ( $same_author && $is_recent );
	}

	/**
	 * Number of revisions kept per page.
	 */
	public function to_keep(): int {
		return self::TO_KEEP;
	}
}
