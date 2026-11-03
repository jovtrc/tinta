<?php
/**
 * Page link block: the linked page's current icon and title, "Private page"
 * for readers who can't open it, and nothing once it's gone or in the trash.
 *
 * @package Liber
 *
 * @var array<string, mixed> $attributes Block attributes.
 */

use Liber\Docs\Post_Type;
use Liber\Workspace\Screen;

defined( 'ABSPATH' ) || exit;

$liber_page_id = (int) ( $attributes['pageId'] ?? 0 );
$liber_page    = get_post( $liber_page_id );

if ( ! $liber_page || Post_Type::NAME !== $liber_page->post_type || 'trash' === $liber_page->post_status ) {
	return;
}

if ( ! current_user_can( 'read_post', $liber_page_id ) ) {
	printf(
		'<p %1$s><span class="wp-block-liber-page-link__private">%2$s</span></p>',
		get_block_wrapper_attributes(), // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped by core.
		esc_html__( 'Private page', 'liber' )
	);
	return;
}

$liber_icon  = (string) get_post_meta( $liber_page_id, Post_Type::ICON_META, true );
$liber_title = get_the_title( $liber_page );

printf(
	'<p %1$s><a class="wp-block-liber-page-link__link" href="%2$s"><span class="wp-block-liber-page-link__icon" aria-hidden="true">%3$s</span>%4$s</a></p>',
	get_block_wrapper_attributes(), // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped by core.
	esc_url( Screen::url( $liber_page_id ) ),
	esc_html( $liber_icon ? $liber_icon : '📄' ),
	$liber_title ? wp_kses_post( $liber_title ) : esc_html__( 'Untitled', 'liber' )
);
