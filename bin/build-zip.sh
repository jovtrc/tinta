#!/usr/bin/env bash
# Builds the release: only what WordPress runs (the plugin files, the built
# assets and Composer's autoloader) plus readme.txt, and its zip. Anything not
# listed here stays out. Run `pnpm build` first.
#
# Usage: bin/build-zip.sh [output dir]   (default: dist)
# Writes <output dir>/tinta/ and <output dir>/tinta.zip.

set -euo pipefail

cd "$(dirname "$0")/.."

files=( tinta.php uninstall.php readme.txt composer.json includes build )
out="${1:-dist}"
plugin="$out/tinta"

if [ ! -f build/workspace.js ]; then
	echo "build/ is missing: run pnpm build first." >&2
	exit 1
fi

rm -rf "$plugin" "$out/tinta.zip"
mkdir -p "$plugin"
cp -R "${files[@]}" composer.lock "$plugin/"

# The color scheme is a stylesheet; webpack also emits an empty script for it.
rm -f "$plugin"/build/admin-colors/*.js "$plugin"/build/admin-colors/*.asset.php
find "$plugin" -name .DS_Store -delete

composer install --working-dir="$plugin" --no-dev --optimize-autoloader \
	--no-scripts --no-interaction --no-progress --quiet
rm "$plugin/composer.lock"
(cd "$out" && zip -qr tinta.zip tinta)

echo "$out/tinta.zip"
