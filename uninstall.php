<?php
/**
 * Runs when the plugin is deleted.
 *
 * @package Tinta
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

require_once __DIR__ . '/vendor/autoload.php';

Tinta\Setup\Uninstaller::uninstall();
