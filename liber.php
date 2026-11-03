<?php
/**
 * Plugin Name:       Liber
 * Description:       A private team wiki: pages in a tree, written in the block editor.
 * Version:           0.1.0
 * Requires at least: 7.1
 * Requires PHP:      8.2
 * Author:            João Carvalho
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       liber
 *
 * @package Liber
 */

defined( 'ABSPATH' ) || exit;

define( 'LIBER_VERSION', '0.1.0' );

require_once __DIR__ . '/vendor/autoload.php';

register_activation_hook( __FILE__, array( Liber\Setup\Installer::class, 'install' ) );

add_action( 'plugins_loaded', array( Liber\Plugin::class, 'boot' ) );
