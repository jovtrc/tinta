# Security policy

## Supported versions

Security fixes go into the latest release. Update to it before reporting.

## Reporting a vulnerability

Report it privately through GitHub: [report a vulnerability](https://github.com/jovtrc/tinta/security/advisories/new) (Security tab → Report a vulnerability). Please don't open a public issue, post in the support forum or share details elsewhere until a fix is released.

Include the Tinta, WordPress and PHP versions, single site or multisite, the steps that show the problem, and what someone could do with it. We'll confirm we got the report, work on a fix, and credit you in the release notes unless you'd rather not be named.

## Scope

Tinta's own code: above all, anything that lets someone read or change pages without the right Tinta role, or reach them while logged out.

Not in scope:
- Files added to pages have public URLs, like every WordPress upload. The readme says so.
- Problems in WordPress itself or in other plugins: report those to [WordPress](https://hackerone.com/wordpress) or to the plugin's authors.
