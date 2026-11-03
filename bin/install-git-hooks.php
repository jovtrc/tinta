<?php
/**
 * Installs the git hooks from composer.json (extra.hooks) after composer install/update.
 * Exits quietly without a .git folder or without dev dependencies (release builds).
 *
 * @package Liber
 */

$liber_root = dirname( __DIR__ );
$liber_bin  = $liber_root . '/vendor/bin/cghooks';

if ( ! is_dir( $liber_root . '/.git' ) || ! is_executable( $liber_bin ) ) {
	exit( 0 );
}

passthru( escapeshellarg( $liber_bin ) . ' update', $liber_exit_code ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.system_calls_passthru -- Dev-only script, not shipped.
exit( $liber_exit_code ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Exit status, not output.
