## Install an unreleased version

Sometimes, you want to use a version not available on the stores yet, or a beta version because a developer asked you.
If you're really sure you want to do it anyway, you can follow these steps:

### For Firefox

1. Add the beta version [from the Firefox Add-on site](https://addons.mozilla.org/firefox/addon/wallabagger-beta/)

### For Chromium-based browsers (Chrome, Vivaldi)

This version **WILL NOT** be updated automatically by your browser.

1. Download [the last pre-release CRX file](https://github.com/wallabag/wallabagger/releases)
2. Go to your browser's extension settings page
    - Chrome: `chrome://extensions/`
    - Vivaldi: `vivaldi:extensions`
    - Brave: `brave://extensions/`
3. Enable the developer mode (toggle on the top right corner)

![Developer mode](images/inst-developermode.png)

4. Drag 'n drop the CRX file to this page
5. Accept to install it

## Install the last work in progress version, should be stable, but not ready for production (**Really not recommended**)

1. Download [the last version of the source code](https://github.com/wallabag/wallabagger/archive/refs/heads/main.zip)
2. Unzip this file

### For Chromium-based browsers (Chrome, Vivaldi)

3. Follow the steps 2 and 3 of the previous section
4. Select the wallabagger folder (containing the *manifest.json* file)

### For Firefox (temporary installation)

3. Go to your browser's debugging settings page `about:debugging`
4. Open `This Firefox`
5. Click `Load Temporary Add-on...`
6. Select the `manifest.json` file from the wallabagger folder

### For Firefox for Android (temporary installation)

3. [Set up your computer and Android emulator or device](https://extensionworkshop.com/documentation/develop/developing-extensions-for-firefox-for-android/)
4. Connect your phone to your computer using USB
5. Run `adb devices` to list all devices
6. Go to the wallabagger folder (containing the *manifest.json* file)
7. Run `web-ext run -t firefox-android --adb-device XXX --firefox-apk org.mozilla.firefox`

## Beta versioning number

Look at the [versioning page](versioning) to get info about releases version numbers.
