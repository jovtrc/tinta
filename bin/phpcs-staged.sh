#!/usr/bin/env bash
#
# Runs PHPCS on staged PHP files (composer run phpcs:staged; the pre-commit hook).
# PHPCS ignores the ruleset's <exclude-pattern> for files named on the command
# line, so the patterns are read from phpcs.xml.dist and passed as --ignore.

set -euo pipefail

PHPCS="./vendor/bin/phpcs"
RULESET="./phpcs.xml.dist"

if [ ! -x "$PHPCS" ]; then
	echo "[phpcs:staged] $PHPCS not found. Run 'composer install'." >&2
	exit 1
fi

STAGED=$(git diff --cached --name-only --diff-filter=ACM -- '*.php' || true)
if [ -z "$STAGED" ]; then
	exit 0
fi

IGNORE=$(awk -F'[<>]' '/<exclude-pattern>.*<\/exclude-pattern>/{print $3}' "$RULESET" | paste -sd, -)

# shellcheck disable=SC2086
"$PHPCS" -q --ignore="$IGNORE" $STAGED
