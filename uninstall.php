<?php
/**
 * Runs when the plugin is deleted.
 *
 * @package Liber
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

require_once __DIR__ . '/includes/autoload.php';

Liber\Setup\Uninstaller::uninstall();
