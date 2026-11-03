<?php
/**
 * Installs the git hooks from composer.json (extra.hooks) after composer install/update.
 * Exits quietly without a .git folder or without dev dependencies (release builds).
 *
 * @package Tinta
 */

$tinta_root = dirname( __DIR__ );
$tinta_bin  = $tinta_root . '/vendor/bin/cghooks';

if ( ! is_dir( $tinta_root . '/.git' ) || ! is_executable( $tinta_bin ) ) {
	exit( 0 );
}

passthru( escapeshellarg( $tinta_bin ) . ' update', $tinta_exit_code ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.system_calls_passthru -- Dev-only script, not shipped.
exit( $tinta_exit_code ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Exit status, not output.
