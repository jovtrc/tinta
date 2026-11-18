#!/usr/bin/env bash
# Sends one part of the plugin to wordpress.org's SVN between releases (a
# release itself goes through .github/workflows/wordpress-org.yml):
#
#   bin/wporg-svn.sh assets         .wordpress-org/ to assets/: the plugin
#                                   page's icon, banners, screenshots and
#                                   Live Preview blueprint.
#   bin/wporg-svn.sh trunk <build>  a build (bin/build-zip.sh's tinta/) to
#                                   trunk/, so translate.wordpress.org gets
#                                   new strings. tags/ and the stable version
#                                   stay as they are; it stops if the build's
#                                   Stable tag isn't a released version.
#
# Needs svn, SVN_USERNAME and SVN_PASSWORD. DRY_RUN=true lists the changes
# without committing them.

set -euo pipefail

cd "$(dirname "$0")/.."

part="${1:-}"
build="${2:-}"
repo="https://plugins.svn.wordpress.org/tinta"
svn_dir="$(mktemp -d)/tinta"

svn checkout --quiet --depth immediates "$repo" "$svn_dir"

case "$part" in
	assets)
		svn update --quiet --set-depth infinity "$svn_dir/assets"
		rsync -rc --delete .wordpress-org/ "$svn_dir/assets/"
		message="Update the plugin page assets from GitHub"
		;;
	trunk)
		if [ ! -f "$build/tinta.php" ]; then
			echo "Usage: bin/wporg-svn.sh trunk <build dir with tinta.php>" >&2
			exit 1
		fi
		stable=$(sed -n 's/^Stable tag: *//p' "$build/readme.txt" | tr -d '\r')
		if [ -z "$stable" ] || ! svn info "$repo/tags/$stable" >/dev/null 2>&1; then
			echo "The build's Stable tag ($stable) isn't a released version: trunk would become the stable version." >&2
			exit 1
		fi
		svn update --quiet --set-depth infinity "$svn_dir/trunk"
		rsync -rc --delete "$build/" "$svn_dir/trunk/"
		message="Update trunk with the development version from GitHub (stable stays $stable)"
		;;
	*)
		echo "Usage: bin/wporg-svn.sh assets | trunk <build dir>" >&2
		exit 1
		;;
esac

cd "$svn_dir"
svn add --quiet --force .
svn status | awk '/^!/ { print $2 }' | xargs -I% svn rm --quiet %@

for type in png:image/png jpg:image/jpeg gif:image/gif svg:image/svg+xml; do
	find assets -maxdepth 1 -name "*.${type%%:*}" -exec svn propset --quiet svn:mime-type "${type#*:}" {} + 2>/dev/null || true
done

if [ -z "$(svn status)" ]; then
	echo "Nothing changed."
	exit 0
fi

svn status

if [ "${DRY_RUN:-false}" = true ]; then
	echo "Dry run: nothing committed."
	exit 0
fi

svn commit --non-interactive --no-auth-cache \
	--username "$SVN_USERNAME" --password "$SVN_PASSWORD" \
	-m "$message (${GITHUB_SHA:-local})"
