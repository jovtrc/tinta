<?php
/**
 * Plugin Name:       Tinta – Team Wiki
 * Description:       A private team wiki: pages in a tree, written in the block editor.
 * Version:           0.1.0
 * Requires at least: 7.1
 * Requires PHP:      8.2
 * Author:            João Carvalho
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       tinta
 *
 * @package Tinta
 */

defined( 'ABSPATH' ) || exit;

define( 'TINTA_VERSION', '0.1.0' );
define( 'TINTA_FILE', __FILE__ );

require_once __DIR__ . '/vendor/autoload.php';

register_activation_hook( __FILE__, array( Tinta\Setup\Installer::class, 'install' ) );

add_action( 'plugins_loaded', array( Tinta\Plugin::class, 'boot' ) );
