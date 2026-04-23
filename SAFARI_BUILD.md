# Building Wallabagger for Safari

Wallabagger is a browser extension for [wallabag](https://wallabag.org) that saves full page content from your browser to your wallabag instance. Unlike extensions that only send URLs, Wallabagger captures the rendered page content directly from the browser, bypassing anti-scraping protections (e.g. Cloudflare) that block server-side fetching.

This guide covers building Wallabagger as a Safari Web Extension on macOS.

## Why Safari?

The existing [wallabag-macos](https://github.com/jandamm/wallabag-macos) Safari extension only sends URLs to wallabag for server-side fetching. Many websites block these requests with Cloudflare or similar bot protection, resulting in empty or failed article saves. Wallabagger sends the actual page content from the browser, which bypasses this problem entirely.

## Prerequisites

- **macOS 14 (Sonoma)** or later (earlier versions may work but are untested)
- **Xcode** (free from the App Store, ~12GB) — the full IDE, not just Command Line Tools
- **Node.js and npm** — for building the extension source
- **An Apple Developer account** is _not_ required for local/unsigned builds

## Build Steps

### 1. Clone and build the extension

```bash
git clone https://github.com/wallabag/wallabagger.git
cd wallabagger
npm install
npm run build
```

This produces the extension source in the `wallabagger/` directory.

### 2. Apply Safari manifest changes

The upstream `manifest.json` needs two changes for Safari compatibility. Edit `wallabagger/manifest.json`:

**a) Remove the duplicate `scripts` key from the `background` section.**

The upstream manifest has both `scripts` and `service_worker` in the `background` block. Safari does not support both simultaneously. Remove the `scripts` line, keeping only `service_worker` (required for ES module support):

```json
  "background": {
    "service_worker": "js/background.js",
    "type": "module"
  },
```

**b) Change `optional_host_permissions` to `host_permissions`.**

Safari does not reliably support `optional_host_permissions` or the `browser.permissions.request()` API for host origins. Change:

```json
  "optional_host_permissions": [
    "*://*/api/*"
  ],
```

to:

```json
  "host_permissions": [
    "*://*/*"
  ],
```

This grants the extension permission to reach your wallabag API. You will still need to approve this in Safari's extension settings.

### 3. Point Xcode to the full Xcode installation

If you haven't already, ensure `xcode-select` points to the full Xcode app (not just Command Line Tools):

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

### 4. Convert to a Safari Web Extension

```bash
/Applications/Xcode.app/Contents/Developer/usr/bin/safari-web-extension-converter wallabagger/ \
    --project-location SafariExtension \
    --app-name "Wallabagger for Safari" \
    --bundle-identifier com.wallabag.wallabagger-safari \
    --no-open
```

This generates an Xcode project in `SafariExtension/`. You will see warnings about unsupported keys (`type`, `open_in_tab`, `theme_icons`) — these are cosmetic and can be safely ignored.

### 5. Build from the command line

```bash
cd "SafariExtension/Wallabagger for Safari"
xcodebuild -project "Wallabagger for Safari.xcodeproj" \
    -scheme "Wallabagger for Safari (macOS)" \
    -configuration Debug build
```

Alternatively, open the `.xcodeproj` in Xcode and press **Cmd+R** to build and run.

### 6. Launch the extension

```bash
open ~/Library/Developer/Xcode/DerivedData/Wallabagger_for_Safari-*/Build/Products/Debug/Wallabagger\ for\ Safari.app
```

The companion app will launch. You can close it — the extension stays active.

### 7. Enable the extension in Safari

1. Open **Safari > Settings > Advanced**
2. Check **Show features for web developers**
3. Go to **Safari > Developer** and enable **Allow Unsigned Extensions**
4. Go to **Safari > Settings > Extensions**
5. Enable **Wallabagger**
6. In the extension's permissions, grant access to **All Websites** (or at minimum your wallabag domain)

### 8. Configure the extension

1. Click the Wallabagger icon in the Safari toolbar
2. Enter your wallabag instance URL (e.g. `https://wallabag.example.com`)
3. Click **Check URL** — it should show "OK" and display the API version
4. If prompted about permissions, click **Agree**
5. Click **"fill in the credentials manually"** to reveal the credential fields
6. Enter your **Client ID** and **Client Secret** (found in your wallabag instance at `/developer` or under API clients management)
7. Enter your wallabag **username** and **password**
8. Click **Get token** — it should show "Granted"

## Troubleshooting

### "Allow Unsigned Extensions" required

For local builds without an Apple Developer account, you need to enable unsigned extensions each time Safari is launched:

**Safari > Developer > Allow Unsigned Extensions**

This setting resets every time Safari is quit.

### Background script not loaded

If the extension appears in Safari but doesn't work, check **Safari > Develop > Web Extension Background Content**. If it says "not loaded":

- Verify the manifest changes in Step 2 were applied correctly
- The `background` section must use `service_worker` (not `scripts`) for ES module `import` statements to work
- Rebuild the Safari extension from scratch (delete `SafariExtension/` and repeat from Step 4)

### Extension permissions not working

Safari handles host permissions through its own UI rather than browser popup prompts. If the options page shows "permissions: Not checked":

1. Go to **Safari > Settings > Extensions > Wallabagger**
2. Set website access to **All Websites** or add your wallabag domain
3. Re-click **Check URL** in the extension options

### Extension not appearing

- Make sure the companion app has been launched at least once
- Check **Safari > Settings > Extensions** to verify the extension is listed
- Try toggling the extension off and on

### API connection issues

- Verify your wallabag URL uses HTTPS
- Ensure you have created an API client in wallabag (at `https://your-instance/developer`)
- Check that your wallabag instance is reachable from your Mac

## Known Limitations

- The extension must be re-authorized via "Allow Unsigned Extensions" after each Safari restart (unless signed with a developer certificate)
- Safari's WebExtension API has some differences from Firefox/Chrome — some features may behave differently
- Context menus may not appear in all contexts
- This has not been tested for App Store distribution

## Publishing to the App Store

If you'd like to make this available to all Safari users without requiring "Allow Unsigned Extensions":

1. Enroll in the [Apple Developer Program](https://developer.apple.com/programs/) ($99/year)
2. Configure code signing in the Xcode project with your developer certificate
3. Archive the app via **Product > Archive**
4. Submit for review through App Store Connect

Community contributions to get this officially published are welcome.
