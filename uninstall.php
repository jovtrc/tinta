<?php
/**
 * Runs when the plugin is deleted.
 *
 * @package Liber
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

require_once __DIR__ . '/vendor/autoload.php';

Liber\Setup\Uninstaller::uninstall();
