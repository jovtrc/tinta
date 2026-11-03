#!/usr/bin/env bash
# Checks that the plugin header, LIBER_VERSION and the readme's Stable tag all
# carry the version, then prints that version's changelog entry from readme.txt.
#
# Usage: bin/release-notes.sh [version]   (default: the plugin header's version)

set -euo pipefail

cd "$(dirname "$0")/.."

header=$(sed -n 's/^ \* Version: *//p' liber.php)
constant=$(sed -n "s/^define( 'LIBER_VERSION', '\(.*\)' );/\1/p" liber.php)
stable=$(sed -n 's/^Stable tag: *//p' readme.txt)
version="${1:-$header}"

for found in "$header" "$constant" "$stable"; do
	if [ "$found" != "$version" ]; then
		echo "Version mismatch: expected $version, found header $header, LIBER_VERSION $constant, Stable tag $stable." >&2
		exit 1
	fi
done

notes=$(awk -v heading="= $version =" '$0 == heading { found = 1; next } found && /^= / { exit } found' readme.txt)

if [ -z "${notes//[[:space:]]/}" ]; then
	echo "readme.txt has no changelog entry for $version." >&2
	exit 1
fi

printf '%s\n' "$notes"
