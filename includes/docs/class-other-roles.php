<?php
/**
 * Keeps pages' files and notes out of other roles' listings.
 *
 * @package Liber
 */

namespace Liber\Docs;

use WP_Comment_Query;
use WP_Query;

defined( 'ABSPATH' ) || exit;

/**
 * Core already hides pages from people without a Liber role, but the media
 * library lists every file to anyone who can upload, and comment searches
 * count notes even when they can't be read. For those people, listings leave
 * out files attached to pages and notes on pages.
 */
final class Other_Roles {

	private const FLAG = 'liber_hide_pages';

	/**
	 * Hooks the listings.
	 */
	public function register(): void {
		add_filter( 'ajax_query_attachments_args', array( $this, 'flag' ) );
		add_action( 'pre_get_posts', array( $this, 'flag_media_screen' ) );
		add_filter( 'posts_where', array( $this, 'without_page_files' ), 10, 2 );
		add_filter( 'rest_comment_query', array( $this, 'flag' ) );
		add_filter( 'comments_clauses', array( $this, 'without_page_notes' ), 10, 2 );
	}

	/**
	 * Marks a query to leave pages out, for people without a Liber role.
	 *
	 * @param array<string, mixed> $args Query arguments.
	 * @return array<string, mixed>
	 */
	public function flag( array $args ): array {
		if ( ! current_user_can( 'read_private_liber_docs' ) ) {
			$args[ self::FLAG ] = true;
		}

		return $args;
	}

	/**
	 * Marks the Media screen's list view the same way.
	 *
	 * @param WP_Query $query Query.
	 */
	public function flag_media_screen( WP_Query $query ): void {
		if ( is_admin() && $query->is_main_query() && 'attachment' === $query->get( 'post_type' ) ) {
			$query->query_vars = $this->flag( $query->query_vars );
		}
	}

	/**
	 * Leaves out files attached to pages.
	 *
	 * @param string   $where WHERE clause.
	 * @param WP_Query $query Query.
	 */
	public function without_page_files( string $where, WP_Query $query ): string {
		global $wpdb;

		if ( ! $query->get( self::FLAG ) ) {
			return $where;
		}

		return $where . $wpdb->prepare(
			" AND {$wpdb->posts}.post_parent NOT IN ( SELECT ID FROM {$wpdb->posts} WHERE post_type = %s )",
			Post_Type::NAME
		);
	}

	/**
	 * Leaves out notes, and any other comments, on pages.
	 *
	 * @param array<string, string> $clauses Query clauses.
	 * @param WP_Comment_Query      $query   Query.
	 * @return array<string, string>
	 */
	public function without_page_notes( array $clauses, WP_Comment_Query $query ): array {
		global $wpdb;

		if ( ! empty( $query->query_vars[ self::FLAG ] ) ) {
			$clauses['where'] .= $wpdb->prepare(
				" AND {$wpdb->comments}.comment_post_ID NOT IN ( SELECT ID FROM {$wpdb->posts} WHERE post_type = %s )",
				Post_Type::NAME
			);
		}

		return $clauses;
	}
}
