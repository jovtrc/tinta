<?php
/**
 * Page link block: the linked page's current icon and title, "Private page"
 * for readers who can't open it, and nothing once it's gone or in the trash.
 *
 * @package Tinta
 *
 * @var array<string, mixed> $attributes Block attributes.
 */

use Tinta\Docs\Post_Type;
use Tinta\Workspace\Screen;

defined( 'ABSPATH' ) || exit;

$tinta_page_id = (int) ( $attributes['pageId'] ?? 0 );
$tinta_page    = get_post( $tinta_page_id );

if ( ! $tinta_page || Post_Type::NAME !== $tinta_page->post_type || 'trash' === $tinta_page->post_status ) {
	return;
}

if ( ! current_user_can( 'read_post', $tinta_page_id ) ) {
	printf(
		'<p %1$s><span class="wp-block-tinta-page-link__private">%2$s</span></p>',
		get_block_wrapper_attributes(), // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped by core.
		esc_html__( 'Private page', 'tinta' )
	);
	return;
}

$tinta_icon  = (string) get_post_meta( $tinta_page_id, Post_Type::ICON_META, true );
$tinta_title = get_the_title( $tinta_page );

printf(
	'<p %1$s><a class="wp-block-tinta-page-link__link" href="%2$s"><span class="wp-block-tinta-page-link__icon" aria-hidden="true">%3$s</span><span class="wp-block-tinta-page-link__title">%4$s</span></a></p>',
	get_block_wrapper_attributes(), // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped by core.
	esc_url( Screen::url( $tinta_page_id ) ),
	esc_html( $tinta_icon ? $tinta_icon : '📄' ),
	$tinta_title ? wp_kses_post( $tinta_title ) : esc_html__( 'Untitled', 'tinta' )
);
