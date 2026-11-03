<?php
/**
 * Blocks allowed in pages.
 *
 * @package Liber
 */

namespace Liber\Blocks;

use Liber\Docs\Post_Type;
use WP_Block_Editor_Context;

defined( 'ABSPATH' ) || exit;

/**
 * The blocks a page's editor offers: writing essentials, media, and Liber's two blocks.
 */
final class Allowlist {

	public const BLOCKS = array(
		'core/paragraph',
		'core/heading',
		'core/list',
		'core/list-item',
		'core/quote',
		'core/code',
		'core/preformatted',
		'core/image',
		'core/gallery',
		'core/file',
		'core/video',
		'core/embed',
		'core/separator',
		'core/table',
		'core/details',
		'liber/page-link',
		'liber/callout',
	);

	/**
	 * Hooks the filter.
	 */
	public function register(): void {
		add_filter( 'allowed_block_types_all', array( $this, 'filter' ), 10, 2 );
	}

	/**
	 * Limits the editor's blocks when it edits a page.
	 *
	 * @param bool|string[]           $allowed Blocks allowed so far; true for all.
	 * @param WP_Block_Editor_Context $context Editor context.
	 * @return bool|string[]
	 */
	public function filter( $allowed, WP_Block_Editor_Context $context ) {
		return Post_Type::NAME === $context->post?->post_type ? self::BLOCKS : $allowed;
	}
}
