# Changelog

## New in 1.24.0

- Fix #530 - Add domain to the fetch locally white list from the right click context menu on a link
- Translations updated
- Changelog added

## New in 1.23.5.1 (beta)

- Fix #530 - Add domain to the fetch locally white list from the right click context menu on a link

## New in 1.23.5.0 (beta)

- Fix #558 DOMParser issue with Chrome
- Technical chores

## New in 1.23.4

- Chores
- Translations

## New in 1.23.3

- Tests added + CI
- Fix for Europresse

## New in 1.23.2

- Fix content always fetched from browser

## New in 1.23.1

- Fix concurrency issue on adding multiple pages quickly

## New in 1.23.0

- Fix #537 Firefox reader mode
- Europresse handling (use it with Ophirofox)
- Translations updated
- Chores

## New in 1.22.0

- Addon available on Firefox for Android
- Adjust type of setting-file to json when saving by @DBaakman in #503
- Translations update from Hosted Weblate by @weblate in #506
- Bump eslint from 9.39.1 to 9.39.2 by @dependabot[bot] in #508

## New in 1.21.0

- Adding go to options page from the icon context menu (Firefox only)
- Locally fetched content message added (displayed in the popup on content saving)
- Adding locally fetched URL reduced to origin only (no more cut for URLs, you put anything you want, we clean the useless part)
- Fix client selector uncatched error
- Manifest v3 allow insecure connections for self hosted wallabag instances (self hosted insecure connections are back)
- Bump @eslint/eslintrc from 3.3.1 to 3.3.3 by @dependabot[bot] in #496
- Translations update from Hosted Weblate by @weblate in #497
- Translations update from Hosted Weblate by @weblate in #498
- Translations update from Hosted Weblate by @weblate in #500

## New in 1.20.0

- New login workflow
- Lot of changes under the hood

## New in 1.19.0

## New in 1.18.1 (Chrome version)

- Edge hint
- New wallabag API token workflow
- login and developer URI cleaned from URL check
- Removing misleading expiring token info
- Update fetch global sites UI
- Only ask for tabs permission when needed
- Translations update

- Fix check token setup page (thanks Google)

## New in 1.18.0 (Chrome version)

- Manifest version 3 migration (thanks Google)

## New in 1.17.0

- Update README.md - Broken tutorial link fix
- Pass hashed URL to Wallabag when testing for entry existence, rather than cleartext URL

## New in 1.16.0
- adds an option to fetch locally by default

## New in 1.15.0
- Translations updated

## New in 1.14.0
- Fetch content directly from the browser

## New in 1.13.1
- Avoid unarchive state if ArchiveByDefault not set (existing entries were unarchive by default)

## New in 1.13.0
- Add support for dark theme in Firefox
- popup: Make delete button primary

## New in 1.12.0
- Update Croatian translation for messages.json
- Update German translation for messages.json

## New in 1.11.0
- Add Croatian (hr) translation
- Auto add tag if found only one
- Default popup wallabag icon style updated (vertical spacing added)
- Input values trimmed (copy/paste with extra starting or ending spaces cleaned)


## New in 1.10.4
- reducing permissions

## New in 1.10
- Japanese translation
- backspace returns last tag to edit
- Fix popup action buttons accessibility
- selecting and deleting tags with keyboard


## New in 1.9
- china translation
- option for automatic archive article

## New in 1.7
- Open preferences in another tab (same behavior between browsers)
- Responsive layout improved
- Better wallabag's URL handling (protocol removing, protocol type detection)
- Fix icon keeping the good green status
- Meta charset added to popup.html
- Fix translation typo
- Open options page after installed

## New in 1.6
-some fixes

## New in 1.4.5
- French and Russian translations
- some fixes

## New in 1.4.4
-navigate in found tags with Ctrl+Arrows
-some fixes

## New in v1.4.2
- fixed saving with context menu

## New in v1.4
- totally asyncronous, much faster

## New in v1.3
- Indication that this page is already saved by green icon
- Option to enable\disable indication

## New in v1.2
- Hotkeys for background saving
- Context menu for saving page and link
- Context menu items for goto various wallabag pages
- Tagging work improvements
- Webextension compatibility - works in Firefox browser

## New in v1.1
- Fixed archived flag
- implements : option "Allow space in tags" switch fix tags key to enter
- focus set to tag input right after open
- right key add first found tag
