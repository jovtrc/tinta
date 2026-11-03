=== Tinta – Team Wiki ===
Contributors: jcarvalho
Tags: wiki, knowledge base, documentation, team, intranet
Requires at least: 7.1
Tested up to: 7.1
Requires PHP: 8.2
Stable tag: 0.1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A private team wiki in WordPress: pages inside pages, written in the block editor.

== Description ==

Tinta turns a WordPress site into a private wiki for your team. Write docs, notes and plans in the block editor, keep them in a tree of pages, and share them only with the people you invite.

= Features =

* Pages inside pages, up to five levels deep, in a sidebar tree you can drag to reorganize.
* The block editor, with a focused set of blocks plus two of Tinta's own: Callout and Page link.
* Saves as you type. One person edits a page at a time; others see who is editing.
* Notes on blocks, with replies, @mentions and resolve.
* Pinned and recent pages, emoji page icons, and ⌘K to find any page.
* Two roles: Members read and write every page, Viewers only read.
* Workspace mode (on by default): everyone lands in the workspace after logging in, and the site becomes private.
* Works on mobile, and on multisite (each site has its own workspace).

= Privacy =

Every page is private: only people with a Tinta role (and administrators) can read them, and nothing is ever public. Tinta stores everything in your own WordPress database and sends no data anywhere.

Images and files you add to pages go to the media library, like any WordPress upload. Tinta keeps them out of the media library for people without a Tinta role, but, as with all WordPress uploads, anyone who has a file's link can open it.

= Source code =

The JavaScript in `build/` is compiled from the TypeScript sources at https://github.com/jovtrc/tinta, where you can also report issues and contribute.

== Installation ==

1. Install and activate Tinta.
2. The setup wizard opens right away. It walks you through naming the workspace, choosing who new people are, adding sample pages, and workspace mode.
3. Invite your team from **Users → Add New**, as Members or Viewers.

== Frequently Asked Questions ==

= Who can see the pages? =

Administrators, Members and Viewers. Other roles, and logged-out visitors, can't.

= Do I have to make my whole site private? =

No. Workspace mode, which makes the site private, is on when you install Tinta. Turn it off in the setup wizard or later in Workspace settings, and the rest of the site works as usual, with the workspace in the admin.

= What happens to the pages if I delete Tinta? =

They stay in your database. Deleting the plugin removes its roles, settings and preferences, but never your team's pages.

== Changelog ==

= 0.1.0 =
* First release.
